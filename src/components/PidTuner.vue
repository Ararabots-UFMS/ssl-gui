<script setup lang="ts">
import { ref } from 'vue';
import { socket } from '@/socket';

// --- ESTADO REATIVO (Apenas para PID) ---
const selectedRobotId = ref(0);
const pidKp = ref(3.0);
const pidKi = ref(0.2);
const pidKd = ref(1.0);
const kpAngular = ref(2.5);
const servicesStatus = ref({ pid: false, kp_angular: false });
const responses = ref<string[]>([]);

// --- CONSTANTES ---
const pidPresets = {
  conservative: { kp: 1.5, ki: 0.1, kd: 0.5 },
  default: { kp: 3.0, ki: 0.2, kd: 1.0 },
  aggressive: { kp: 5.0, ki: 0.5, kd: 1.5 },
  highPrecision: { kp: 4.0, ki: 0.3, kd: 2.0 },
  fastResponse: { kp: 6.0, ki: 0.1, kd: 0.8 },
  smooth: { kp: 2.0, ki: 0.4, kd: 1.2 }
};

// --- LISTENERS ---
socket.on('pid_response', (data) => {
  const time = new Date().toLocaleTimeString();
  responses.value.unshift(data.success ? `[${time}] SUCESSO: PID atualizado.` : `[${time}] FALHA: PID não atualizado.`);
});
socket.on('kp_angular_response', (data) => {
    const time = new Date().toLocaleTimeString();
    responses.value.unshift(data.success ? `[${time}] SUCESSO: Kp Angular atualizado.` : `[${time}] FALHA: Kp Angular não atualizado.`);
});
socket.on('services_status', (status) => {
  if (status.pid !== undefined) servicesStatus.value.pid = status.pid;
  if (status.kp_angular !== undefined) servicesStatus.value.kp_angular = status.kp_angular;
});

// --- FUNÇÕES ---
function updatePID() {
  const payload = { robot_id: selectedRobotId.value, kp: pidKp.value, ki: pidKi.value, kd: pidKd.value };
  socket.emit('updatePID', payload);
  responses.value.unshift(`[${new Date().toLocaleTimeString()}] Atualizando PID para R${payload.robot_id}...`);
}
function updateKpAngular() {
  const payload = { robot_id: selectedRobotId.value, kp: kpAngular.value }; // Assumindo que o serviço espera 'kp'
  socket.emit('updateKpAngular', payload);
  responses.value.unshift(`[${new Date().toLocaleTimeString()}] Atualizando Kp Angular para R${payload.robot_id}...`);
}
function setPIDPreset(presetKey: keyof typeof pidPresets) {
  const values = pidPresets[presetKey];
  pidKp.value = values.kp;
  pidKi.value = values.ki;
  pidKd.value = values.kd;
}
</script>

<template>
  <div class="control-container">
    <div class="form-section">
      <span class="section-label">Status dos Serviços de Ajuste</span>
       <div class="services-status">
        <div class="service-item" :class="{ active: servicesStatus.pid }"><span>PID</span><div class="status-indicator" :class="{ online: servicesStatus.pid }"></div></div>
        <div class="service-item" :class="{ active: servicesStatus.kp_angular }"><span>Kp Angular</span><div class="status-indicator" :class="{ online: servicesStatus.kp_angular }"></div></div>
      </div>
    </div>
    
    <div class="form-section">
      <span class="section-label">4. Controle PID</span>
      <label class="input-wrapper">
        <span class="input-label">ID do Robô (0-15)</span>
        <select v-model.number="selectedRobotId" class="robot-id-select">
          <option v-for="n in 16" :key="n-1" :value="n-1">{{ n-1 }}</option>
        </select>
      </label>
      <div class="inputs-grid">
         <label class="input-wrapper">
          <span class="input-label">Kp (Proporcional)</span>
          <input type="number" step="0.1" v-model.number="pidKp" />
        </label>
        <label class="input-wrapper">
          <span class="input-label">Ki (Integral)</span>
          <input type="number" step="0.01" v-model.number="pidKi" />
        </label>
        <label class="input-wrapper">
          <span class="input-label">Kd (Derivativo)</span>
          <input type="number" step="0.1" v-model.number="pidKd" />
        </label>
      </div>
      <div class="action-buttons">
        <button class="action-button" @click="updatePID" :disabled="!servicesStatus.pid">
          ⚙️ Atualizar PID
        </button>
      </div>
    </div>
    
    <div class="form-section">
        <span class="section-label">Kp Angular</span>
        <label class="input-wrapper">
            <span class="input-label">Valor: {{ kpAngular.toFixed(1) }}</span>
            <input type="range" min="0" max="10" step="0.1" v-model.number="kpAngular" class="slider-input" />
        </label>
        <div class="action-buttons">
            <button class="action-button" @click="updateKpAngular" :disabled="!servicesStatus.kp_angular">
                🔄 Atualizar Kp Angular
            </button>
        </div>
    </div>

    <div class="form-section">
        <span class="section-label">Presets PID</span>
        <div class="presets-grid">
            <button v-for="(preset, key) in pidPresets" :key="key" @click="setPIDPreset(key as keyof typeof pidPresets)">
                {{ key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1') }}
            </button>
        </div>
    </div>

    <div class="response-log-section">
       <span class="section-label">Log de Respostas PID</span>
      <div class="response-log">
        <p v-for="(msg, index) in responses" :key="index" :class="{ success: msg.includes('SUCESSO'), fail: msg.includes('FALHA') }">{{ msg }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-container { display: flex; flex-direction: column; gap: var(--spacing-4); width: 100%; animation: fadeInSlideUp 0.5s ease-out forwards; }
@keyframes fadeInSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.form-section { display: flex; flex-direction: column; gap: var(--spacing-3); background: rgba(0,0,0,0.2); padding: var(--spacing-3); border-radius: var(--border-radius-md); border: 1px solid var(--cor-borda); }
.section-header { display: flex; justify-content: space-between; align-items: center; }
.section-label { font-size: var(--font-size-base); color: var(--texto-principal); font-weight: var(--font-weight-bold); }

.status-indicator { width: 10px; height: 10px; border-radius: 50%; background: var(--cor-erro); transition: background-color 0.3s ease; }
.status-indicator.online { background: var(--cor-sucesso); box-shadow: 0 0 5px var(--cor-sucesso); }

.inputs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-2); }
.input-wrapper { display: flex; flex-direction: column; gap: var(--spacing-1); }
.input-label { font-size: var(--font-size-sm); color: var(--texto-secundario); }

input[type="number"], .robot-id-select {
  border: none;
  border-bottom: 2px solid var(--cor-borda);
  background-color: transparent;
  padding: var(--spacing-2) 0;
  border-radius: 0;
  color: var(--texto-principal);
  font-size: var(--font-size-base);
  transition: border-color 0.3s ease;
}
input[type="number"]:focus, .robot-id-select:focus { outline: none; border-color: var(--cor-destaque); }

.slider-input { width: 100%; cursor: pointer; }

.main-actions { display: flex; justify-content: flex-end; }
.action-button {
  cursor: pointer;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  border-radius: var(--border-radius-sm);
  border: none;
  background-color: var(--cor-destaque);
  color: white;
  transition: all 0.2s ease;
}
.action-button:hover:not(:disabled) { filter: brightness(1.1); }
.action-button:disabled { background-color: var(--fundo-terciario); color: var(--texto-secundario); cursor: not-allowed; }

.presets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: var(--spacing-2); }
.presets-grid button {
  background-color: var(--fundo-terciario);
  color: var(--texto-secundario);
  border: var(--border-width) solid var(--cor-borda);
  padding: var(--spacing-2);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}
.presets-grid button:hover { background-color: var(--cor-destaque); color: white; }

.response-log-section { margin-top: var(--spacing-3); }
.response-log { background-color: rgba(0,0,0,0.3); border-radius: var(--border-radius-sm); padding: var(--spacing-2); height: 150px; overflow-y: auto; font-family: 'Courier New', Courier, monospace; font-size: var(--font-size-sm); border: 1px solid var(--cor-borda); }
.response-log p.success { color: var(--cor-sucesso); }
.response-log p.fail { color: var(--cor-erro); }
</style>