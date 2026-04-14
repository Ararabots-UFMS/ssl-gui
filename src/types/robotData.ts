export interface Robot {
  id: number;
  position_x: number;
  position_y: number;
  orientation: number;
}

export interface Ball {
  id: number;
  position_x: number;
  position_y: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  velocity_x: number;
  velocity_y: number;
  timestamp: number;
}

export interface RobotTrajectory {
  robot_id: number;
  points: TrajectoryPoint[];
  total_duration: number;
}

export interface TrajectoryData {
  trajectories: RobotTrajectory[];
}
