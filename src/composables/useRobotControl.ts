import { ref, computed, readonly } from 'vue'
import { socket } from '@/robotData/robotData'
import { ballBuffer, robotBuffers } from '@/robotData/fieldBuffers'

export type ControlMode = 'strategy' | 'manual'
export type Team = 'yellow' | 'blue'

export interface FieldPoint { x: number; y: number }

const MODE_KEY = 'controlMode'

/**
 * Selection and control-mode state shared between the field canvas and the Estratégia
 * panel. Module scope makes it a singleton, matching useTheme/useLogs.
 *
 * All field coordinates here are millimetres in the vision frame (origin at the centre
 * circle, +y up) — the same units the backend's MovementCommand expects, so nothing is
 * converted on the way out.
 */

// The backend is the authority; this is only a hint so the UI is not blank before
// control_mode_update arrives on connect.
const stored = localStorage.getItem(MODE_KEY)
const controlMode = ref<ControlMode>(stored === 'manual' ? 'manual' : 'strategy')

const selectedTeam = ref<Team>('yellow')
const selectedRobotId = ref<number | null>(null)
const lastTarget = ref<FieldPoint | null>(null)

export const isManual = computed(() => controlMode.value === 'manual')

export const selectedKey = computed(() =>
  selectedRobotId.value === null ? null : (`${selectedTeam.value}:${selectedRobotId.value}` as const),
)

socket.on('control_mode_update', (payload: { mode?: ControlMode; error?: string }) => {
  if (payload?.mode !== 'manual' && payload?.mode !== 'strategy') return
  controlMode.value = payload.mode
  localStorage.setItem(MODE_KEY, payload.mode)
})

function robotPosition(team: Team, id: number): FieldPoint | null {
  const s = robotBuffers[team].get(id)
  return s ? { x: s.x, y: s.y } : null
}

/** Every robot of the given team we currently have a position for. */
function teamRobots(team: Team): { robot_id: number; position_x: number; position_y: number }[] {
  return Array.from(robotBuffers[team], ([id, s]) => ({
    robot_id: id,
    position_x: s.x,
    position_y: s.y,
  }))
}

export function setControlMode(mode: ControlMode) {
  if (mode === 'manual') {
    // Strategy's last goals stay latched in movement_manager, so robots keep driving to
    // them after strategy goes quiet. The positions ride along with the mode switch so
    // the backend can park them in the same handler -- as a separate stopRobots event it
    // would race the mode change and be refused.
    socket.emit('controlMode', { mode, robots: teamRobots(selectedTeam.value) })
  } else {
    lastTarget.value = null
    socket.emit('controlMode', { mode })
  }
  // Optimistic; control_mode_update confirms or corrects it.
  controlMode.value = mode
  localStorage.setItem(MODE_KEY, mode)
}

export function selectRobot(team: Team, id: number) {
  selectedTeam.value = team
  selectedRobotId.value = id
  lastTarget.value = null
}

export function clearSelection() {
  selectedRobotId.value = null
  lastTarget.value = null
}

/**
 * Heading that makes the robot face the ball once it arrives.
 *
 * Aimed from the target, not from where the robot is now, and snapshotted when the
 * command is sent — a debug move does not track a rolling ball.
 */
export function headingToBall(from: FieldPoint): number | null {
  const ball = ballBuffer[0]
  if (!ball) return null
  return Math.atan2(ball.y - from.y, ball.x - from.x)
}

/** Send the selected robot to a field point. Returns false if it could not be sent. */
export function sendTargetTo(point: FieldPoint): boolean {
  const id = selectedRobotId.value
  if (id === null || !isManual.value) return false

  socket.emit('strategyCommand', {
    robot_id: id,
    position_x: point.x,
    position_y: point.y,
    velocity_x: 0,
    velocity_y: 0,
  })

  const heading = headingToBall(point)
  if (heading !== null) {
    socket.emit('setOrientation', { robot_id: id, orientation: heading })
  }

  lastTarget.value = point
  return true
}

/** Park the selected robot where it currently is. */
export function stopSelectedRobot(): boolean {
  const id = selectedRobotId.value
  if (id === null || !isManual.value) return false

  const pos = robotPosition(selectedTeam.value, id)
  if (!pos) return false

  socket.emit('stopRobots', {
    robots: [{ robot_id: id, position_x: pos.x, position_y: pos.y }],
  })
  lastTarget.value = null
  return true
}

export function useRobotControl() {
  return {
    controlMode: readonly(controlMode),
    isManual,
    selectedTeam,
    selectedRobotId,
    selectedKey,
    lastTarget,
    setControlMode,
    selectRobot,
    clearSelection,
    sendTargetTo,
    stopSelectedRobot,
  }
}
