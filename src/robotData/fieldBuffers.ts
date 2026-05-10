export interface RobotState {
  x: number
  y: number
  orientation: number
}

export interface BallState {
  id: number
  x: number
  y: number
}

export interface TrajPoint {
  x: number
  y: number
}

export const robotBuffers = {
  yellow: new Map<number, RobotState>(),
  blue: new Map<number, RobotState>(),
}

export const ballBuffer: BallState[] = []

export const trajectoryBuffer = new Map<number, TrajPoint[]>()

export const versions = {
  roster: 0,
  trajectory: 0,
}

export function bumpRoster() { versions.roster++ }
export function bumpTrajectory() { versions.trajectory++ }
