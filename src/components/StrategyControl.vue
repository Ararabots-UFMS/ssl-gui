<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRobotData } from '@/robotData/robotData';
import { liveFieldGeometry } from '@/robotData/fieldGeometry';
import { useRobotControl, type ControlMode } from '@/composables/useRobotControl';

const { socket, yellowIds, blueIds } = useRobotData();

// --- ESTADO REATIVO ---
// Selection lives in the composable so clicking a robot on the field and picking one
// here are the same act.
const {
  controlMode, isManual, selectedTeam, selectedRobotId, lastTarget,
  setControlMode, selectRobot: selectRobotShared, stopSelectedRobot,
} = useRobotControl();

// Campos do formulário
const positionX = ref(0.0);
const positionY = ref(0.0);
const velocityX = ref(0.0);
const velocityY = ref(0.0);
const orientation = ref(0.0); // Orientação em graus (-180 a 180)

// (PID moved to PidTuner.vue)

// Controle de Obstáculos
const obstacles = ref({
  fieldBorder: true,
  penaltyArea: false,
  centerArea: false,
  ball: true,
  enemyIds: [] as number[],
  allyIds: [] as number[]
});

// Status dos serviços
const servicesStatus = ref({
  strategy: false,
  pid: false,
  kp_angular: false,
  orientation: false,
  obstacles: false,
  team_color: false
});

// Campanhas
const campaignRunning = ref(false);
const campaignType = ref<'horizontal' | 'vertical'>('horizontal');
let campaignInterval: NodeJS.Timeout | null = null;

// Log de respostas
const responses = ref<string[]>([]);

// --- LÓGICA DO DIAL DE ORIENTAÇÃO ---
const dialContainer = ref<HTMLElement | null>(null);
const isDragging = ref(false);

const updateAngle = (event: MouseEvent) => {
  if (!dialContainer.value) return;
  const rect = dialContainer.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const angleRad = Math.atan2(event.clientY - centerY, event.clientX - centerX);
  orientation.value = Math.round(angleRad * (180 / Math.PI));
};

const startDrag = (event: MouseEvent) => {
  isDragging.value = true;
  updateAngle(event);
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
};

const onDrag = (event: MouseEvent) => {
  if (isDragging.value) {
    updateAngle(event);
  }
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
};

// Limpa os listeners quando o componente é destruído
onBeforeUnmount(() => {
  stopDrag();
  stopCampaign();
  if (statusInterval) {
    clearInterval(statusInterval);
  }
});

// --- PROPRIEDADES COMPUTADAS E LISTENERS ---
const activeTeamRobots = computed(() => {
  const ids = selectedTeam.value === 'yellow' ? yellowIds.value : blueIds.value;
  if ((selectedRobotId.value === null || !ids.includes(selectedRobotId.value)) && ids.length > 0) {
    selectedRobotId.value = ids[0];
  }
  return ids.map(id => ({ id }));
});

// --- LISTENERS DE EVENTOS ---
socket.on('strategy_response', (data) => {
  const time = new Date().toLocaleTimeString();
  const message = data.success
    ? `[${time}] SUCESSO: Comando de estratégia executado.`
    : `[${time}] FALHA: ${data.message || 'Comando de estratégia falhou.'}`;
  responses.value.unshift(message);
  if (responses.value.length > 20) responses.value.pop();
});

// PID listeners moved to PidTuner.vue

socket.on('orientation_response', (data) => {
  const time = new Date().toLocaleTimeString();
  const message = data.success
    ? `[${time}] SUCESSO: Orientação definida.`
    : `[${time}] FALHA: ${data.message || 'Falha ao definir orientação.'}`;
  responses.value.unshift(message);
  if (responses.value.length > 20) responses.value.pop();
});

socket.on('obstacles_response', (data) => {
  const time = new Date().toLocaleTimeString();
  const message = data.success
    ? `[${time}] SUCESSO: Obstáculos atualizados.`
    : `[${time}] FALHA: ${data.message || 'Falha ao atualizar obstáculos.'}`;
  responses.value.unshift(message);
  if (responses.value.length > 20) responses.value.pop();
});

socket.on('team_color_response', (data) => {
  const time = new Date().toLocaleTimeString();
  const message = data.success
    ? `[${time}] SUCESSO: Cor do time alterada.`
    : `[${time}] FALHA: ${data.message || 'Falha ao alterar cor do time.'}`;
  responses.value.unshift(message);
  if (responses.value.length > 20) responses.value.pop();
});



socket.on('services_status', (status) => {
  servicesStatus.value = status;
  const time = new Date().toLocaleTimeString();
  responses.value.unshift(`[${time}] Status dos serviços atualizado.`);
  if (responses.value.length > 20) responses.value.pop();
});

// --- FUNÇÕES DE AÇÃO ---
function pickRobot(id: number) {
  selectRobotShared(selectedTeam.value, id);
}

function changeControlMode(mode: ControlMode) {
  if (mode === controlMode.value) return;
  setControlMode(mode);
  const time = new Date().toLocaleTimeString();
  responses.value.unshift(
    `[${time}] Modo de controle: ${mode === 'manual' ? 'MANUAL (debug)' : 'ESTRATÉGIA'}.`
  );
}

function stopRobot() {
  if (!stopSelectedRobot()) {
    alert('Selecione um robô em modo MANUAL para pará-lo.');
  }
}

// A field right-click is also a target: mirror it into the form so the numbers and the
// canvas never disagree.
watch(lastTarget, (t) => {
  if (!t) return;
  positionX.value = t.x;
  positionY.value = t.y;
});

// Presets de posição (mm) — derivados da geometria publicada pelo nó
// de visão. Quando a geometria ainda não chegou, caímos num campo de
// 4500×3000 mm como aproximação razoável (SSL Division B). Usar margens
// de ~250 mm para que o robô não fique encostado na linha.
const PRESET_MARGIN_MM = 250;
const presets = computed(() => {
  const live = liveFieldGeometry.value;
  const halfX = (live?.field_length ?? 4500) / 2;
  const halfY = (live?.field_width  ?? 3000) / 2;
  // Distância do gol ao centro do penalty mark (~500mm dentro da linha).
  const penaltyOffset = (live?.field_length ?? 4500) * 0.275;
  const px = halfX - PRESET_MARGIN_MM;
  const py = halfY - PRESET_MARGIN_MM;
  return {
    center:      { x: 0, y: 0 },
    ourGoal:     { x: -px, y: 0 },
    enemyGoal:   { x:  px, y: 0 },
    ourPenalty:  { x: -(halfX - penaltyOffset), y: 0 },
    topLeft:     { x: -px, y:  py },
    topRight:    { x:  px, y:  py },
    bottomLeft:  { x: -px, y: -py },
    bottomRight: { x:  px, y: -py },
  };
});

function sendStrategyCommand() {
  if (selectedRobotId.value === null) {
    alert('Por favor, selecione um robô para comandar.');
    return;
  }

  if (!servicesStatus.value.strategy) {
    alert('Serviço de estratégia não está disponível.');
    return;
  }

  const payload = {
    robot_id: selectedRobotId.value,
    position_x: positionX.value,
    position_y: positionY.value,
    velocity_x: velocityX.value,
    velocity_y: velocityY.value
  };

  socket.emit('strategyCommand', payload);
  const time = new Date().toLocaleTimeString();
  responses.value.unshift(`[${time}] Enviando comando de estratégia para robô ${payload.robot_id}...`);
}



function setRobotOrientation() {
  if (selectedRobotId.value === null) {
    alert('Por favor, selecione um robô.');
    return;
  }

  if (!servicesStatus.value.orientation) {
    alert('Serviço de orientação não está disponível.');
    return;
  }

  const orientationInRadians = orientation.value * (Math.PI / 180);
  const payload = {
    robot_id: selectedRobotId.value,
    orientation: orientationInRadians
  };

  socket.emit('setOrientation', payload);
  const time = new Date().toLocaleTimeString();
  responses.value.unshift(`[${time}] Definindo orientação para robô ${payload.robot_id}...`);
}

function updateObstacles() {
  if (selectedRobotId.value === null) {
    alert('Por favor, selecione um robô.');
    return;
  }

  if (!servicesStatus.value.obstacles) {
    alert('Serviço de obstáculos não está disponível.');
    return;
  }

  const payload = {
    robot_id: selectedRobotId.value,
    field_border: obstacles.value.fieldBorder,
    penalty_area: obstacles.value.penaltyArea,
    center_area: obstacles.value.centerArea,
    ball: obstacles.value.ball,
    enemy_ids: obstacles.value.enemyIds,
    ally_ids: obstacles.value.allyIds
  };

  socket.emit('updateObstacles', payload);
  const time = new Date().toLocaleTimeString();
  responses.value.unshift(`[${time}] Atualizando obstáculos para robô ${payload.robot_id}...`);
}

function setTeamColor(isYellow: boolean) {
  if (!servicesStatus.value.team_color) {
    alert('Serviço de cor do time não está disponível.');
    return;
  }

  const payload = { is_yellow: isYellow };
  socket.emit('setTeamColorService', payload);
  const time = new Date().toLocaleTimeString();
  responses.value.unshift(`[${time}] Alterando cor do time...`);
}



function checkServicesStatus() {
  socket.emit('checkServicesStatus');
}

function setPreset(x: number, y: number) {
  positionX.value = x;
  positionY.value = y;
}

function setOrientation(degrees: number) {
  orientation.value = degrees;
}

// setPIDPreset moved to PidTuner.vue

// Campanhas automáticas
function startCampaign() {
  if (selectedRobotId.value === null) {
    alert('Por favor, selecione um robô.');
    return;
  }

  if (campaignRunning.value) {
    stopCampaign();
    return;
  }

  campaignRunning.value = true;
  let targetToggle = false;

  const p = presets.value;
  const targets = campaignType.value === 'horizontal' ?
    [p.ourGoal, p.enemyGoal] :
    [{ x: 0, y: -((liveFieldGeometry.value?.field_width ?? 3000) / 2 - PRESET_MARGIN_MM) },
     { x: 0, y:  ((liveFieldGeometry.value?.field_width ?? 3000) / 2 - PRESET_MARGIN_MM) }];

  campaignInterval = setInterval(() => {
    const target = targetToggle ? targets[1] : targets[0];

    const payload = {
      robot_id: selectedRobotId.value,
      position_x: target.x,
      position_y: target.y,
      velocity_x: 0,
      velocity_y: 0
    };

    socket.emit('strategyCommand', payload);
    targetToggle = !targetToggle;
  }, 5000);

  const time = new Date().toLocaleTimeString();
  responses.value.unshift(`[${time}] Iniciando campanha ${campaignType.value} para robô ${selectedRobotId.value}...`);
}

function stopCampaign() {
  if (campaignInterval) {
    clearInterval(campaignInterval);
    campaignInterval = null;
  }
  campaignRunning.value = false;

  const time = new Date().toLocaleTimeString();
  responses.value.unshift(`[${time}] Campanha interrompida.`);
}

// Verificar status dos serviços periodicamente
const statusInterval = setInterval(checkServicesStatus, 5000);

// Verificar status ao conectar
checkServicesStatus();
</script>

<template>
  <div class="control-container">
    <!-- Modo de Controle -->
    <div class="form-section">
      <span class="section-label">Modo de Controle</span>
      <div class="mode-switcher">
        <button :class="{ active: !isManual }" @click="changeControlMode('strategy')">
          Estratégia
        </button>
        <button :class="{ active: isManual }" @click="changeControlMode('manual')">
          Manual (debug)
        </button>
      </div>
      <p class="mode-hint">
        <template v-if="isManual">
          No campo: <strong>clique esquerdo</strong> seleciona o robô,
          <strong>clique direito</strong> define o destino. O robô vira para a bola ao chegar.
        </template>
        <template v-else>
          O nó de estratégia está no comando. Troque para Manual para comandar robôs pelo campo.
        </template>
      </p>
    </div>

    <!-- Status dos Serviços -->
    <div class="form-section">
      <span class="section-label">Status dos Serviços</span>
      <div class="services-status">
        <div class="service-item" :class="{ active: servicesStatus.strategy }">
          <span>Estratégia</span>
          <div class="status-indicator" :class="{ online: servicesStatus.strategy }"></div>
        </div>
        <div class="service-item" :class="{ active: servicesStatus.pid }">
          <span>PID</span>
          <div class="status-indicator" :class="{ online: servicesStatus.pid }"></div>
        </div>
        <div class="service-item" :class="{ active: servicesStatus.orientation }">
          <span>Orientação</span>
          <div class="status-indicator" :class="{ online: servicesStatus.orientation }"></div>
        </div>
        <div class="service-item" :class="{ active: servicesStatus.obstacles }">
          <span>Obstáculos</span>
          <div class="status-indicator" :class="{ online: servicesStatus.obstacles }"></div>
        </div>
        <button @click="checkServicesStatus" class="refresh-button">🔄 Atualizar</button>
      </div>
    </div>

    <!-- Seleção do Robô -->
    <div class="form-section">
      <span class="section-label">1. Selecione o Robô</span>
      <div class="selection-header">
        <div class="team-selector">
          <button @click="selectedTeam = 'yellow'" :class="{ active: selectedTeam === 'yellow' }">Amarelo</button>
          <button @click="selectedTeam = 'blue'" :class="{ active: selectedTeam === 'blue' }">Azul</button>
        </div>
        <label class="input-wrapper id-input">
          <span class="input-label">Ou digite o ID</span>
          <input type="number" v-model.number="selectedRobotId" min="0" max="15" />
        </label>
      </div>
      <div class="robot-selector">
        <div v-for="robot in activeTeamRobots" :key="robot.id" class="robot-card"
          :class="{ active: selectedRobotId === robot.id }" @click="pickRobot(robot.id)">
          {{ robot.id }}
        </div>
        <p v-if="activeTeamRobots.length === 0" class="no-robots-msg">Aguardando dados dos robôs...</p>
      </div>
    </div>

    <!-- Comando de Estratégia -->
    <div class="form-section">
      <span class="section-label">2. Comando de Estratégia</span>
      <div class="inputs-grid">
        <label class="input-wrapper">
          <span class="input-label">Posição X (mm)</span>
          <input type="number" step="100" v-model.number="positionX" />
        </label>
        <label class="input-wrapper">
          <span class="input-label">Posição Y (mm)</span>
          <input type="number" step="100" v-model.number="positionY" />
        </label>
        <label class="input-wrapper">
          <span class="input-label">Velocidade X (mm/s)</span>
          <input type="number" step="100" v-model.number="velocityX" />
        </label>
        <label class="input-wrapper">
          <span class="input-label">Velocidade Y (mm/s)</span>
          <input type="number" step="100" v-model.number="velocityY" />
        </label>
      </div>

      <!-- Presets de Posição -->
      <div class="presets-section">
        <span class="preset-label">Posições Pré-definidas:</span>
        <div class="presets-grid">
          <button @click="setPreset(presets.center.x, presets.center.y)">Centro</button>
          <button @click="setPreset(presets.ourGoal.x, presets.ourGoal.y)">Nosso Gol</button>
          <button @click="setPreset(presets.enemyGoal.x, presets.enemyGoal.y)">Gol Adversário</button>
          <button @click="setPreset(presets.ourPenalty.x, presets.ourPenalty.y)">Nossa Área</button>
          <button @click="setPreset(presets.topLeft.x, presets.topLeft.y)">Superior Esq.</button>
          <button @click="setPreset(presets.topRight.x, presets.topRight.y)">Superior Dir.</button>
          <button @click="setPreset(presets.bottomLeft.x, presets.bottomLeft.y)">Inferior Esq.</button>
          <button @click="setPreset(presets.bottomRight.x, presets.bottomRight.y)">Inferior Dir.</button>
        </div>
      </div>

      <p class="target-readout">
        <template v-if="lastTarget">
          Último destino: <strong>{{ lastTarget.x }}, {{ lastTarget.y }}</strong> mm
        </template>
        <template v-else>Nenhum destino enviado.</template>
      </p>

      <div class="action-buttons">
        <button class="action-button primary" @click="sendStrategyCommand"
          :disabled="!servicesStatus.strategy || !isManual">
          📍 Enviar Comando
        </button>
        <button class="action-button danger" @click="stopRobot" :disabled="!isManual">
          ⏹ Parar
        </button>
      </div>
    </div>

    <!-- Controle de Orientação -->
    <div class="form-section">
      <span class="section-label">3. Controle de Orientação</span>
      <div class="orientation-control-wrapper">
        <div class="orientation-dial" ref="dialContainer" @mousedown="startDrag">
          <svg viewBox="0 0 120 120">
            <circle class="dial-bg" cx="60" cy="60" r="58" />
            <g :style="{ transform: `rotate(${orientation}deg)`, transformOrigin: '60px 60px' }">
              <circle class="robot-body" cx="60" cy="60" r="40" />
              <path class="robot-front" d="M 60 20 L 90 60 L 60 100 Z" />
            </g>
          </svg>
          <div class="orientation-value">{{ Math.round(orientation) }}°</div>
        </div>
        <div class="presets-grid-orientation">
          <button @click="setOrientation(0)">▶ Gol Adv.</button>
          <button @click="setOrientation(180)">◀ Nosso Gol</button>
          <button @click="setOrientation(-90)">▲ Cima</button>
          <button @click="setOrientation(90)">▼ Baixo</button>
        </div>
      </div>
      <div class="action-buttons">
        <button class="action-button" @click="setRobotOrientation" :disabled="!servicesStatus.orientation">
          🧭 Definir Orientação
        </button>
      </div>
    </div>

    <!-- Controle PID moved to PidTuner.vue (aba Ajuste PID) -->

    <!-- Controle de Obstáculos -->
    <div class="form-section">
      <span class="section-label">5. Configuração de Obstáculos</span>
      <div class="obstacles-config">
        <div class="checkbox-grid">
          <label class="checkbox-wrapper">
            <input type="checkbox" v-model="obstacles.fieldBorder" />
            <span>Bordas do Campo</span>
          </label>
          <label class="checkbox-wrapper">
            <input type="checkbox" v-model="obstacles.penaltyArea" />
            <span>Área Penal</span>
          </label>
          <label class="checkbox-wrapper">
            <input type="checkbox" v-model="obstacles.centerArea" />
            <span>Área Central</span>
          </label>
          <label class="checkbox-wrapper">
            <input type="checkbox" v-model="obstacles.ball" />
            <span>Bola</span>
          </label>
        </div>

        <div class="robot-ids-section">
          <label class="input-wrapper">
            <span class="input-label">IDs Robôs Inimigos (separados por vírgula)</span>
            <input type="text" :value="obstacles.enemyIds.join(',')"
              @input="obstacles.enemyIds = ($event.target as HTMLInputElement).value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))" />
          </label>
          <label class="input-wrapper">
            <span class="input-label">IDs Robôs Aliados (separados por vírgula)</span>
            <input type="text" :value="obstacles.allyIds.join(',')"
              @input="obstacles.allyIds = ($event.target as HTMLInputElement).value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))" />
          </label>
        </div>
      </div>

      <div class="action-buttons">
        <button class="action-button" @click="updateObstacles" :disabled="!servicesStatus.obstacles">
          🚧 Atualizar Obstáculos
        </button>
      </div>
    </div>

    <!-- Campanhas Automáticas -->
    <div class="form-section">
      <span class="section-label">6. Campanhas Automáticas</span>
      <div class="campaign-controls">
        <div class="campaign-type">
          <label class="radio-wrapper">
            <input type="radio" v-model="campaignType" value="horizontal" />
            <span>Horizontal (Gol a Gol)</span>
          </label>
          <label class="radio-wrapper">
            <input type="radio" v-model="campaignType" value="vertical" />
            <span>Vertical (Cima/Baixo)</span>
          </label>
        </div>

        <div class="action-buttons">
          <button class="action-button" :class="{ danger: campaignRunning }" @click="startCampaign"
            :disabled="!servicesStatus.strategy">
            {{ campaignRunning ? '⏹️ Parar Campanha' : '▶️ Iniciar Campanha' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Controle do Time -->
    <div class="form-section">
      <span class="section-label">7. Configurações do Time</span>
      <div class="team-controls">
        <div class="action-buttons">
          <button class="action-button" @click="setTeamColor(true)" :disabled="!servicesStatus.team_color">
            🟡 Definir Time Amarelo
          </button>
          <button class="action-button" @click="setTeamColor(false)" :disabled="!servicesStatus.team_color">
            🔵 Definir Time Azul
          </button>
        </div>
      </div>
    </div>

    <!-- Log de Respostas -->
    <div class="response-log-section">
      <span class="section-label">Log de Respostas</span>
      <div class="response-log">
        <p v-for="(msg, index) in responses" :key="index"
          :class="{ success: msg.includes('SUCESSO'), fail: msg.includes('FALHA') }">{{ msg }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --input-bg: rgba(0, 0, 0, 0.2);
  --input-border: var(--cor-borda);
  --input-border-focus: var(--cor-destaque);
}

.control-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  width: 100%;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.section-label {
  font-size: var(--font-size-base);
  color: var(--texto-principal);
  font-weight: var(--font-weight-bold);
  border-bottom: 1px solid var(--cor-borda);
  padding-bottom: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

/* Status dos Serviços */
.services-status {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  align-items: center;
}

.service-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--cor-borda);
  border-radius: var(--border-radius-sm);
  background: var(--fundo-terciario);
}

.service-item.active {
  border-color: var(--cor-sucesso);
}

.service-item span {
  font-size: var(--font-size-sm);
  color: var(--texto-secundario);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cor-erro);
}

.status-indicator.online {
  background: var(--cor-sucesso);
}

.refresh-button {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--cor-borda);
  background: var(--fundo-secundario);
  color: var(--texto-secundario);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
}

.refresh-button:hover {
  background: var(--cor-destaque);
  color: white;
}

.selection-header {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-3);
}

.team-selector {
  display: flex;
  gap: var(--spacing-2);
}

.team-selector button {
  padding: var(--spacing-1) var(--spacing-3);
  border: 1px solid var(--cor-borda);
  background: transparent;
  color: var(--texto-secundario);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  transition: all 0.2s ease;
}

.team-selector button.active {
  background-color: var(--cor-destaque);
  color: white;
  border-color: var(--cor-destaque);
  box-shadow: var(--glow-effect-destaque);
}

.id-input {
  max-width: 140px;
}

.robot-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.robot-card {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 2px solid var(--cor-borda);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.robot-card:hover {
  border-color: var(--cor-destaque-hover);
  color: var(--cor-destaque-hover);
}

.robot-card.active {
  background-color: var(--cor-destaque);
  border-color: var(--cor-destaque);
  color: white;
  transform: scale(1.05);
  box-shadow: var(--glow-effect-destaque);
}

.no-robots-msg {
  color: var(--texto-secundario);
}

.inputs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  position: relative;
}

.input-label {
  font-size: var(--font-size-sm);
  color: var(--texto-secundario);
}

input[type="number"],
input[type="text"] {
  border: none;
  border-bottom: 2px solid var(--input-border);
  background-color: var(--input-bg);
  padding: var(--spacing-2);
  border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
  color: var(--texto-principal);
  font-size: var(--font-size-base);
  transition: border-color 0.3s ease;
}

input[type="number"]:focus,
input[type="text"]:focus {
  outline: none;
  border-color: var(--input-border-focus);
}

/* Presets */
.presets-section {
  margin-top: var(--spacing-3);
}

.preset-label {
  font-size: var(--font-size-sm);
  color: var(--texto-secundario);
  margin-bottom: var(--spacing-2);
  display: block;
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-2);
}

.presets-grid button {
  background-color: var(--fundo-terciario);
  color: var(--texto-secundario);
  border: var(--border-width) solid var(--cor-borda);
  padding: var(--spacing-2);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-size-sm);
}

.presets-grid button:hover {
  background-color: var(--cor-destaque);
  color: white;
}

.orientation-control-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.orientation-dial {
  position: relative;
  width: 150px;
  height: 150px;
  cursor: grab;
  flex-shrink: 0;
}

.orientation-dial:active {
  cursor: grabbing;
}

.orientation-dial svg {
  width: 100%;
  height: 100%;
}

.dial-bg {
  fill: var(--fundo-principal);
  stroke: var(--cor-borda);
  stroke-width: 2;
}

.robot-body {
  fill: var(--fundo-secundario);
  stroke: var(--cor-destaque);
  stroke-width: 3;
  filter: drop-shadow(var(--glow-effect-destaque));
}

.robot-front {
  fill: var(--cor-destaque);
}

.orientation-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--texto-principal);
  pointer-events: none;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.presets-grid-orientation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
  width: 100%;
}

.presets-grid-orientation button {
  background-color: var(--fundo-terciario);
  color: var(--texto-secundario);
  border: var(--border-width) solid var(--cor-borda);
  padding: var(--spacing-2);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-size-sm);
}

.presets-grid-orientation button:hover {
  background-color: var(--cor-destaque);
  color: white;
}

/* Botões de Ação */
.mode-switcher {
  display: flex;
  background-color: var(--fundo-secundario);
  border-radius: var(--border-radius-sm);
  border: var(--border-width) solid var(--cor-borda);
  overflow: hidden;
}
.mode-switcher button {
  flex: 1;
  background: transparent;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  cursor: pointer;
  color: var(--texto-secundario);
  font-weight: var(--font-weight-bold);
}
.mode-switcher button.active {
  background-color: var(--cor-destaque);
  color: #fff;
}
.mode-hint {
  margin: var(--spacing-2) 0 0;
  font-size: var(--font-size-sm);
  color: var(--texto-secundario);
  line-height: 1.4;
}
.target-readout {
  margin: var(--spacing-2) 0 0;
  font-size: var(--font-size-sm);
  color: var(--texto-secundario);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
  flex-wrap: wrap;
}

.action-button {
  flex: 1;
  min-width: 200px;
  cursor: pointer;
  padding: var(--spacing-3);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  border-radius: var(--border-radius-md);
  border: none;
  background: linear-gradient(45deg, var(--cor-destaque), var(--cor-destaque-hover));
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), var(--glow-effect-destaque);
}

.action-button:disabled {
  background: var(--fundo-terciario);
  color: var(--texto-secundario);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-button.primary {
  background: linear-gradient(45deg, var(--cor-sucesso), var(--cor-sucesso));
  color: var(--texto-principal);
}

.action-button.danger {
  background: linear-gradient(45deg, var(--cor-erro), var(--cor-erro));
}

/* Obstáculos */
.obstacles-config {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.checkbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.checkbox-wrapper span {
  color: var(--texto-secundario);
  font-size: var(--font-size-sm);
}

.robot-ids-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

/* Campanhas */
.campaign-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.campaign-type {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.radio-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.radio-wrapper input[type="radio"] {
  width: 18px;
  height: 18px;
}

.radio-wrapper span {
  color: var(--texto-secundario);
  font-size: var(--font-size-sm);
}

.response-log-section {
  margin-top: var(--spacing-3);
}

.response-log {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-2);
  height: 150px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: var(--font-size-sm);
  border: 1px solid var(--cor-borda);
}

.response-log p.success {
  color: var(--cor-sucesso);
}

.response-log p.fail {
  color: var(--cor-erro);
}

/* Responsividade */
@media (max-width: 768px) {
  .inputs-grid {
    grid-template-columns: 1fr;
  }

  .checkbox-grid {
    grid-template-columns: 1fr;
  }

  .presets-grid {
    grid-template-columns: 1fr 1fr;
  }

  .orientation-control-wrapper {
    flex-direction: column;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-button {
    min-width: auto;
  }
}
</style>
