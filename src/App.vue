<!-- <script setup lang="ts">
import { ref, onMounted } from 'vue';

import Name from './components/name.vue';
import PlayButton from './components/play.vue';
import Field from './components/field.vue';
import Card from './components/card.vue';
import RobotCard from './components/robotcard.vue';
import ConfigTerminal from './components/configterminal.vue';
import Terminal from './components/terminal.vue';

// --- INTERFACE PARA O ESTADO COMPARTILHADO ---
interface RobotSharedConfig {
  id: number;
  name: string;
}

// --- ESTADO CENTRALIZADO ---
const activeSidebarComponent = ref<'robots' | 'config'>('robots');

// O ESTADO AGORA É UM ARRAY DE OBJETOS COM AS CONFIGURAÇÕES DOS ROBÔS
const robotConfigs = ref<RobotSharedConfig[]>([]);

function handleConfigsUpdate(newConfigs: RobotSharedConfig[]) {
  robotConfigs.value = newConfigs;
}
onMounted(() => {
  const savedData = localStorage.getItem('cardData');
  if (savedData) {
    robotConfigs.value = JSON.parse(savedData);
  } else {
    robotConfigs.value = Array.from({ length: 3 }, (_, i) => ({ id: i, name: `Robô ${i + 1}`}));
  }
});
</script>

<template>
  <div class="app-container">
    <main class="dashboard-grid">
      <aside class="sidebar sidebar-left">
        <Name title="ARARABOTS" />
        <Card :robots="robotConfigs" />
        <PlayButton />
      </aside>

      <section class="main-content">
        <Field class="field-area" />
        <Terminal class="terminal-area" />
      </section>

      <aside class="sidebar sidebar-right">
        <div class="sidebar-nav">
          <button 
            :class="{ active: activeSidebarComponent === 'robots' }" 
            @click="activeSidebarComponent = 'robots'"
          >
            Robots
          </button>
          <button 
            :class="{ active: activeSidebarComponent === 'config' }" 
            @click="activeSidebarComponent = 'config'"
          >
            Terminal Config
          </button>
        </div>
        
        <RobotCard 
          v-if="activeSidebarComponent === 'robots'" 
          @configs-updated="handleConfigsUpdate" 
        />
        <ConfigTerminal v-if="activeSidebarComponent === 'config'" />
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  background-color: var(--fundo-principal);
  color: var(--texto-principal);
  overflow: hidden;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.7fr) 1.5fr minmax(420px, 0.9fr);
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  height: 100%;
  width: 100%;
}

.sidebar,
.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  background-color: var(--fundo-secundario);
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
  background-color: #4a507a;
}

.sidebar-nav button.active {
  color: #ffffff;
  background-color: var(--cor-destaque);
}
</style> -->

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { socket } from './socket'; // Importa o socket para podermos usá-lo

// Importando todos os componentes
import Name from './components/name.vue';
import PlayButton from './components/play.vue';
import Field from './components/field.vue';
import Card from './components/card.vue';
import RobotCard from './components/robotcard.vue';
import ConfigTerminal from './components/configterminal.vue';
import Terminal from './components/terminal.vue';
import StrategyControl from './components/StrategyControl.vue';

// --- INTERFACE PARA O ESTADO COMPARTILHADO ---
interface RobotSharedConfig {
  id: number;
  name: string;
}

// --- ESTADO CENTRALIZADO ---
// Controla qual aba está ativa na coluna da direita
const activeSidebarComponent = ref<'robots' | 'config' | 'pid' | 'commands'>('robots');

// Guarda a lista de configurações dos robôs
const robotConfigs = ref<RobotSharedConfig[]>([]);

// Função para atualizar a lista de configurações quando o RobotCard emite o evento
function handleConfigsUpdate(newConfigs: RobotSharedConfig[]) {
  robotConfigs.value = newConfigs;
}

// Carrega os dados salvos quando a aplicação inicia
onMounted(() => {
  const savedData = localStorage.getItem('cardData');
  if (savedData) {
    robotConfigs.value = JSON.parse(savedData);
  } else {
    // Estado inicial padrão se não houver nada salvo
    robotConfigs.value = Array.from({ length: 3 }, (_, i) => ({ id: i, name: `Robô ${i + 1}`}));
  }
});
</script>

<template>
  <div class="app-container">
    <main class="dashboard-grid">
      <aside class="sidebar sidebar-left">
        <Name title="ARARABOTS" />
        <Card :robots="robotConfigs" />
        <PlayButton />
      </aside>

      <section class="main-content">
        <Field class="field-area" />
        <Terminal class="terminal-area" />
      </section>

      <aside class="sidebar sidebar-right">
        <div class="sidebar-nav">
          <button 
            :class="{ active: activeSidebarComponent === 'robots' }" 
            @click="activeSidebarComponent = 'robots'"
          >
            Robots
          </button>
          <button 
            :class="{ active: activeSidebarComponent === 'config' }" 
            @click="activeSidebarComponent = 'config'"
          >
            Terminal Config
          </button>
          <button 
            :class="{ active: activeSidebarComponent === 'pid' }" 
            @click="activeSidebarComponent = 'pid'"
          >
            Ajuste PID
          </button>
          <button 
            :class="{ active: activeSidebarComponent === 'commands' }" 
            @click="activeSidebarComponent = 'commands'"
          >
            Comandos
          </button>
        </div>
        
        <RobotCard v-if="activeSidebarComponent === 'robots'" @configs-updated="handleConfigsUpdate" />
        <ConfigTerminal v-if="activeSidebarComponent === 'config'" />
        <PidTuner v-if="activeSidebarComponent === 'pid'" />
        <StrategyControl v-if="activeSidebarComponent === 'commands'" />
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  background-color: var(--fundo-principal);
  color: var(--texto-principal);
  overflow: hidden;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.7fr) 1.5fr minmax(420px, 0.9fr);
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  height: 100%;
  width: 100%;
}

.sidebar,
.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  background-color: var(--fundo-secundario);
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
  background-color: #4a507a;
}

.sidebar-nav button.active {
  color: #ffffff;
  background-color: var(--cor-destaque);
}
</style>