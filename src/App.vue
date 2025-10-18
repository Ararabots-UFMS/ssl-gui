<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { activeTheme, socket } from './socket';

// Importação dos componentes
import Name from './components/name.vue';
import PlayButton from './components/play.vue';
import Field from './components/field.vue';
import Card from './components/card.vue';
import RobotCard from './components/robotcard.vue';
import ConfigTerminal from './components/configterminal.vue';
import Terminal from './components/terminal.vue';
import StrategyControl from './components/StrategyControl.vue';
import RefereePanel from './components/RefereePanel.vue';
import AIStatusPanel from './components/AIStatusPanel.vue';
import ModeSwitcher, { type RunMode } from './components/ModeSwitcher.vue'; 

// --- Tipagem para o Estado da IA ---
interface AIState {
  activePlay: { name: string; status: string; };
  robotStates: {
    id: number;
    role: { name: string; status: string; };
    skill: { name: string; status: string; };
  }[];
}

// --- ESTADO CENTRALIZADO ---
const activeSidebarComponent = ref<'robots' | 'commands' | 'referee' | 'config'>('robots');
const robotConfigs = ref<any[]>([]);
const robotRoles = ref<{ [key: number]: string }>({});
const lastRefereeCommand = ref<{ command: string; timestamp: Date } | null>(null);
const aiState = ref<AIState | null>(null); // <-- Estado da IA

// ESTADO QUE FALTAVA
const currentRunMode = ref<RunMode>('simulation');

// --- REF PARA O COMPONENTE TERMINAL ---
const terminalComponentRef = ref<InstanceType<typeof Terminal> | null>(null);

// --- LÓGICA DE REDIMENSIONAMENTO ---
const terminalHeight = ref(250);
const isResizing = ref(false);
const startResize = (event: MouseEvent) => { isResizing.value = true; window.addEventListener('mousemove', doResize); window.addEventListener('mouseup', stopResize); };
const doResize = (event: MouseEvent) => { if (isResizing.value) { const newHeight = window.innerHeight - event.clientY - 24; if (newHeight > 100 && newHeight < window.innerHeight * 0.8) { terminalHeight.value = newHeight; } } };
const stopResize = () => { isResizing.value = false; window.removeEventListener('mousemove', doResize); window.removeEventListener('mouseup', stopResize); };

// --- FUNÇÕES HANDLER ---
function handleConfigsUpdate(newConfigs: any[]) { robotConfigs.value = newConfigs; }
function handleRolesUpdate(newRoles: { [key: number]: string }) { robotRoles.value = newRoles; }
function handleTargetUpdate(newTarget: { x: number, y: number }) { }
function handleRefereeCommand(command: string) {
  lastRefereeCommand.value = { command: command, timestamp: new Date() };
  socket.emit('referee_command', { command: command });
}

// FUNÇÃO QUE FALTAVA
function handleRunModeChange(newMode: RunMode) {
  socket.emit('set_run_mode', { mode: newMode });
  currentRunMode.value = newMode; // Atualização otimista
  if (terminalComponentRef.value) {
    terminalComponentRef.value.addGeneralLog(`Solicitado modo: ${newMode.toUpperCase()}`, 'info');
  }
}

// --- LÓGICA DO WEBSOCKET ---
const onLogMessage = (data: { message: string, type: 'info' | 'error' }) => {
  if (terminalComponentRef.value) {
    terminalComponentRef.value.addGeneralLog(data.message, data.type);
  }
};
// Handler para o estado da IA
const onAIStateUpdate = (data: AIState) => {
  aiState.value = data;
};

// FUNÇÃO QUE FALTAVA
const onRunModeUpdate = (data: { mode: RunMode }) => {
  currentRunMode.value = data.mode;
};

// --- CICLO DE VIDA ---
onMounted(() => {
  // Carrega dados salvos
  const savedData = localStorage.getItem('cardData');
  if (savedData) { robotConfigs.value = JSON.parse(savedData); }
  else { robotConfigs.value = Array.from({ length: 3 }, (_, i) => ({ id: i, name: `Robô ${i + 1}`})); }
  
  const savedRoles = localStorage.getItem('selectedRobotRoles');
  if (savedRoles) { robotRoles.value = JSON.parse(savedRoles); }

  // Conecta os ouvintes do WebSocket
  socket.on('log_message', onLogMessage);
  socket.on('ai_state_update', onAIStateUpdate); // <-- Conecta o listener
  socket.on('run_mode_update', onRunModeUpdate); // <-- Conecta o listener
});

onBeforeUnmount(() => {
  // Desconecta os ouvintes para evitar vazamentos de memória
  socket.off('log_message', onLogMessage);
  socket.off('ai_state_update', onAIStateUpdate); // <-- Desconecta o listener
  socket.off('run_mode_update', onRunModeUpdate); // <-- Desconecta o listener
  
  window.removeEventListener('mousemove', doResize);
  window.removeEventListener('mouseup', stopResize);
});
</script>

<template>
  <div class="app-container" :class="[activeTheme, { 'is-resizing': isResizing },  ]">
    <main class="dashboard-grid">
      <aside class="sidebar sidebar-left">
        <Name title="ARARABOTS" />
        <div class="sidebar-left-content">
          <ModeSwitcher :currentMode="currentRunMode" @mode-changed="handleRunModeChange" />
          <Card 
            :robots="robotConfigs" 
            :roles="robotRoles"
            @roles-updated="handleRolesUpdate"
          />
          <AIStatusPanel :aiState="aiState" />
        </div>
         <div class="sidebar-left-footer">
          <PlayButton />
        </div>
      </aside>

      <section class="main-content" :style="{ gridTemplateRows: `1fr auto ${terminalHeight}px` }">
        <Field class="field-area" @target-updated="handleTargetUpdate" />
        <div class="resizer" @mousedown="startResize"></div>
        <Terminal 
          class="terminal-area" 
          :latestCommand="lastRefereeCommand"
          ref="terminalComponentRef"
        />
      </section>

      <aside class="sidebar sidebar-right">
        <div class="sidebar-nav">
          <button :class="{ active: activeSidebarComponent === 'robots' }" @click="activeSidebarComponent = 'robots'">Robots</button>
          <button :class="{ active: activeSidebarComponent === 'commands' }" @click="activeSidebarComponent = 'commands'">Comandos</button>
          <button :class="{ active: activeSidebarComponent === 'referee' }" @click="activeSidebarComponent = 'referee'">Referee</button>
          <button :class="{ active: activeSidebarComponent === 'config' }" @click="activeSidebarComponent = 'config'">Config GPIO</button>
        </div>
        
        <RobotCard v-if="activeSidebarComponent === 'robots'" @configs-updated="handleConfigsUpdate" />
        <StrategyControl v-if="activeSidebarComponent === 'commands'" :roles="robotRoles" />
        <RefereePanel v-if="activeSidebarComponent === 'referee'" @sendCommand="handleRefereeCommand" />
        <ConfigTerminal v-if="activeSidebarComponent === 'config'" />
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: var(--fundo-principal);
  color: var(--texto-principal);
  overflow: hidden;
}
.app-container.is-resizing { cursor: row-resize; user-select: none; }
.dashboard-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: minmax(320px, 0.7fr) 1.5fr minmax(420px, 0.9fr);
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  height: 100%;
}
.sidebar,
.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  background: var(--fundo-gradiente-painel, var(--fundo-secundario));
  border-radius: var(--border-radius-md);
  padding: var(--spacing-3);
  overflow-y: auto;
  min-width: 0;
}
.main-content {
  display: grid;
  gap: 0;
  overflow: hidden;
  padding: 0;
  background: transparent;
  border-radius: 0;
}
.field-area {
  overflow: hidden;
  background: var(--fundo-gradiente-painel, var(--fundo-secundario));
  border-radius: var(--border-radius-md);
  padding: var(--spacing-3);
}
.resizer {
  height: 8px;
  cursor: row-resize;
  width: 100%;
  background-color: transparent;
  position: relative;
  z-index: 10;
}
.terminal-area {
  background: var(--fundo-gradiente-painel, var(--fundo-secundario));
  border-radius: var(--border-radius-md);
  min-height: 100px;
}
.sidebar-nav {
  display: flex;
  gap: var(--spacing-2);
  border-bottom: var(--border-width) solid var(--cor-borda);
  padding-bottom: var(--spacing-3);
  flex-shrink: 0;
}
.sidebar-nav button {
  flex-grow: 1;
  padding: var(--spacing-2) var(--spacing-3);
  background-color: transparent;
  color: var(--texto-secundario);
  border: var(--border-width) solid var(--fundo-terciario);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all 0.2s ease;
}
.sidebar-nav button:hover {
  color: var(--texto-principal);
  background-color: var(--fundo-terciario);
}
.sidebar-nav button.active {
  color: var(--texto-principal);
  background-color: var(--cor-destaque);
  border-color: var(--cor-destaque);
}
.sidebar-left-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3); /* Adiciona espaço entre os cards */
}
.sidebar-left-footer {
  flex-shrink: 0;
  display: flex; /* <-- ESTILO ADICIONADO */
  gap: var(--spacing-2); /* <-- ESTILO ADICIONADO */
}
</style>