import { reactive, ref, shallowRef } from 'vue';
import { io } from 'socket.io-client';
import { formatTime } from '@/utils';
import type { TrajectoryData, Ball, Robot } from '@/types/robotData';
import { robotBuffers, ballBuffer, trajectoryBuffer, bumpRoster, bumpTrajectory } from './fieldBuffers';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';
const VISION_WATCHDOG_MS = Number(import.meta.env.VITE_VISION_WATCHDOG_MS ?? 3000);

export const yellowIds = shallowRef<number[]>([]);
export const blueIds = shallowRef<number[]>([]);

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

function syncTeamBuffer(
  incoming: Robot[],
  buf: Map<number, { x: number; y: number; orientation: number }>,
  currentIds: number[],
): { ids: number[]; changed: boolean } {
  const nextIds: number[] = [];
  for (const r of incoming) {
    nextIds.push(r.id);
    const existing = buf.get(r.id);
    if (existing) {
      existing.x = r.position_x;
      existing.y = r.position_y;
      existing.orientation = r.orientation;
    } else {
      buf.set(r.id, { x: r.position_x, y: r.position_y, orientation: r.orientation });
    }
  }
  for (const id of Array.from(buf.keys())) {
    if (!nextIds.includes(id)) buf.delete(id);
  }
  const changed = nextIds.length !== currentIds.length
    || nextIds.some((id, i) => id !== currentIds[i]);
  return { ids: nextIds, changed };
}

function handleVisionUpdate(payload: { yellow: Robot[]; blue: Robot[]; balls: Ball[] }) {
  const y = syncTeamBuffer(payload.yellow, robotBuffers.yellow, yellowIds.value);
  const b = syncTeamBuffer(payload.blue, robotBuffers.blue, blueIds.value);

  ballBuffer.length = 0;
  for (const ball of payload.balls) {
    ballBuffer.push({ id: ball.id, x: ball.position_x, y: ball.position_y });
  }

  let rosterChanged = false;
  if (y.changed) { yellowIds.value = y.ids; rosterChanged = true; }
  if (b.changed) { blueIds.value = b.ids; rosterChanged = true; }
  if (rosterChanged) bumpRoster();

  resetVisionWatchdog();
}

function handleTrajectoryUpdate(payload: TrajectoryData) {
  trajectoryBuffer.clear();
  for (const rt of payload.trajectories) {
    trajectoryBuffer.set(rt.robot_id, rt.points.map(p => ({ x: p.x, y: p.y })));
  }
  bumpTrajectory();
}

let _lastRefereeCommand: string | null = null;
let _lastRefereeCommandCounter: number | null = null;

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
    yellowIds,
    blueIds,
    systemStatus,
    refereeLog,
    visionLog,
    communicationLog,
    socket,
  };
}
