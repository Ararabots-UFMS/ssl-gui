import { ref, computed } from 'vue'
import { socket } from './robotData'

export interface FieldLine {
  name: string
  x1: number; y1: number
  x2: number; y2: number
  thickness: number
}

export interface FieldArc {
  name: string
  x: number; y: number
  radius: number
  starting_angle: number
  end_angle: number
  thickness: number
}

export interface LiveFieldGeometry {
  field_length: number
  field_width: number
  goal_width: number
  goal_depth: number
  boundary_width: number
  field_lines: FieldLine[]
  field_arcs: FieldArc[]
}

export const liveFieldGeometry = ref<LiveFieldGeometry | null>(null)

socket.on('geometry_update', (payload: LiveFieldGeometry) => {
  if (!payload || typeof payload !== 'object') return
  // Defensive normalization — message may arrive with missing arrays.
  liveFieldGeometry.value = {
    field_length: Number(payload.field_length) || 0,
    field_width: Number(payload.field_width) || 0,
    goal_width: Number(payload.goal_width) || 0,
    goal_depth: Number(payload.goal_depth) || 0,
    boundary_width: Number(payload.boundary_width) || 0,
    field_lines: Array.isArray(payload.field_lines) ? payload.field_lines : [],
    field_arcs: Array.isArray(payload.field_arcs) ? payload.field_arcs : [],
  }
})

// Convenience reads that StrategyControl & friends can use to derive
// safe, geometry-aware preset positions. All values in millimeters.
export const halfFieldLength = computed(() => (liveFieldGeometry.value?.field_length ?? 0) / 2)
export const halfFieldWidth  = computed(() => (liveFieldGeometry.value?.field_width  ?? 0) / 2)
