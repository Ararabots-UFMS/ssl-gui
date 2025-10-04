import { reactive, ref } from 'vue';
import { io } from "socket.io-client";

interface Robot { id: number; position_x: number; position_y: number; orientation: number; }
interface Ball { id: number; position_x: number; position_y: number; }
interface TrajectoryPoint { x: number; y: number; velocity_x: number; velocity_y: number; timestamp: number; }
interface RobotTrajectory { robot_id: number; points: TrajectoryPoint[]; total_duration: number; }
interface TrajectoryData { trajectories: RobotTrajectory[]; }

export const yellowRobots = reactive<Robot[]>([]);
export const blueRobots = reactive<Robot[]>([]);
export const balls = reactive<Ball[]>([]);

export const trajectories = reactive<{ [key: number]: TrajectoryPoint[] }>({});

export const systemStatus = reactive({ guiConnected: false, visionNode: false, strategyService: false, pidService: false });

export const refereeLog = ref<string[]>(['Terminal do Juiz inicializado.']);
export const visionLog = ref<string[]>(['Terminal da Visão inicializado.']);
export const communicationLog = ref<string[]>(['Terminal de Comunicação inicializado.']);

const URL = "http://localhost:5000";
export const socket = io(URL);

socket.on("connect", () => {
    communicationLog.value.unshift(`[${new Date().toLocaleTimeString()}] ✅ Conexão estabelecida.`);
    systemStatus.guiConnected = true;
});
socket.on("disconnect", () => {
    communicationLog.value.unshift(`[${new Date().toLocaleTimeString()}] ❌ Conexão perdida.`);
    systemStatus.guiConnected = false; systemStatus.visionNode = false; systemStatus.strategyService = false;
});
socket.on("system_status", (payload) => { Object.assign(systemStatus, payload); });
socket.on("vision_update", (payload: { yellow: Robot[], blue: Robot[], balls: Ball[] }) => {
    yellowRobots.splice(0, yellowRobots.length, ...payload.yellow);
    blueRobots.splice(0, blueRobots.length, ...payload.blue);
    balls.splice(0, balls.length, ...payload.balls);
});
socket.on("trajectory_update", (payload: TrajectoryData) => {
  // Limpar trajetórias antigas
  Object.keys(trajectories).forEach(key => delete trajectories[parseInt(key)]);
  
  // Adicionar novas trajetórias
  payload.trajectories.forEach(robotTrajectory => {
    trajectories[robotTrajectory.robot_id] = robotTrajectory.points;
  });
});
socket.on("refereeOutput", (event) => { if(event?.line) refereeLog.value.unshift(event.line); });
socket.on("visionOutput", (event) => { if(event?.line) visionLog.value.unshift(event.line); });
socket.on("communicationOutput", (event) => { if(event?.line) communicationLog.value.unshift(event.line); });