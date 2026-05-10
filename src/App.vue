<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

import Field from './components/field/field.vue';
import Card from './components/card.vue';
import RobotCard from './components/robotcard.vue';
import ConfigTerminal from './components/configterminal.vue';
import Terminal from './components/terminal.vue';
import StrategyControl from './components/StrategyControl.vue';
import RefereePanel from './components/RefereePanel.vue';
import AIStatusPanel from './components/AIStatusPanel.vue';
import TopBar from './components/TopBar.vue';
import IconRail, { type RailTab } from './components/IconRail.vue';
import { type RunMode } from './components/ModeSwitcher.vue';
import { type FieldType } from './components/field/fieldConfig';
import { useRobotData } from './robotData/robotData';
import { useTheme } from './composables/useTheme';
import { addGeneralLog, addRefereeLog } from './composables/useLogs';

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

const fieldType = ref<FieldType>((localStorage.getItem('fieldType') as FieldType) || 'SSL-EL');
const showTrajectories = ref<boolean>(JSON.parse(localStorage.getItem('showTrajectories') || 'true'));
const currentRunMode = ref<RunMode>('simulation');

const activeTab = ref<RailTab | null>(JSON.parse(localStorage.getItem('activeRailTab') || '"robots"'));

const robotConfigs = ref<any[]>([]);
const robotRoles = ref<{ [key: number]: string }>({});
const aiState = ref<AIState | null>(null);

const titles: Record<RailTab, string> = {
  robots: 'Robôs',
  ai: 'Status da IA',
  strategy: 'Estratégia',
  referee: 'Juiz',
  config: 'Configuração GPIO',
  logs: 'Logs',
};
const panelTitle = computed(() => activeTab.value ? titles[activeTab.value] : '');

function handleConfigsUpdate(newConfigs: any[]) { robotConfigs.value = newConfigs; }
function handleRolesUpdate(newRoles: { [key: number]: string }) { robotRoles.value = newRoles; }
function handleRefereeCommand(command: string) {
  addRefereeLog(command, new Date());
  socket.emit('referee_command', { command });
}

function onFieldTypeUpdate(v: FieldType) {
  fieldType.value = v;
  localStorage.setItem('fieldType', v);
  try { socket.emit('fieldType', v); } catch { /* ignore */ }
}
function onTrajectoriesUpdate(v: boolean) {
  showTrajectories.value = v;
  localStorage.setItem('showTrajectories', JSON.stringify(v));
  try { socket.emit('showTrajectories', v); } catch { /* ignore */ }
}

function handleRunModeChange(newMode: RunMode) {
  socket.emit('set_run_mode', { mode: newMode });
  currentRunMode.value = newMode;
  addGeneralLog(`Solicitado modo: ${newMode.toUpperCase()}`, 'info');
}

function selectTab(t: RailTab) {
  activeTab.value = t;
  localStorage.setItem('activeRailTab', JSON.stringify(t));
}
function collapseTab() {
  activeTab.value = null;
  localStorage.setItem('activeRailTab', 'null');
}

const onLogMessage = (data: { message: string, type: 'info' | 'error' }) => {
  addGeneralLog(data.message, data.type);
};
const onAIStateUpdate = (data: AIState) => { aiState.value = data; };
const onRunModeUpdate = (data: { mode: RunMode }) => { currentRunMode.value = data.mode; };

onMounted(() => {
  const savedData = localStorage.getItem('cardData');
  if (savedData) { robotConfigs.value = JSON.parse(savedData); }
  else { robotConfigs.value = Array.from({ length: 3 }, (_, i) => ({ id: i, name: `Robô ${i + 1}` })); }

  const savedRoles = localStorage.getItem('selectedRobotRoles');
  if (savedRoles) { robotRoles.value = JSON.parse(savedRoles); }

  try { socket.emit('fieldType', fieldType.value); } catch { /* ignore */ }

  socket.on('log_message', onLogMessage);
  socket.on('ai_state_update', onAIStateUpdate);
  socket.on('run_mode_update', onRunModeUpdate);
});

onBeforeUnmount(() => {
  socket.off('log_message', onLogMessage);
  socket.off('ai_state_update', onAIStateUpdate);
  socket.off('run_mode_update', onRunModeUpdate);
});
</script>

<template>
  <div class="app-container" :class="activeTheme">
    <TopBar :showTrajectories="showTrajectories" :mode="currentRunMode"
      @update:showTrajectories="onTrajectoriesUpdate"
      @mode-changed="handleRunModeChange" />

    <main class="workspace" :class="{ 'panel-open': activeTab !== null }">
      <IconRail :active="activeTab" @select="selectTab" @collapse="collapseTab" />

      <aside class="side-panel" v-if="activeTab !== null">
        <header class="panel-header">
          <h2>{{ panelTitle }}</h2>
          <button class="panel-close" @click="collapseTab" title="Fechar">×</button>
        </header>
        <div class="panel-body">
          <template v-if="activeTab === 'robots'">
            <Card :robots="robotConfigs" :roles="robotRoles" @roles-updated="handleRolesUpdate" />
            <RobotCard @configs-updated="handleConfigsUpdate" />
          </template>
          <AIStatusPanel v-else-if="activeTab === 'ai'" :aiState="aiState" />
          <StrategyControl v-else-if="activeTab === 'strategy'" :roles="robotRoles" />
          <RefereePanel v-else-if="activeTab === 'referee'" @sendCommand="handleRefereeCommand" />
          <ConfigTerminal v-else-if="activeTab === 'config'" />
          <Terminal v-else-if="activeTab === 'logs'" />
        </div>
      </aside>

      <section class="field-area">
        <Field :fieldType="fieldType" :showTrajectories="showTrajectories" />
      </section>
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
  gap: var(--spacing-2);
}

.workspace {
  flex-grow: 1;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-3);
  min-height: 0;
}

.workspace.panel-open {
  grid-template-columns: auto clamp(240px, 20vw, 340px) 1fr;
}

.side-panel {
  display: flex;
  flex-direction: column;
  background: var(--fundo-gradiente-painel, var(--fundo-secundario));
  border-radius: var(--border-radius-md);
  overflow: hidden;
  min-width: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: var(--border-width) solid var(--cor-borda);
  flex-shrink: 0;
}

.panel-header h2 {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.panel-close {
  background: transparent;
  border: none;
  color: var(--texto-secundario);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 0 var(--spacing-1);
  border-radius: var(--border-radius-sm);
}

.panel-close:hover {
  color: var(--texto-principal);
  background: var(--fundo-terciario);
}

.panel-body {
  flex-grow: 1;
  overflow-y: auto;
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  min-height: 0;
}

.field-area {
  background: var(--fundo-gradiente-painel, var(--fundo-secundario));
  border-radius: var(--border-radius-md);
  padding: var(--spacing-1);
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  display: flex;
}
</style>
