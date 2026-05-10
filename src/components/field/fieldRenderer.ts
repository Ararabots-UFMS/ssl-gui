import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { robotBuffers, ballBuffer, trajectoryBuffer, versions } from '@/robotData/fieldBuffers'
import {
  FIELD_GEOMETRIES, loadPalette, ROBOT_RADIUS_MM, ROBOT_RING_WIDTH_MM,
  ROBOT_LABEL_FONT_MM, ROBOT_LABEL_STROKE_MM, BALL_RADIUS_MM, TRAJECTORY_STYLE,
  SMOOTH_ALPHA_POS, SMOOTH_ALPHA_ROT, TRAJECTORY_REDRAW_INTERVAL_MS,
  TELEPORT_SNAP_DIST_M, TELEPORT_SNAP_ROT_RAD,
  type FieldType, type FieldPalette,
} from './fieldConfig'
import { drawField, drawFieldFromLive } from './fieldGraphics'
import { liveFieldGeometry, type LiveFieldGeometry } from '@/robotData/fieldGeometry'
import { watch, type WatchStopHandle } from 'vue'

interface RobotSprite {
  container: Container
  ring: Graphics
  body: Graphics
  highlight: Graphics
  label: Text
  team: 'yellow' | 'blue'
  // Smoothed render state (lerps toward buffer values)
  curX: number
  curY: number
  curRot: number
  hasPose: boolean
}

interface BallSprite {
  outer: Graphics
  inner: Graphics
  curX: number
  curY: number
  hasPose: boolean
}

// Shortest signed difference between two angles, in (-π, π].
function angleDiff(target: number, current: number): number {
  let d = (target - current) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  else if (d < -Math.PI) d += Math.PI * 2
  return d
}

export class FieldRenderer {
  private app!: Application
  private host: HTMLElement
  private fieldType: FieldType
  private palette: FieldPalette
  private ready = false

  private root = new Container()
  private fieldLayer = new Graphics()
  private trajectoryLayer = new Container()
  private ballLayer = new Container()
  private robotLayer = new Container()

  private robotSprites = new Map<string, RobotSprite>()
  private ballSprites: BallSprite[] = []
  private trajectoryGraphics = new Map<number, Graphics>()

  private showTrajectories = true
  private lastTrajectoryVersion = -1
  private lastTrajectoryDrawTs = 0
  private resizeObserver?: ResizeObserver
  private liveGeo: LiveFieldGeometry | null = null
  private liveGeoStopWatch?: WatchStopHandle

  constructor(host: HTMLElement, fieldType: FieldType, showTrajectories: boolean) {
    this.host = host
    this.fieldType = fieldType
    this.showTrajectories = showTrajectories
    this.palette = loadPalette(fieldType)
  }

  async init(): Promise<void> {
    this.app = new Application()
    await this.app.init({
      background: this.palette.fieldBg,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      resizeTo: this.host,
    })
    this.host.appendChild(this.app.canvas)

    this.app.stage.addChild(this.root)
    this.root.addChild(this.fieldLayer)
    this.root.addChild(this.trajectoryLayer)
    this.root.addChild(this.ballLayer)
    this.root.addChild(this.robotLayer)
    this.trajectoryLayer.visible = this.showTrajectories

    this.liveGeo = liveFieldGeometry.value
    this.liveGeoStopWatch = watch(liveFieldGeometry, (g) => {
      this.liveGeo = g
      if (!this.ready) return
      this.redrawField()
      this.resize()
    }, { deep: true })

    this.redrawField()
    this.resize()

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.host)

    this.app.ticker.add(this.tick)
    this.ready = true
  }

  setFieldType(t: FieldType): void {
    this.fieldType = t
    this.palette = loadPalette(t)
    if (!this.ready) return
    this.app.renderer.background.color = this.palette.fieldBg
    this.redrawField()
    this.resize()
    this.lastTrajectoryVersion = -1
  }

  setShowTrajectories(v: boolean): void {
    this.showTrajectories = v
    this.trajectoryLayer.visible = v
  }

  reloadTheme(): void {
    this.palette = loadPalette(this.fieldType)
    if (!this.ready) return
    this.app.renderer.background.color = this.palette.fieldBg
    this.redrawField()
    for (const s of this.robotSprites.values()) this.paintRobot(s)
    this.lastTrajectoryVersion = -1
  }

  destroy(): void {
    this.resizeObserver?.disconnect()
    this.liveGeoStopWatch?.()
    if (this.ready) {
      this.app.ticker.remove(this.tick)
      this.app.destroy(true, { children: true, texture: true })
    }
  }

  private redrawField(): void {
    if (this.liveGeo) {
      drawFieldFromLive(this.fieldLayer, this.liveGeo, this.palette)
    } else {
      drawField(this.fieldLayer, FIELD_GEOMETRIES[this.fieldType], this.palette)
    }
  }

  /** Total drawable extents (mm) — prefers live geometry when available. */
  private fieldExtents(): { w: number; h: number } {
    if (this.liveGeo) {
      return {
        w: this.liveGeo.field_length + 2 * this.liveGeo.boundary_width,
        h: this.liveGeo.field_width  + 2 * this.liveGeo.boundary_width,
      }
    }
    const geo = FIELD_GEOMETRIES[this.fieldType]
    return { w: geo.fieldW, h: geo.fieldH }
  }

  resize(): void {
    if (!this.ready) return
    const w = this.host.clientWidth
    const h = this.host.clientHeight
    if (w === 0 || h === 0) return
    // Pixi's `resizeTo: host` listens to window resize, not element resize,
    // so we must drive the renderer ourselves when the host reflows
    // (e.g. side panel toggle or grid-template changes).
    this.app.renderer.resize(w, h)
    const ext = this.fieldExtents()
    const scale = Math.min(w / ext.w, h / ext.h)
    this.root.scale.set(scale, -scale)
    this.root.position.set(w / 2, h / 2)
  }

  private tick = (): void => {
    this.syncRobots()
    this.syncBalls()
    if (versions.trajectory !== this.lastTrajectoryVersion) {
      const now = performance.now()
      if (now - this.lastTrajectoryDrawTs >= TRAJECTORY_REDRAW_INTERVAL_MS) {
        this.redrawTrajectories()
        this.lastTrajectoryVersion = versions.trajectory
        this.lastTrajectoryDrawTs = now
      }
    }
  }

  private syncRobots(): void {
    const seen = new Set<string>()
    for (const [id, state] of robotBuffers.yellow) {
      seen.add(`yellow:${id}`)
      this.updateRobotSprite(id, 'yellow', state.x, state.y, state.orientation)
    }
    for (const [id, state] of robotBuffers.blue) {
      seen.add(`blue:${id}`)
      this.updateRobotSprite(id, 'blue', state.x, state.y, state.orientation)
    }
    for (const [key, s] of Array.from(this.robotSprites)) {
      if (!seen.has(key)) {
        this.robotLayer.removeChild(s.container)
        s.container.destroy({ children: true })
        this.robotSprites.delete(key)
      }
    }
  }

  private updateRobotSprite(id: number, team: 'yellow' | 'blue', x: number, y: number, rot: number): void {
    const key = `${team}:${id}`
    let s = this.robotSprites.get(key)
    if (!s) {
      s = this.createRobotSprite(team, id)
      this.robotSprites.set(key, s)
      this.robotLayer.addChild(s.container)
    }
    // First observation: snap to target (avoids initial "fly-in" from origin).
    if (!s.hasPose) {
      s.curX = x; s.curY = y; s.curRot = rot; s.hasPose = true
    } else {
      // Snap on teleport-sized jumps (e.g. user dragging a robot in grSim);
      // otherwise the lerp would render it as walking to the new pose.
      // Position is in meters; rotation in radians.
      const dx = x - s.curX, dy = y - s.curY
      if (dx * dx + dy * dy > TELEPORT_SNAP_DIST_M * TELEPORT_SNAP_DIST_M) {
        s.curX = x; s.curY = y
      } else {
        s.curX += dx * SMOOTH_ALPHA_POS
        s.curY += dy * SMOOTH_ALPHA_POS
      }
      const dRot = angleDiff(rot, s.curRot)
      if (Math.abs(dRot) > TELEPORT_SNAP_ROT_RAD) {
        s.curRot = rot
      } else {
        s.curRot += dRot * SMOOTH_ALPHA_ROT
      }
    }
    s.container.position.set(s.curX, s.curY)
    s.container.rotation = s.curRot
  }

  private createRobotSprite(team: 'yellow' | 'blue', id: number): RobotSprite {
    const container = new Container()
    const ring = new Graphics()
    const body = new Graphics()
    const highlight = new Graphics()

    const labelStyle = new TextStyle({
      fontFamily: 'system-ui, sans-serif',
      fontSize: ROBOT_LABEL_FONT_MM,
      fontWeight: '900',
      fill: this.palette.textColor,
      stroke: { color: this.palette.textStroke, width: ROBOT_LABEL_STROKE_MM },
    })
    const label = new Text({ text: String(id), style: labelStyle })
    label.anchor.set(0.5)
    label.scale.y = -1

    const s: RobotSprite = {
      container, ring, body, highlight, label, team,
      curX: 0, curY: 0, curRot: 0, hasPose: false,
    }
    container.addChild(body, ring, highlight, label)
    this.paintRobot(s)
    return s
  }

  private paintRobot(s: RobotSprite): void {
    const r = ROBOT_RADIUS_MM
    const teamColor = s.team === 'yellow' ? this.palette.yellowTeam : this.palette.blueTeam

    s.body.clear()
    s.body.circle(0, 0, r).fill({ color: this.palette.robotBody })

    s.ring.clear()
    s.ring.circle(0, 0, r).stroke({ color: teamColor, width: ROBOT_RING_WIDTH_MM })

    s.highlight.clear()
    s.highlight.ellipse(r * 0.3, -r * 0.4, r * 0.18, r * 0.28)
     .fill({ color: this.palette.robotHighlight, alpha: 0.4 })
  }

  private syncBalls(): void {
    while (this.ballSprites.length < ballBuffer.length) {
      const outer = new Graphics()
      const inner = new Graphics()
      const r = BALL_RADIUS_MM
      outer.circle(0, 0, r).fill({ color: this.palette.ballBase })
      inner.circle(r * 0.3, -r * 0.4, r * 0.4).fill({ color: this.palette.ballHighlight, alpha: 0.8 })
      this.ballLayer.addChild(outer)
      this.ballLayer.addChild(inner)
      this.ballSprites.push({ outer, inner, curX: 0, curY: 0, hasPose: false })
    }
    for (let i = 0; i < this.ballSprites.length; i++) {
      const s = this.ballSprites[i]
      const ball = ballBuffer[i]
      if (ball) {
        if (!s.hasPose) {
          s.curX = ball.x; s.curY = ball.y; s.hasPose = true
        } else {
          s.curX += (ball.x - s.curX) * SMOOTH_ALPHA_POS
          s.curY += (ball.y - s.curY) * SMOOTH_ALPHA_POS
        }
        s.outer.visible = true; s.inner.visible = true
        s.outer.position.set(s.curX, s.curY)
        s.inner.position.set(s.curX, s.curY)
      } else {
        s.outer.visible = false; s.inner.visible = false
        s.hasPose = false
      }
    }
  }

  private redrawTrajectories(): void {
    for (const [id, g] of Array.from(this.trajectoryGraphics)) {
      if (!trajectoryBuffer.has(id)) {
        this.trajectoryLayer.removeChild(g)
        g.destroy()
        this.trajectoryGraphics.delete(id)
      }
    }

    for (const [id, points] of trajectoryBuffer) {
      let g = this.trajectoryGraphics.get(id)
      if (!g) {
        g = new Graphics()
        this.trajectoryLayer.addChild(g)
        this.trajectoryGraphics.set(id, g)
      }
      g.clear()
      if (points.length < 2) continue

      const team = this.robotTeam(id)
      const color = team === 'yellow' ? this.palette.yellowTrail
        : team === 'blue' ? this.palette.blueTrail
        : this.palette.unknownTrail

      this.drawDashedPolyline(g, points, color)
    }
  }

  // Builds all dashes as subpaths (moveTo/lineTo) on a single Graphics then
  // issues exactly one .stroke() call. Points are in meters (as received).
  private drawDashedPolyline(g: Graphics, pts: { x: number; y: number }[], color: number): void {
    const { dashMm, gapMm, widthMm, opacity } = TRAJECTORY_STYLE
    let carry = 0
    let penDown = true
    let started = false

    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1]
      if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(b.x) || !Number.isFinite(b.y)) continue
      const ax = a.x * 1000, ay = a.y * 1000
      const bx = b.x * 1000, by = b.y * 1000
      const dx = bx - ax, dy = by - ay
      const segLen = Math.hypot(dx, dy)
      if (segLen === 0) continue
      const ux = dx / segLen, uy = dy / segLen

      let traveled = 0
      let cx = ax, cy = ay
      while (traveled < segLen) {
        const limit = penDown ? dashMm : gapMm
        const step = Math.min(limit - carry, segLen - traveled)
        if (penDown) {
          if (!started) { g.moveTo(cx, cy); started = true }
          else g.moveTo(cx, cy)
          g.lineTo(cx + ux * step, cy + uy * step)
        }
        cx += ux * step; cy += uy * step
        traveled += step
        carry += step
        if (carry >= limit) {
          penDown = !penDown
          carry = 0
        }
      }
    }

    if (started) {
      g.stroke({ color, width: widthMm, alpha: opacity, cap: 'round', join: 'round' })
    }
  }

  private robotTeam(id: number): 'yellow' | 'blue' | null {
    if (robotBuffers.yellow.has(id)) return 'yellow'
    if (robotBuffers.blue.has(id)) return 'blue'
    return null
  }
}
