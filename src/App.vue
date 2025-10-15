<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { activeTheme } from './socket'; 


import Name from './components/name.vue';
import PlayButton from './components/play.vue';
import Field from './components/field.vue';
import Card from './components/card.vue';
import RobotCard from './components/robotcard.vue';
import ConfigTerminal from './components/configterminal.vue';
import Terminal from './components/terminal.vue';
import StrategyControl from './components/StrategyControl.vue';
/* import PidTuner from './components/PidTuner.vue'; */
import ThemeSwitcher from './components/ThemeSwitcher.vue';

// --- ESTADO CENTRALIZADO ---
interface RobotSharedConfig { id: number; name: string; }
const activeSidebarComponent = ref<'robots' | 'pid' | 'commands' | 'config'>('robots');
const robotConfigs = ref<RobotSharedConfig[]>([]);
const robotRoles = ref<{ [key: number]: string }>({});

// --- LÓGICA DE REDIMENSIONAMENTO DO TERMINAL ---
const terminalHeight = ref(250);
const isResizing = ref(false);
const startResize = (event: MouseEvent) => { isResizing.value = true; window.addEventListener('mousemove', doResize); window.addEventListener('mouseup', stopResize); };
const doResize = (event: MouseEvent) => { if (isResizing.value) { const newHeight = window.innerHeight - event.clientY - 24; if (newHeight > 100 && newHeight < window.innerHeight * 0.8) { terminalHeight.value = newHeight; } } };
const stopResize = () => { isResizing.value = false; window.removeEventListener('mousemove', doResize); window.removeEventListener('mouseup', stopResize); };

// --- FUNÇÕES DE ATUALIZAÇÃO DE ESTADO ---
function handleConfigsUpdate(newConfigs: RobotSharedConfig[]) { robotConfigs.value = newConfigs; }
function handleRolesUpdate(newRoles: { [key: number]: string }) { robotRoles.value = newRoles; }
function handleTargetUpdate(newTarget: { x: number, y: number }) {
}

onMounted(() => {
  const savedData = localStorage.getItem('cardData');
  if (savedData) { robotConfigs.value = JSON.parse(savedData); }
  else { robotConfigs.value = Array.from({ length: 3 }, (_, i) => ({ id: i, name: `Robô ${i + 1}`})); }
  
  const savedRoles = localStorage.getItem('selectedRobotRoles');
  if (savedRoles) { robotRoles.value = JSON.parse(savedRoles); }
});
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', doResize);
  window.removeEventListener('mouseup', stopResize);
});
</script>


<template>
  <div class="app-container" :class="[activeTheme, { 'is-resizing': isResizing }]">
    <main class="dashboard-grid">
      <aside class="sidebar sidebar-left">
        <Name title="ARARABOTS" />
        
        <div class="sidebar-left-content">
          <Card 
            :robots="robotConfigs" 
            :roles="robotRoles"
            @roles-updated="handleRolesUpdate"
          />
        </div>

        <div class="sidebar-left-footer">
          <PlayButton />
        </div>
      </aside>

     <section class="main-content" :style="{ gridTemplateRows: `1fr auto ${terminalHeight}px` }">
        <Field class="field-area" @target-updated="handleTargetUpdate" />
        <div class="resizer" @mousedown="startResize"></div>
        <Terminal class="terminal-area" />
      </section>

      <aside class="sidebar sidebar-right">
        <div class="sidebar-nav">
          <button :class="{ active: activeSidebarComponent === 'robots' }" @click="activeSidebarComponent = 'robots'">Robots</button>
          <!-- <button :class="{ active: activeSidebarComponent === 'pid' }" @click="activeSidebarComponent = 'pid'">Ajuste PID</button> -->
          <button :class="{ active: activeSidebarComponent === 'commands' }" @click="activeSidebarComponent = 'commands'">Comandos</button>
          <button :class="{ active: activeSidebarComponent === 'config' }" @click="activeSidebarComponent = 'config'">Config GPIO</button>
        </div>
        
        <RobotCard v-if="activeSidebarComponent === 'robots'" @configs-updated="handleConfigsUpdate" />
        <!-- <PidTuner v-if="activeSidebarComponent === 'pid'" /> -->
        <StrategyControl v-if="activeSidebarComponent === 'commands'" :roles="robotRoles" />
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

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-3);
  background-color: var(--fundo-secundario);
  border-bottom: 1px solid var(--cor-borda);
  flex-shrink: 0;
  height: 70px;
}

.dashboard-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: minmax(320px, 0.7fr) 1.5fr minmax(420px, 0.9fr);
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  height: calc(100% - 70px);
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
  grid-template-rows: auto 1fr;
  gap: var(--spacing-3);
  overflow: hidden;
  padding: var(--spacing-3);
}

.field-area {
  overflow: hidden;
}

.terminal-area {
  min-height: 200px;
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
  background-color: var(--fundo-terciario);
  color: var(--texto-secundario);
  border: none;
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
}
</style>