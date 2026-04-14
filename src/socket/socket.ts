import { reactive, ref } from 'vue';
import { io } from 'socket.io-client';
import { formatTime } from '@/utils';
import type { TrajectoryData, Ball, Robot, RobotTrajectory, TrajectoryPoint } from '@/types/robotData';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';
const VISION_WATCHDOG_MS = Number(import.meta.env.VITE_VISION_WATCHDOG_MS ?? 3000);

export const yellowRobots = reactive<Robot[]>([]);
export const blueRobots = reactive<Robot[]>([]);
export const balls = reactive<Ball[]>([]);
export const trajectories = reactive<Record<number, TrajectoryPoint[]>>({});
export const systemStatus = reactive({
  guiConnected: false,
  visionNode: false,
  strategyService: false,
  pidService: false,
});

export const refereeLog = ref<string[]>(['Terminal do Juiz inicializado.']);
export const visionLog = ref<string[]>(['Terminal da Visão inicializado.']);
export const communicationLog = ref<string[]>(['Terminal de Comunicação inicializado.']);

export const socket = io(SOCKET_URL);


let _visionTimer: ReturnType<typeof setTimeout> | null = null;
let _visionConnected = false;

function setVisionConnected(connected: boolean) {
  if (_visionConnected === connected) return;
  _visionConnected = connected;
  systemStatus.visionNode = connected;
  visionLog.value.unshift(`[${formatTime()}] Visão ${connected ? 'conectada' : 'desconectada'}.`);
}

function resetVisionWatchdog() {
  if (_visionTimer) clearTimeout(_visionTimer);
  setVisionConnected(true);
  _visionTimer = setTimeout(() => {
    setVisionConnected(false);
    _visionTimer = null;
  }, VISION_WATCHDOG_MS);
}

let _lastRefereeCommand: string | null = null;
let _lastRefereeCommandCounter: number | null = null;

function handleVisionUpdate(payload: { yellow: Robot[]; blue: Robot[]; balls: Ball[] }) {
  yellowRobots.splice(0, yellowRobots.length, ...payload.yellow);
  blueRobots.splice(0, blueRobots.length, ...payload.blue);
  balls.splice(0, balls.length, ...payload.balls);
  resetVisionWatchdog();
}

function handleTrajectoryUpdate(payload: TrajectoryData) {
  Object.keys(trajectories).forEach(key => delete (trajectories as Record<string, TrajectoryPoint[]>)[key]);
  payload.trajectories.forEach(rt => {
    trajectories[rt.robot_id] = rt.points;
  });
}

function handleRefereeUpdate(payload: any) {
  try {
    const stage = payload?.stage ?? 'unknown';
    const stageTime = payload?.stage_time_left ?? null;
    const command = payload?.command ?? null;
    const commandCounter = payload?.command_counter ?? null;
    const actionTime = payload?.current_action_time_remaining ?? null;

    const commandChanged = command !== _lastRefereeCommand;
    const counterChanged = commandCounter !== _lastRefereeCommandCounter;
    if (!commandChanged && !counterChanged) return;

    let line = `[${formatTime()}] Referee update — stage: ${stage}`;
    if (stageTime !== null) line += `, stage_time_left: ${stageTime}`;
    if (command !== null) line += `, command: ${command}`;
    if (commandCounter !== null) line += `, command_counter: ${commandCounter}`;
    if (actionTime !== null) line += `, action_time_left: ${actionTime}`;

    if (Array.isArray(payload?.teams) && payload.teams.length > 0) {
      try {
        const teamsStr = payload.teams
          .map((t: any) => {
            const name = t?.name ?? t?.team ?? 'team';
            const score = t?.score ?? t?.points ?? null;
            return score !== null ? `${name}(${score})` : name;
          })
          .join(' | ');
        line += `, teams: ${teamsStr}`;
      } catch {
        line += `, teams: ${JSON.stringify(payload.teams)}`;
      }
    }

    refereeLog.value.unshift(line);
    _lastRefereeCommand = command;
    _lastRefereeCommandCounter = commandCounter;
  } catch {
    refereeLog.value.unshift(`[${formatTime()}] Referee update (raw): ${JSON.stringify(payload)}`);
  }
}

socket.on('connect', () => {
  communicationLog.value.unshift(`[${formatTime()}] ✅ Conexão estabelecida.`);
  systemStatus.guiConnected = true;
  systemStatus.strategyService = true;
  refereeLog.value.unshift(`[${formatTime()}] Conexão com backend estabelecida.`);
});

socket.on('disconnect', () => {
  communicationLog.value.unshift(`[${formatTime()}] ❌ Conexão perdida.`);
  systemStatus.guiConnected = false;
  systemStatus.visionNode = false;
  systemStatus.strategyService = false;
  if (_visionTimer) { clearTimeout(_visionTimer); _visionTimer = null; }
});

socket.on('system_status', (payload) => Object.assign(systemStatus, payload));
socket.on('vision_update', handleVisionUpdate);
socket.on('trajectory_update', handleTrajectoryUpdate);
socket.on('referee_update', handleRefereeUpdate);

socket.on('refereeStatus', (payload: { status: boolean } | boolean) => {
  try {
    const status = typeof payload === 'object' ? !!payload.status : !!payload;
    systemStatus.strategyService = status;
    refereeLog.value.unshift(`[${formatTime()}] Referee ${status ? 'connected' : 'disconnected'}.`);
  } catch { /* ignore */ }
});

socket.on('refereeOutput', (event) => { if (event?.line) refereeLog.value.unshift(event.line); });
socket.on('visionOutput', (event) => { if (event?.line) visionLog.value.unshift(event.line); });
socket.on('communicationOutput', (event) => { if (event?.line) communicationLog.value.unshift(event.line); });

export function useRobotData() {
  return {
    yellowRobots,
    blueRobots,
    balls,
    trajectories,
    systemStatus,
    refereeLog,
    visionLog,
    communicationLog,
    socket,
  };
}
