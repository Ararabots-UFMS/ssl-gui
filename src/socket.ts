import { reactive, ref } from 'vue';
import { io } from "socket.io-client";

interface Robot { id: number; position_x: number; position_y: number; orientation: number; }
interface Ball { id: number; position_x: number; position_y: number; }

export const yellowRobots = reactive<Robot[]>([]);
export const blueRobots = reactive<Robot[]>([]);
export const balls = reactive<Ball[]>([]);

export const trajectories = reactive<{ [key: string]: { [key: string]: { x: number, y: number }[] } }>({ yellow: {}, blue: {} });

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
socket.on("update_trajectories", (payload) => {
  Object.keys(trajectories).forEach(team => {
    Object.keys(trajectories[team]).forEach(key => delete trajectories[team][key]);
    Object.assign(trajectories[team], payload[team] || {});
  });
});
socket.on("refereeOutput", (event) => { if(event?.line) refereeLog.value.unshift(event.line); });
socket.on("visionOutput", (event) => { if(event?.line) visionLog.value.unshift(event.line); });
socket.on("communicationOutput", (event) => { if(event?.line) communicationLog.value.unshift(event.line); });