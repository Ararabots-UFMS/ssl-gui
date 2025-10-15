<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { socket, yellowRobots, blueRobots } from '@/socket';

// --- ESTADO REATIVO ---
const openSection = ref<'manual' | 'campaigns' | 'advanced'>('manual');

const selectedTeam = ref<'yellow' | 'blue'>('yellow');
const selectedRobotId = ref<number | null>(null);
const positionX = ref(0.0);
const positionY = ref(0.0);
const velocityX = ref(0.0);
const velocityY = ref(0.0);
const orientation = ref(0.0);
const obstacles = ref({ fieldBorder: true, penaltyArea: false, centerArea: false, ball: true, enemyIds: [] as number[], allyIds: [] as number[] });
const servicesStatus = ref({ strategy: false, pid: false, kp_angular: false, orientation: false, obstacles: false, team_color: false });
const campaignRunning = ref(false);
const campaignType = ref<'horizontal' | 'vertical'>('horizontal');
let campaignInterval: NodeJS.Timeout | null = null;
const responses = ref<string[]>([]);

// --- CONSTANTES ---
const presets = { center: { x: 0, y: 0 }, ourGoal: { x: -4500, y: 0 }, enemyGoal: { x: 4500, y: 0 }, ourPenalty: { x: -3500, y: 0 } };

// --- LÓGICA DO DIAL ---
const dialContainer = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const updateAngle = (event: MouseEvent) => { if (!dialContainer.value) return; const rect = dialContainer.value.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; const angleRad = Math.atan2(event.clientY - centerY, event.clientX - centerX); orientation.value = Math.round(angleRad * (180 / Math.PI)); };
const startDrag = (event: MouseEvent) => { isDragging.value = true; updateAngle(event); window.addEventListener('mousemove', onDrag); window.addEventListener('mouseup', stopDrag); };
const onDrag = (event: MouseEvent) => { if (isDragging.value) { updateAngle(event); } };
const stopDrag = () => { isDragging.value = false; window.removeEventListener('mousemove', onDrag); window.removeEventListener('mouseup', stopDrag); };
onBeforeUnmount(() => { stopDrag(); stopCampaign(); if(statusInterval) clearInterval(statusInterval); });

// --- COMPUTED & LISTENERS ---
const activeTeamRobots = computed(() => { const team = selectedTeam.value === 'yellow' ? yellowRobots : blueRobots; if ((selectedRobotId.value === null || !team.some(r => r.id === selectedRobotId.value)) && team.length > 0) { selectedRobotId.value = team[0].id; } return team; });
const logAction = (msg: string) => { const time = new Date().toLocaleTimeString(); responses.value.unshift(`[${time}] ${msg}`); if(responses.value.length > 50) responses.value.pop(); };
socket.on('strategy_response', (data) => logAction(data.success ? '✅ SUCESSO: Estratégia' : '❌ FALHA: Estratégia'));
socket.on('orientation_response', (data) => logAction(data.success ? '✅ SUCESSO: Orientação' : '❌ FALHA: Orientação'));
socket.on('obstacles_response', (data) => logAction(data.success ? '✅ SUCESSO: Obstáculos' : '❌ FALHA: Obstáculos'));
socket.on('team_color_response', (data) => logAction(data.success ? '✅ SUCESSO: Cor do Time' : '❌ FALHA: Cor do Time'));
socket.on('services_status', (status) => { servicesStatus.value = status; });

// --- FUNÇÕES ---
function selectRobot(id: number) { selectedRobotId.value = id; }
function checkAndAlert(service: keyof typeof servicesStatus.value, robotNeeded = true) { if (robotNeeded && selectedRobotId.value === null) { alert('Selecione um robô.'); return false; } if (!servicesStatus.value[service]) { alert(`Serviço '${service}' não disponível.`); return false; } return true; }
function sendStrategyCommand() { if (!checkAndAlert('strategy')) return; const payload = { robot_id: selectedRobotId.value, position_x: positionX.value, position_y: positionY.value, velocity_x: velocityX.value, velocity_y: velocityY.value, orientation: orientation.value * (Math.PI / 180) }; socket.emit('strategyCommand', payload); logAction(`Enviando comando para R${payload.robot_id}...`); }
function setRobotOrientation() { if (!checkAndAlert('orientation')) return; const payload = { robot_id: selectedRobotId.value, orientation: orientation.value * (Math.PI / 180) }; socket.emit('setOrientation', payload); logAction(`Definindo orientação para R${payload.robot_id}...`); }
function updateObstacles() { if (!checkAndAlert('obstacles')) return; const payload = { robot_id: selectedRobotId.value, ...obstacles.value }; socket.emit('updateObstacles', payload); logAction(`Atualizando obstáculos para R${payload.robot_id}...`); }
function setTeamColor(isYellow: boolean) { if (!checkAndAlert('team_color', false)) return; socket.emit('setTeamColorService', { is_yellow: isYellow }); logAction(`Definindo time como ${isYellow ? 'Amarelo' : 'Azul'}...`); }
function checkServicesStatus() { socket.emit('checkServicesStatus'); }
function setPreset(x: number, y: number) { positionX.value = x; positionY.value = y; }
function setOrientation(degrees: number) { orientation.value = degrees; }
function startCampaign() { if (campaignRunning.value) { stopCampaign(); return; } if (!checkAndAlert('strategy')) return; campaignRunning.value = true; let toggle = false; const targets = campaignType.value === 'horizontal' ? [presets.ourGoal, presets.enemyGoal] : [{ x: 0, y: -1500 }, { x: 0, y: 1500 }]; campaignInterval = setInterval(() => { const target = toggle ? targets[1] : targets[0]; socket.emit('strategyCommand', { robot_id: selectedRobotId.value, position_x: target.x, position_y: target.y, velocity_x: 0, velocity_y: 0 }); toggle = !toggle; }, 5000); logAction(`Iniciando campanha para R${selectedRobotId.value}...`); }
function stopCampaign() { if (campaignInterval) { clearInterval(campaignInterval); campaignInterval = null; } campaignRunning.value = false; logAction('Campanha interrompida.'); }
const statusInterval = setInterval(checkServicesStatus, 5000);
checkServicesStatus();
</script>


<template>
  <div class="control-container">
    <div class="status-header">
      <div class="service-item" title="Estratégia"><div class="status-indicator" :class="{ online: servicesStatus.strategy }"></div><span>Estratégia</span></div>
      <div class="service-item" title="Orientação"><div class="status-indicator" :class="{ online: servicesStatus.orientation }"></div><span>Orientação</span></div>
      <div class="service-item" title="Obstáculos"><div class="status-indicator" :class="{ online: servicesStatus.obstacles }"></div><span>Obstáculos</span></div>
      <button @click="checkServicesStatus" class="refresh-button" title="Atualizar Status">🔄</button>
    </div>

    <div class="accordion">
      <div class="accordion-item">
        <div class="accordion-header" @click="openSection = openSection === 'manual' ? null : 'manual'">
          <span class="section-label">Controle Manual</span>
          <span class="accordion-icon">{{ openSection === 'manual' ? null : '+' }}</span>
        </div>
        <div v-if="openSection === 'manual'" class="accordion-content">
          
          <span class="subsection-label">1. Selecione o Robô</span>
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



          <hr class="separator"/>

          <span class="subsection-label">2. Defina o Alvo</span>
          <div class="action-buttons single-action">
            <button class="action-button primary" @click="sendStrategyCommand" :disabled="!servicesStatus.strategy">📍 Enviar Comando</button>
          </div>
        </div>
      </div>

      <div class="accordion-item">
        <div class="accordion-header" @click="openSection = openSection === 'campaigns' ? null : 'campaigns'">
          <span class="section-label">Campanhas Automáticas</span>
           <span class="accordion-icon">{{ openSection === 'campaigns' ? null : '+' }}</span>
        </div>
        <div v-if="openSection === 'campaigns'" class="accordion-content">
          </div>
      </div>

      <div class="accordion-item">
        <div class="accordion-header" @click="openSection = openSection === 'advanced' ? null : 'advanced'">
          <span class="section-label">Configurações Avançadas</span>
           <span class="accordion-icon">{{ openSection === 'advanced' ? null : '+' }}</span>
        </div>
        <div v-if="openSection === 'advanced'" class="accordion-content">
          <span class="subsection-label">Configuração de Obstáculos</span>
          <hr class="separator"/>

          <span class="subsection-label">Configurações do Time</span>
          </div>
      </div>
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
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.control-container { display: flex; flex-direction: column; gap: var(--spacing-4); width: 100%; animation: fadeIn 0.5s ease-out; }
.status-header { display: flex; flex-wrap: wrap; gap: var(--spacing-3); align-items: center; background: rgba(0,0,0,0.2); padding: var(--spacing-2); border-radius: var(--border-radius-sm); border: 1px solid var(--cor-borda);}
.service-item { display: flex; align-items: center; gap: var(--spacing-2); }
.service-item span { font-size: var(--font-size-sm); color: var(--texto-secundario); }
.status-indicator { width: 10px; height: 10px; border-radius: 50%; background: var(--cor-erro); }
.status-indicator.online { background: var(--cor-sucesso); box-shadow: 0 0 5px var(--cor-sucesso); }
.refresh-button { margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--texto-secundario); opacity: 0.7; transition: opacity 0.2s ease; }
.refresh-button:hover { opacity: 1; }
.accordion { display: flex; flex-direction: column; gap: var(--spacing-2); }
.accordion-item { background: var(--fundo-terciario); border-radius: var(--border-radius-sm); border: 1px solid var(--cor-borda); }
.accordion-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-2) var(--spacing-3); cursor: pointer; }
.accordion-header:hover { background-color: rgba(255,255,255,0.05); }
.section-label { font-weight: var(--font-weight-bold); color: var(--texto-principal); }
.subsection-label { font-size: var(--font-size-sm); color: var(--texto-secundario); font-weight: var(--font-weight-bold); text-transform: uppercase; }
.accordion-icon { font-size: var(--font-size-xl); color: var(--texto-secundario); }
.accordion-content { padding: var(--spacing-3); border-top: 1px solid var(--cor-borda); display: flex; flex-direction: column; gap: var(--spacing-3); animation: fadeIn 0.5s ease; }
.separator { border: none; height: 1px; background-color: var(--cor-borda); }
.manual-control-grid { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: var(--spacing-4); }
.inputs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-3); }
.action-buttons { display: flex; gap: var(--spacing-2); justify-content: flex-start; flex-wrap: wrap; }
.action-buttons.single-action { justify-content: flex-end; }
.input-wrapper { display: flex; flex-direction: column; gap: var(--spacing-1); }
.input-label { font-size: var(--font-size-sm); color: var(--texto-secundario); }
input[type="number"], input[type="text"] { border: none; border-bottom: 2px solid var(--cor-borda); background-color: transparent; padding: var(--spacing-2) 0; border-radius: 0; color: var(--texto-principal); font-size: var(--font-size-base); }
input:focus { outline: none; border-color: var(--cor-destaque); }
.response-log-section { margin-top: var(--spacing-3); }
.response-log { background-color: rgba(0,0,0,0.3); border-radius: var(--border-radius-sm); padding: var(--spacing-2); height: 150px; overflow-y: auto; font-family: 'Courier New', Courier, monospace; font-size: var(--font-size-sm); border: 1px solid var(--cor-borda); }
.response-log p.success { color: var(--cor-sucesso); }
.response-log p.fail { color: var(--cor-erro); }

</style>