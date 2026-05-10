<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

import Name from './components/name.vue';
import PlayButton from './components/play.vue';
import Field from './components/field/field.vue';
import Card from './components/card.vue';
import RobotCard from './components/robotcard.vue';
import ConfigTerminal from './components/configterminal.vue';
import Terminal from './components/terminal.vue';
import StrategyControl from './components/StrategyControl.vue';
import RefereePanel from './components/RefereePanel.vue';
import AIStatusPanel from './components/AIStatusPanel.vue';
import ModeSwitcher, { type RunMode } from './components/ModeSwitcher.vue';
import { useRobotData } from './robotData/robotData';
import { useTheme } from './composables/useTheme';

interface AIState {
  activePlay: { name: string; status: string; };
  robotStates: {
    id: number;
    role: { name: string; status: string; };
    skill: { name: string; status: string; };
  }[];
}

const { socket } = useRobotData();
const { activeTheme } = useTheme();

const leftCollapsed = ref<boolean>(JSON.parse(localStorage.getItem('leftCollapsed') || 'false'));
const rightCollapsed = ref<boolean>(JSON.parse(localStorage.getItem('rightCollapsed') || 'false'));

const toggleLeft = () => {
  leftCollapsed.value = !leftCollapsed.value;
  localStorage.setItem('leftCollapsed', JSON.stringify(leftCollapsed.value));
};

const toggleRight = () => {
  rightCollapsed.value = !rightCollapsed.value;
  localStorage.setItem('rightCollapsed', JSON.stringify(rightCollapsed.value));
};

const activeSidebarComponent = ref<'robots' | 'commands' | 'referee' | 'config'>('robots');
const robotConfigs = ref<any[]>([]);
const robotRoles = ref<{ [key: number]: string }>({});
const lastRefereeCommand = ref<{ command: string; timestamp: Date } | null>(null);
const aiState = ref<AIState | null>(null);
const currentRunMode = ref<RunMode>('simulation');

const terminalComponentRef = ref<InstanceType<typeof Terminal> | null>(null);

const terminalHeight = ref(250);
const isResizing = ref(false);
const startResize = (event: MouseEvent) => { isResizing.value = true; window.addEventListener('mousemove', doResize); window.addEventListener('mouseup', stopResize); };
const doResize = (event: MouseEvent) => { if (isResizing.value) { const newHeight = window.innerHeight - event.clientY - 24; if (newHeight > 100 && newHeight < window.innerHeight * 0.8) { terminalHeight.value = newHeight; } } };
const stopResize = () => { isResizing.value = false; window.removeEventListener('mousemove', doResize); window.removeEventListener('mouseup', stopResize); };

function handleConfigsUpdate(newConfigs: any[]) { robotConfigs.value = newConfigs; }
function handleRolesUpdate(newRoles: { [key: number]: string }) { robotRoles.value = newRoles; }
function handleTargetUpdate(newTarget: { x: number, y: number }) { }
function handleRefereeCommand(command: string) {
  lastRefereeCommand.value = { command: command, timestamp: new Date() };
  socket.emit('referee_command', { command: command });
}

function handleRunModeChange(newMode: RunMode) {
  socket.emit('set_run_mode', { mode: newMode });
  currentRunMode.value = newMode;
  if (terminalComponentRef.value) {
    terminalComponentRef.value.addGeneralLog(`Solicitado modo: ${newMode.toUpperCase()}`, 'info');
  }
}

const onLogMessage = (data: { message: string, type: 'info' | 'error' }) => {
  if (terminalComponentRef.value) {
    terminalComponentRef.value.addGeneralLog(data.message, data.type);
  }
};

const onAIStateUpdate = (data: AIState) => {
  aiState.value = data;
};

const onRunModeUpdate = (data: { mode: RunMode }) => {
  currentRunMode.value = data.mode;
};

onMounted(() => {
  const savedData = localStorage.getItem('cardData');
  if (savedData) { robotConfigs.value = JSON.parse(savedData); }
  else { robotConfigs.value = Array.from({ length: 3 }, (_, i) => ({ id: i, name: `Robô ${i + 1}` })); }

  const savedRoles = localStorage.getItem('selectedRobotRoles');
  if (savedRoles) { robotRoles.value = JSON.parse(savedRoles); }

  socket.on('log_message', onLogMessage);
  socket.on('ai_state_update', onAIStateUpdate);
  socket.on('run_mode_update', onRunModeUpdate);
});

onBeforeUnmount(() => {
  socket.off('log_message', onLogMessage);
  socket.off('ai_state_update', onAIStateUpdate);
  socket.off('run_mode_update', onRunModeUpdate);

  window.removeEventListener('mousemove', doResize);
  window.removeEventListener('mouseup', stopResize);
});
</script>

<template>
  <div class="app-container" :class="[activeTheme, { 'is-resizing': isResizing }]">
    <main class="dashboard-grid">

      <aside class="sidebar sidebar-left" :class="{ collapsed: leftCollapsed }">
        <button class="collapse-toggle" @click="toggleLeft" :title="leftCollapsed ? 'Expandir' : 'Recolher'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" class="collapse-icon" :class="{ rotated: leftCollapsed }">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div class="sidebar-inner sidebar-left-inner" :class="{ hidden: leftCollapsed }">
          <Name title="ARARABOTS" />
          <div class="sidebar-left-content">
            <ModeSwitcher :currentMode="currentRunMode" @mode-changed="handleRunModeChange" />
            <Card :robots="robotConfigs" :roles="robotRoles" @roles-updated="handleRolesUpdate" />
            <AIStatusPanel :aiState="aiState" />
          </div>
          <div class="sidebar-left-footer">
            <PlayButton />
          </div>
        </div>
      </aside>

      <section class="main-content" :style="{ gridTemplateRows: `1fr auto ${terminalHeight}px` }">
        <Field class="field-area" @target-updated="handleTargetUpdate" />
        <div class="resizer" @mousedown="startResize"></div>
        <Terminal class="terminal-area" :latestCommand="lastRefereeCommand" ref="terminalComponentRef" />
      </section>

      <aside class="sidebar sidebar-right" :class="{ collapsed: rightCollapsed }">
        <button class="collapse-toggle collapse-toggle-right" @click="toggleRight"
          :title="rightCollapsed ? 'Expandir' : 'Recolher'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" class="collapse-icon"
            :class="{ 'rotated-right': !rightCollapsed }">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div class="sidebar-inner sidebar-right-inner" :class="{ hidden: rightCollapsed }">
          <div class="sidebar-nav">
            <button :class="{ active: activeSidebarComponent === 'robots' }"
              @click="activeSidebarComponent = 'robots'">Robots</button>
            <button :class="{ active: activeSidebarComponent === 'commands' }"
              @click="activeSidebarComponent = 'commands'">Comandos</button>
            <button :class="{ active: activeSidebarComponent === 'referee' }"
              @click="activeSidebarComponent = 'referee'">Referee</button>
            <button :class="{ active: activeSidebarComponent === 'config' }"
              @click="activeSidebarComponent = 'config'">Config GPIO</button>
          </div>
          <RobotCard v-if="activeSidebarComponent === 'robots'" @configs-updated="handleConfigsUpdate" />
          <StrategyControl v-if="activeSidebarComponent === 'commands'" :roles="robotRoles" />
          <RefereePanel v-if="activeSidebarComponent === 'referee'" @sendCommand="handleRefereeCommand" />
          <ConfigTerminal v-if="activeSidebarComponent === 'config'" />
        </div>
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

.app-container.is-resizing {
  cursor: row-resize;
  user-select: none;
}

.dashboard-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: auto 1.5fr auto;
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

.sidebar-left {
  min-width: 320px;
  overflow: hidden;
  position: relative;
  transition: min-width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-left.collapsed {
  min-width: 48px;
  max-width: 48px;
  padding: var(--spacing-2);
}

.sidebar-right {
  min-width: 400px;
  max-width: 400px;
  overflow: hidden;
  position: relative;
  transition: min-width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-right.collapsed {
  min-width: 48px;
  max-width: 48px;
  padding: var(--spacing-2);
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  flex-grow: 1;
  opacity: 1;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-inner.hidden {
  opacity: 0;
  pointer-events: none;
  position: absolute;
  visibility: hidden;
}

.sidebar-left-inner {
  min-width: 280px;
  transform: translateX(0);
}

.sidebar-left-inner.hidden {
  transform: translateX(-24px);
}

.sidebar-right-inner {
  min-width: 380px;
  transform: translateX(0);
}

.sidebar-right-inner.hidden {
  transform: translateX(24px);
}

.sidebar-left:not(.collapsed) .sidebar-inner,
.sidebar-right:not(.collapsed) .sidebar-inner {
  transition-delay: 0.15s;
}

.collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: var(--border-width) solid var(--cor-borda);
  border-radius: var(--border-radius-sm);
  background: var(--fundo-terciario);
  color: var(--texto-secundario);
  cursor: pointer;
  flex-shrink: 0;
  z-index: 2;
  transition: all 0.2s ease;
  align-self: flex-end;
}

.collapse-toggle-right {
  align-self: flex-start;
}

.sidebar-left.collapsed .collapse-toggle,
.sidebar-right.collapsed .collapse-toggle {
  align-self: center;
}

.collapse-toggle:hover {
  color: var(--texto-principal);
  background: var(--cor-destaque);
  border-color: var(--cor-destaque);
}

.collapse-icon {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-icon.rotated {
  transform: rotate(180deg);
}

.collapse-icon.rotated-right {
  transform: rotate(180deg);
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
  gap: var(--spacing-3);
}

.sidebar-left-footer {
  flex-shrink: 0;
  display: flex;
  gap: var(--spacing-2);
}
</style>
