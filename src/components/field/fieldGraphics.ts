import { Graphics } from 'pixi.js'
import type { FieldGeometry, FieldPalette } from './fieldConfig'
import type { LiveFieldGeometry } from '@/robotData/fieldGeometry'

/**
 * Draw the field from the SSL Vision geometry message: every line and arc
 * comes directly from the wire, so the rendering matches whatever the vision
 * node is publishing (real or simulated).
 */
export function drawFieldFromLive(g: Graphics, live: LiveFieldGeometry, pal: FieldPalette): void {
  g.clear()

  const totalW = live.field_length + 2 * live.boundary_width
  const totalH = live.field_width + 2 * live.boundary_width

  // Outer boundary (includes the run-off area around the play field).
  g.rect(-totalW / 2, -totalH / 2, totalW, totalH)
   .fill({ color: pal.fieldBgInner })
  g.rect(-totalW / 2, -totalH / 2, totalW, totalH)
   .stroke({ color: pal.borderColor, width: 20, alignment: 0.5 })

  // Goals: highlight the goal area subtly so it reads as a goal,
  // separate from the field-line strokes that the message itself contains.
  const halfPlay = live.field_length / 2
  const goalH = live.goal_width
  const goalW = live.goal_depth
  g.rect(-halfPlay - goalW, -goalH / 2, goalW, goalH)
   .fill({ color: pal.goalColor, alpha: 0.06 })
  g.rect(halfPlay, -goalH / 2, goalW, goalH)
   .fill({ color: pal.goalColor, alpha: 0.06 })

  // All field lines as published.
  for (const line of live.field_lines) {
    g.moveTo(line.x1, line.y1).lineTo(line.x2, line.y2)
     .stroke({ color: pal.lineColor, width: line.thickness })
  }

  // All field arcs as published (center circle, etc.). Use circle() when the
  // arc is a full revolution to avoid the start/end pen artifact, and
  // moveTo() to the arc's start otherwise so we don't connect from wherever
  // the previous line stroke left the pen.
  for (const arc of live.field_arcs) {
    const sweep = arc.end_angle - arc.starting_angle
    if (Math.abs(Math.abs(sweep) - 2 * Math.PI) < 1e-3) {
      g.circle(arc.x, arc.y, arc.radius)
       .stroke({ color: pal.lineColor, width: arc.thickness })
    } else {
      const sx = arc.x + arc.radius * Math.cos(arc.starting_angle)
      const sy = arc.y + arc.radius * Math.sin(arc.starting_angle)
      g.moveTo(sx, sy)
       .arc(arc.x, arc.y, arc.radius, arc.starting_angle, arc.end_angle)
       .stroke({ color: pal.lineColor, width: arc.thickness })
    }
  }
}

/**
 * Fallback: render from the static FIELD_GEOMETRIES table when no live
 * geometry has arrived yet. Keeps the GUI usable before the vision node
 * publishes its first geometry frame.
 */
export function drawField(g: Graphics, geo: FieldGeometry, pal: FieldPalette): void {
  g.clear()

  const t = geo.lineThicknessMm
  const halfPW = geo.playW / 2
  const halfPH = geo.playH / 2

  g.rect(-geo.fieldW / 2, -geo.fieldH / 2, geo.fieldW, geo.fieldH)
   .fill({ color: pal.fieldBgInner })

  g.rect(-geo.fieldW / 2, -geo.fieldH / 2, geo.fieldW, geo.fieldH)
   .stroke({ color: pal.borderColor, width: t * 2, alignment: 0.5 })

  g.rect(-halfPW, -halfPH, geo.playW, geo.playH)
   .stroke({ color: pal.lineColor, width: t })

  g.moveTo(0, -halfPH).lineTo(0, halfPH)
   .stroke({ color: pal.lineColor, width: t })

  g.moveTo(-halfPW, 0).lineTo(halfPW, 0)
   .stroke({ color: pal.lineColor, width: t })

  g.circle(0, 0, geo.centerCircleR)
   .stroke({ color: pal.lineColor, width: t })

  if (geo.centerDotR > 0) {
    g.circle(0, 0, geo.centerDotR).fill({ color: pal.lineColor })
  }

  const goalHalfH = geo.goalH / 2
  g.rect(-halfPW - geo.goalW, -goalHalfH, geo.goalW, geo.goalH)
   .fill({ color: pal.goalColor, alpha: 0.06 })
   .stroke({ color: pal.goalColor, width: t })
  g.rect(halfPW, -goalHalfH, geo.goalW, geo.goalH)
   .fill({ color: pal.goalColor, alpha: 0.06 })
   .stroke({ color: pal.goalColor, width: t })

  const defHalfH = geo.defenseH / 2
  g.rect(-halfPW, -defHalfH, geo.defenseW, geo.defenseH)
   .stroke({ color: pal.lineColor, width: t })
  g.rect(halfPW - geo.defenseW, -defHalfH, geo.defenseW, geo.defenseH)
   .stroke({ color: pal.lineColor, width: t })
}
