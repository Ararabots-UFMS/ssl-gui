<script setup lang="ts">
import { ref, computed } from 'vue';
import { socket, yellowRobots, blueRobots } from '@/socket';

// Seleção de time e robô (compartilha lógica com StrategyControl)
const selectedTeam = ref<'yellow' | 'blue'>('yellow');
const selectedRobotId = ref<number | null>(null);

const activeTeamRobots = computed(() => {
  const team = selectedTeam.value === 'yellow' ? yellowRobots : blueRobots;
  if ((selectedRobotId.value === null || !team.some(r => r.id === selectedRobotId.value)) && team.length > 0) {
    selectedRobotId.value = team[0].id;
  }
  return team;
});

// PID state
const pidKp = ref(3.0);
const pidKi = ref(0.2);
const pidKd = ref(1.0);
const kpAngular = ref(2.5);

const pidPresets = {
  conservative: { kp: 1.5, ki: 0.1, kd: 0.5 },
  default: { kp: 3.0, ki: 0.2, kd: 1.0 },
  aggressive: { kp: 5.0, ki: 0.5, kd: 1.5 },
  highPrecision: { kp: 4.0, ki: 0.3, kd: 2.0 },
  fastResponse: { kp: 6.0, ki: 0.1, kd: 0.8 },
  smooth: { kp: 2.0, ki: 0.4, kd: 1.2 }
};

// service status (we listen to same services_status event in other components, but keep a local mirror)
const servicesStatus = ref({ pid: false, kp_angular: false });

// Responses log
const responses = ref<string[]>([]);

function selectRobot(id: number) { selectedRobotId.value = id; }

function setPIDPreset(preset: keyof typeof pidPresets) {
  const values = pidPresets[preset];
  pidKp.value = values.kp;
  pidKi.value = values.ki;
  pidKd.value = values.kd;
}

function updatePID() {
  if (selectedRobotId.value === null) {
    alert('Por favor, selecione um robô.');
    return;
  }
  if (!servicesStatus.value.pid) {
    alert('Serviço de PID não está disponível.');
    return;
  }

  const payload = {
    robot_id: selectedRobotId.value,
    kp: pidKp.value,
    ki: pidKi.value,
    kd: pidKd.value
  };

  socket.emit('updatePID', payload);
  responses.value.unshift(`[${new Date().toLocaleTimeString()}] Atualizando PID para robô ${payload.robot_id}...`);
}

function updateKpAngular() {
  if (!servicesStatus.value.kp_angular) {
    alert('Serviço de Kp Angular não está disponível.');
    return;
  }
  const payload = { kp: kpAngular.value };
  socket.emit('updateKpAngular', payload);
  responses.value.unshift(`[${new Date().toLocaleTimeString()}] Atualizando Kp Angular...`);
}

// Socket listeners
socket.on('pid_response', (data) => {
  const time = new Date().toLocaleTimeString();
  const message = data.success 
    ? `[${time}] SUCESSO: PID atualizado.`
    : `[${time}] FALHA: ${data.message || 'Falha ao atualizar PID.'}`;
  responses.value.unshift(message);
  if (responses.value.length > 20) responses.value.pop();
});

socket.on('kp_angular_response', (data) => {
  const time = new Date().toLocaleTimeString();
  const message = data.success 
    ? `[${time}] SUCESSO: Kp Angular atualizado.`
    : `[${time}] FALHA: ${data.message || 'Falha ao atualizar Kp Angular.'}`;
  responses.value.unshift(message);
  if (responses.value.length > 20) responses.value.pop();
});

// Keep services status locally updated
socket.on('services_status', (status) => {
  servicesStatus.value = { pid: !!status.pid, kp_angular: !!status.kp_angular };
});
</script>

<template>
  <div class="control-container">
    <div class="form-section">
      <span class="section-label">Ajuste PID</span>

      <!-- Seleção do Robô (compartilhada) -->
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

      <div class="inputs-grid">
        <div class="param-row">
          <div class="param-label">Kp (Proporcional)</div>
          <div class="param-control">
            <input class="slider" type="range" min="0" max="10" step="0.1" v-model.number="pidKp" />
            <input class="number-input" type="number" step="0.1" v-model.number="pidKp" />
            <div class="value-badge">{{ pidKp.toFixed(2) }}</div>
          </div>
        </div>

        <div class="param-row">
          <div class="param-label">Kd (Derivativo)</div>
          <div class="param-control">
            <input class="slider" type="range" min="0" max="5" step="0.1" v-model.number="pidKd" />
            <input class="number-input" type="number" step="0.1" v-model.number="pidKd" />
            <div class="value-badge">{{ pidKd.toFixed(2) }}</div>
          </div>
        </div>

        <div class="param-row">
          <div class="param-label">Ki (Integral)</div>
          <div class="param-control">
            <input class="slider" type="range" min="0" max="1" step="0.01" v-model.number="pidKi" />
            <input class="number-input" type="number" step="0.01" v-model.number="pidKi" />
            <div class="value-badge">{{ pidKi.toFixed(3) }}</div>
          </div>
        </div>

        <div class="param-row">
          <div class="param-label">Kp Angular</div>
          <div class="param-control">
            <input class="slider" type="range" min="0" max="10" step="0.1" v-model.number="kpAngular" />
            <input class="number-input" type="number" step="0.1" v-model.number="kpAngular" />
            <div class="value-badge">{{ kpAngular.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <div class="presets-section">
        <span class="preset-label">Presets PID:</span>
        <div class="presets-grid">
          <button @click="setPIDPreset('conservative')">Conservador</button>
          <button @click="setPIDPreset('default')">Padrão</button>
          <button @click="setPIDPreset('aggressive')">Agressivo</button>
          <button @click="setPIDPreset('highPrecision')">Alta Precisão</button>
          <button @click="setPIDPreset('fastResponse')">Resposta Rápida</button>
          <button @click="setPIDPreset('smooth')">Suave</button>
        </div>
      </div>

      <div class="action-buttons">
        <button class="action-button" @click="updatePID" :disabled="!servicesStatus.pid">
          ⚙️ Atualizar PID
        </button>
        <button class="action-button" @click="updateKpAngular" :disabled="!servicesStatus.kp_angular">
          🔄 Atualizar Kp Angular
        </button>
      </div>

      <div class="response-log-section">
        <span class="section-label">Últimas Respostas</span>
        <div class="response-log">
          <p v-for="(msg, index) in responses" :key="index" :class="{ success: msg.includes('SUCESSO'), fail: msg.includes('FALHA') }">{{ msg }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reutiliza classes já existentes do StrategyControl para aparência consistente */
.control-container { display: flex; flex-direction: column; gap: var(--spacing-4); width: 100%; }
.form-section { display: flex; flex-direction: column; gap: var(--spacing-3); }
.section-label { font-size: var(--font-size-base); color: var(--texto-principal); font-weight: var(--font-weight-bold); }
.inputs-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-3); }
.presets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--spacing-2); }
.response-log { background-color: rgba(0,0,0,0.3); border-radius: var(--border-radius-sm); padding: var(--spacing-2); height: 150px; overflow-y: auto; font-family: 'Courier New', Courier, monospace; font-size: var(--font-size-sm); border: 1px solid var(--cor-borda); }
.response-log p.success { color: var(--cor-sucesso); }
.response-log p.fail { color: var(--cor-erro); }
.robot-selector { display: flex; flex-wrap: wrap; gap: var(--spacing-2); }
.robot-card { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: transparent; border: 2px solid var(--cor-borda); border-radius: var(--border-radius-md); font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); cursor: pointer; transition: all 0.2s ease; }
.robot-card.active { background-color: var(--cor-destaque); border-color: var(--cor-destaque); color: white; }
.selection-header { display: flex; align-items: flex-end; gap: var(--spacing-3); }
.team-selector { display: flex; gap: var(--spacing-2); }
.team-selector button { padding: var(--spacing-1) var(--spacing-3); border: 1px solid var(--cor-borda); background: transparent; color: var(--texto-secundario); border-radius: var(--border-radius-md); cursor: pointer; }
.action-buttons { display: flex; gap: var(--spacing-2); margin-top: var(--spacing-3); }
.action-button { 
  flex: 1; min-width: 160px; cursor: pointer; padding: var(--spacing-3); font-size: var(--font-size-md); font-weight: var(--font-weight-bold); border-radius: var(--border-radius-md); border: none;
  background: linear-gradient(45deg, var(--cor-destaque), var(--cor-destaque-hover));
  color: white; 
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3), var(--glow-effect-destaque);
}
.action-button:disabled {
  background: var(--fundo-terciario);
  color: var(--texto-secundario);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Presets buttons */
.presets-grid button { background-color: var(--fundo-terciario); color: var(--texto-secundario); border: var(--border-width) solid var(--cor-borda); padding: var(--spacing-2); border-radius: var(--border-radius-sm); cursor: pointer; transition: all 0.2s ease; font-size: var(--font-size-sm); }
.presets-grid button:hover { background-color: var(--cor-destaque); color: white; }

/* PID sliders and nicer controls */
.param-row { display: flex; align-items: center; gap: var(--spacing-3); }
.param-label { width: 160px; color: var(--texto-secundario); }
.param-control { display: flex; align-items: center; gap: var(--spacing-2); width: 100%; }
.slider { -webkit-appearance: none; appearance: none; width: 100%; height: 8px; border-radius: 6px; background: linear-gradient(90deg, var(--cor-destaque), var(--cor-destaque-hover)); outline: none; }
.slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: white; border: 2px solid var(--cor-destaque); box-shadow: 0 2px 6px rgba(0,0,0,0.2); cursor: pointer; }
.number-input { width: 84px; padding: 8px; border-radius: var(--border-radius-sm); border: 2px solid var(--cor-borda); background: var(--fundo-terciario); color: var(--texto-principal); }
.value-badge { min-width: 64px; text-align: center; background: rgba(255,255,255,0.06); padding: 6px 10px; border-radius: 999px; color: var(--texto-principal); border: 1px solid rgba(255,255,255,0.04); font-weight: var(--font-weight-bold); }

@media (max-width: 768px) {
  .param-label { width: 120px; }
  .number-input { width: 64px; }
}
</style>