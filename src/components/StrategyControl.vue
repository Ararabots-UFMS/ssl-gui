<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { socket, yellowRobots, blueRobots } from '@/socket';

// --- ESTADO REATIVO ---
const selectedTeam = ref<'yellow' | 'blue'>('yellow');
const selectedRobotId = ref<number | null>(null);

// Campos do formulário
const positionX = ref(0.0);
const positionY = ref(0.0);
const velocityX = ref(0.0);
const velocityY = ref(0.0);
const orientation = ref(0.0); // Orientação em graus (-180 a 180)

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
});

// --- PROPRIEDADES COMPUTADAS E LISTENERS ---
const activeTeamRobots = computed(() => {
    const team = selectedTeam.value === 'yellow' ? yellowRobots : blueRobots;
    // Garante que o primeiro robô da lista seja selecionado se nenhum estiver ou se o selecionado não existir mais
    if ((selectedRobotId.value === null || !team.some(r => r.id === selectedRobotId.value)) && team.length > 0) {
        selectedRobotId.value = team[0].id;
    }
    return team;
});

socket.on('strategy_command_response', (data) => {
  const time = new Date().toLocaleTimeString();
  const message = data.success 
    ? `[${time}] SUCESSO: Comando recebido.`
    : `[${time}] FALHA: Comando não executado.`;
  responses.value.unshift(message);
  if (responses.value.length > 20) responses.value.pop();
});

// --- FUNÇÕES DE AÇÃO ---
function selectRobot(id: number) {
  selectedRobotId.value = id;
}

function sendCommand() {
  if (selectedRobotId.value === null) {
    alert('Por favor, selecione um robô para comandar.');
    return;
  }
  
  const orientationInRadians = orientation.value * (Math.PI / 180);

  const payload = {
    id: selectedRobotId.value,
    position_x: positionX.value,
    position_y: positionY.value,
    velocity_x: velocityX.value,
    velocity_y: velocityY.value,
    orientation: orientationInRadians,
  };
  socket.emit('send_strategy_command', payload);
  const time = new Date().toLocaleTimeString();
  responses.value.unshift(`[${time}] Enviando comando para robô ${payload.id}...`);
}

function setPreset(x: number, y: number) {
  positionX.value = x;
  positionY.value = y;
}

function setOrientation(degrees: number) {
  orientation.value = degrees;
}
</script>

<template>
  <div class="control-container">
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
        <div 
          v-for="robot in activeTeamRobots" 
          :key="robot.id"
          class="robot-card"
          :class="{ active: selectedRobotId === robot.id }"
          @click="selectRobot(robot.id)"
        >
          {{ robot.id }}
        </div>
        <p v-if="activeTeamRobots.length === 0" class="no-robots-msg">Aguardando dados dos robôs...</p>
      </div>
    </div>

    <div class="form-section">
      <span class="section-label">2. Defina o Alvo e a Velocidade</span>
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
    </div>

    <div class="form-section">
      <span class="section-label">3. Defina a Orientação Final</span>
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
          <button @click="setOrientation(0)">▶ Virar p/ Gol Adv.</button>
          <button @click="setOrientation(180)">◀ Virar p/ Nosso Gol</button>
          <button @click="setOrientation(-90)">▲ Virar p/ Cima</button>
          <button @click="setOrientation(90)">▼ Virar p/ Baixo</button>
        </div>
      </div>
    </div>
    
    <div class="main-actions">
      <button class="action-button" @click="sendCommand">Enviar Comando para Robô {{ selectedRobotId }}</button>
    </div>
    <div class="response-log-section">
      <span class="section-label">Log de Respostas</span>
      <div class="response-log">
        <p v-for="(msg, index) in responses" :key="index" :class="{ success: msg.includes('SUCESSO'), fail: msg.includes('FALHA') }">{{ msg }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
    --input-bg: rgba(0,0,0,0.2);
    --input-border: var(--cor-borda);
    --input-border-focus: var(--cor-destaque);
}

.control-container { display: flex; flex-direction: column; gap: var(--spacing-4); width: 100%; }
.form-section { display: flex; flex-direction: column; gap: var(--spacing-3); }
.section-label { font-size: var(--font-size-base); color: var(--texto-principal); font-weight: var(--font-weight-bold); border-bottom: 1px solid var(--cor-borda); padding-bottom: var(--spacing-2); margin-bottom: var(--spacing-2); }

.selection-header { display: flex; align-items: flex-end; gap: var(--spacing-3); }
.team-selector { display: flex; gap: var(--spacing-2); }
.team-selector button { padding: var(--spacing-1) var(--spacing-3); border: 1px solid var(--cor-borda); background: transparent; color: var(--texto-secundario); border-radius: var(--border-radius-md); cursor: pointer; font-weight: var(--font-weight-bold); transition: all 0.2s ease; }
.team-selector button.active { background-color: var(--cor-destaque); color: white; border-color: var(--cor-destaque); box-shadow: var(--glow-effect-destaque); }
.id-input { max-width: 140px; }

.robot-selector { display: flex; flex-wrap: wrap; gap: var(--spacing-2); }
.robot-card { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: transparent; border: 2px solid var(--cor-borda); border-radius: var(--border-radius-md); font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); cursor: pointer; transition: all 0.2s ease; }
.robot-card:hover { border-color: var(--cor-destaque-hover); color: var(--cor-destaque-hover); }
.robot-card.active { background-color: var(--cor-destaque); border-color: var(--cor-destaque); color: white; transform: scale(1.05); box-shadow: var(--glow-effect-destaque); }
.no-robots-msg { color: var(--texto-secundario); }

.inputs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-3); }
.input-wrapper { display: flex; flex-direction: column; gap: var(--spacing-1); position: relative; }
.input-label { font-size: var(--font-size-sm); color: var(--texto-secundario); }
input[type="number"] {
  border: none;
  border-bottom: 2px solid var(--input-border);
  background-color: var(--input-bg);
  padding: var(--spacing-2);
  border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
  color: var(--texto-principal);
  font-size: var(--font-size-base);
  transition: border-color 0.3s ease;
}
input[type="number"]:focus {
  outline: none;
  border-color: var(--input-border-focus);
}

.orientation-control-wrapper { display: flex; align-items: center; gap: var(--spacing-4); }
.orientation-dial { position: relative; width: 150px; height: 150px; cursor: grab; flex-shrink: 0; }
.orientation-dial:active { cursor: grabbing; }
.orientation-dial svg { width: 100%; height: 100%; }
.dial-bg { fill: var(--fundo-principal); stroke: var(--cor-borda); stroke-width: 2; }
.robot-body { fill: var(--fundo-secundario); stroke: var(--cor-destaque); stroke-width: 3; filter: drop-shadow(var(--glow-effect-destaque)); }
.robot-front { fill: var(--cor-destaque); }
.orientation-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--texto-principal); pointer-events: none; text-shadow: 0 0 5px rgba(0,0,0,0.5); }

.presets-grid-orientation { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-2); width: 100%; }
.presets-grid-orientation button { background-color: var(--fundo-terciario); color: var(--texto-secundario); border: var(--border-width) solid var(--cor-borda); padding: var(--spacing-2); border-radius: var(--border-radius-sm); cursor: pointer; transition: all 0.2s ease; font-size: var(--font-size-sm); }
.presets-grid-orientation button:hover { background-color: var(--cor-destaque); color: white; }

.main-actions { display: flex; margin-top: var(--spacing-3); }
.action-button { 
  flex-grow: 1; cursor: pointer; padding: var(--spacing-3); font-size: var(--font-size-md); font-weight: var(--font-weight-bold); border-radius: var(--border-radius-md); border: none;
  background: linear-gradient(45deg, var(--cor-destaque), var(--cor-destaque-hover));
  color: white; 
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3), var(--glow-effect-destaque);
}

.response-log-section { margin-top: var(--spacing-3); }
.response-log { background-color: rgba(0,0,0,0.3); border-radius: var(--border-radius-sm); padding: var(--spacing-2); height: 150px; overflow-y: auto; font-family: 'Courier New', Courier, monospace; font-size: var(--font-size-sm); border: 1px solid var(--cor-borda); }
.response-log p.success { color: var(--cor-sucesso); }
.response-log p.fail { color: var(--cor-erro); }
</style>