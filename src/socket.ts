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

// Track last seen referee command to avoid spamming the UI with unchanged updates
let _lastRefereeCommand: any = null;
let _lastRefereeCommandCounter: any = null;
// Vision watchdog
const VISION_WATCHDOG_TIMEOUT = 3000; // ms
let _visionTimer: ReturnType<typeof setTimeout> | null = null;
let _visionConnected = false;

function setVisionConnected(connected: boolean) {
  if (_visionConnected === connected) return;
  _visionConnected = connected;
  systemStatus.visionNode = connected;
  visionLog.value.unshift(`[${new Date().toLocaleTimeString()}] Visão ${connected ? 'conectada' : 'desconectada'}.`);
}

function resetVisionWatchdog() {
  if (_visionTimer) {
    clearTimeout(_visionTimer);
  }
  // mark connected and schedule a disconnect if no updates arrive
  setVisionConnected(true);
  _visionTimer = setTimeout(() => {
    setVisionConnected(false);
    _visionTimer = null;
  }, VISION_WATCHDOG_TIMEOUT);
}

socket.on("connect", () => {
    communicationLog.value.unshift(`[${new Date().toLocaleTimeString()}] ✅ Conexão estabelecida.`);
    systemStatus.guiConnected = true;
  // Mark referee (Juiz) service as connected when socket to backend is established
  systemStatus.strategyService = true;
  refereeLog.value.unshift(`[${new Date().toLocaleTimeString()}] Conexão com backend estabelecida.`);
});
socket.on("disconnect", () => {
    communicationLog.value.unshift(`[${new Date().toLocaleTimeString()}] ❌ Conexão perdida.`);
  systemStatus.guiConnected = false; systemStatus.visionNode = false; systemStatus.strategyService = false;
  if (_visionTimer) { clearTimeout(_visionTimer); _visionTimer = null; }
});
socket.on("system_status", (payload) => { Object.assign(systemStatus, payload); });
socket.on("vision_update", (payload: { yellow: Robot[], blue: Robot[], balls: Ball[] }) => {
    yellowRobots.splice(0, yellowRobots.length, ...payload.yellow);
    blueRobots.splice(0, blueRobots.length, ...payload.blue);
    balls.splice(0, balls.length, ...payload.balls);
  // reset watchdog every time a vision update arrives
  resetVisionWatchdog();
});
socket.on("trajectory_update", (payload: TrajectoryData) => {
  // Limpar trajetórias antigas
  Object.keys(trajectories).forEach(key => delete trajectories[parseInt(key)]);
  
  // Adicionar novas trajetórias
  payload.trajectories.forEach(robotTrajectory => {
    trajectories[robotTrajectory.robot_id] = robotTrajectory.points;
  });
});
// Listen to referee updates emitted by the backend API node and format them
socket.on("referee_update", (payload: any) => {
  try {
    const t = new Date().toLocaleTimeString();

    // Basic, resilient formatting for the referee payload
    const stage = payload?.stage ?? 'unknown';
    const stageTime = payload?.stage_time_left ?? null;
    const command = payload?.command ?? null;
    const commandCounter = payload?.command_counter ?? null;
    const actionTime = payload?.current_action_time_remaining ?? null;

    let line = `[${t}] Referee update — stage: ${stage}`;
    if (stageTime !== null) line += `, stage_time_left: ${stageTime}`;
    if (command !== null) line += `, command: ${command}`;
    if (commandCounter !== null) line += `, command_counter: ${commandCounter}`;
    if (actionTime !== null) line += `, action_time_left: ${actionTime}`;

    // If teams info is present, include a compact representation
  if (Array.isArray(payload?.teams) && payload.teams.length > 0) {
      try {
        const teamsStr = payload.teams.map((t: any) => {
          // try to show common fields if available
          const name = t?.name ?? t?.team ?? 'team';
          const score = t?.score ?? t?.points ?? null;
          return score !== null ? `${name}(${score})` : `${name}`;
        }).join(' | ');
        line += `, teams: ${teamsStr}`;
      } catch (e) {
        // fallback to JSON if mapping fails
        line += `, teams: ${JSON.stringify(payload.teams)}`;
      }
    }

    // Only push to referee log when the command or its counter changed
    const incomingCommand = command ?? null;
    const incomingCounter = commandCounter ?? null;

    const commandChanged = incomingCommand !== _lastRefereeCommand;
    const counterChanged = incomingCounter !== _lastRefereeCommandCounter;

    if (commandChanged || counterChanged) {
      refereeLog.value.unshift(line);
      _lastRefereeCommand = incomingCommand;
      _lastRefereeCommandCounter = incomingCounter;
    }
  } catch (err) {
    // If anything goes wrong, still record the raw payload for debugging
    const t = new Date().toLocaleTimeString();
    refereeLog.value.unshift(`[${t}] Referee update (raw): ${JSON.stringify(payload)}`);
  }
});
// Update referee connection status so the UI indicator for "Juiz" turns green when connected
socket.on("refereeStatus", (payload: { status: boolean } | boolean) => {
  try {
    const status = typeof payload === 'object' ? !!(payload as any).status : !!payload;
    systemStatus.strategyService = status;
    const t = new Date().toLocaleTimeString();
    refereeLog.value.unshift(`[${t}] Referee ${status ? 'connected' : 'disconnected'}.`);
  } catch (e) {
    // ignore
  }
});
socket.on("refereeOutput", (event) => { if(event?.line) refereeLog.value.unshift(event.line); });
socket.on("visionOutput", (event) => { if(event?.line) visionLog.value.unshift(event.line); });
socket.on("communicationOutput", (event) => { if(event?.line) communicationLog.value.unshift(event.line); });