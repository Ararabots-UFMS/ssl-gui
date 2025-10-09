<script setup lang="ts">
import { ref, watch, nextTick, onUpdated } from 'vue';
import { socket, systemStatus, refereeLog, visionLog, communicationLog } from '@/socket';

type TabName = 'juiz' | 'visao' | 'comunicacao';
const refereeCommands = [
  { name: 'Parar (STOP)', value: 'STOP' },
  { name: 'Iniciar (START)', value: 'START' },
  { name: 'Forçar Início (FORCE_START)', value: 'FORCE_START' },
  // ... (outros comandos)
];
const selectedTab = ref<TabName>('juiz');
const selectedCommand = ref<string>(refereeCommands[0].value);
const messagesContainer = ref<HTMLElement | null>(null);

function sendRefereeCommand() {
  if (!selectedCommand.value) return;
  socket.emit('refereeCommand', selectedCommand.value);
  refereeLog.value.unshift(`[COMANDO ENVIADO]: ${selectedCommand.value}`);
}

// Garante que o scroll fique sempre no topo ao receber novas mensagens
onUpdated(() => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = 0;
  }
});
</script>

<template>
  <div class="terminal">
    <div class="terminal-header">
      <div class="tabs-container">
        <div class="tab" :class="{ 'is-active': selectedTab === 'juiz' }" @click="selectedTab = 'juiz'">
          <span class="status-dot" :class="{ active: systemStatus.strategyService }"></span>
          Juiz
        </div>
        <div class="tab" :class="{ 'is-active': selectedTab === 'visao' }" @click="selectedTab = 'visao'">
          <span class="status-dot" :class="{ active: systemStatus.visionNode }"></span>
          Visão
        </div>
        <div class="tab" :class="{ 'is-active': selectedTab === 'comunicacao' }" @click="selectedTab = 'comunicacao'">
          <span class="status-dot" :class="{ active: systemStatus.guiConnected }"></span>
          Comunicação
        </div>
      </div>

      <div v-if="selectedTab === 'juiz'" class="actions-container">
        <select class="command-select" v-model="selectedCommand" :disabled="!systemStatus.strategyService">
          <option v-for="cmd in refereeCommands" :key="cmd.value" :value="cmd.value">
            {{ cmd.name }}
          </option>
        </select>
        <button class="send-button" @click="sendRefereeCommand" :disabled="!systemStatus.strategyService">Enviar</button>
      </div>
    </div>

    <div class="messages-container" ref="messagesContainer">
      <div class="messages" v-show="selectedTab === 'juiz'">
        <p v-for="(msg, index) in refereeLog" :key="index" class="line" :class="{ command: msg.includes('COMANDO') }">{{ msg }}</p>
      </div>
      <div class="messages" v-show="selectedTab === 'visao'">
        <p v-for="(msg, index) in visionLog" :key="index" class="line">{{ msg }}</p>
      </div>
      <div class="messages" v-show="selectedTab === 'comunicacao'">
        <p v-for="(msg, index) in communicationLog" :key="index" class="line" :class="{ success: msg.includes('✅'), fail: msg.includes('❌') }">{{ msg }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal { background-color: var(--fundo-secundario); border-radius: var(--border-radius-md); width: 100%; height: 100%; min-height: 200px; display: flex; flex-direction: column; overflow: hidden; border: var(--border-width) solid var(--cor-borda); }
.terminal-header { display: flex; justify-content: space-between; align-items: center; padding: 0 var(--spacing-3); background-color: var(--fundo-principal); border-bottom: var(--border-width) solid var(--cor-borda); flex-shrink: 0; height: 50px; }
.tabs-container { display: flex; height: 100%; }
.tab { display: flex; align-items: center; padding: 0 var(--spacing-3); cursor: pointer; color: var(--texto-secundario); border-bottom: 2px solid transparent; font-weight: var(--font-weight-bold); transition: color 0.2s ease, border-color 0.2s ease; height: 100%; }
.tab:hover { color: var(--texto-principal); }
.tab.is-active { color: var(--texto-principal); border-bottom-color: var(--cor-destaque); }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background-color: var(--cor-erro); margin-right: var(--spacing-2); transition: background-color 0.3s ease; }
.status-dot.active { background-color: var(--cor-sucesso); box-shadow: 0 0 5px var(--cor-sucesso); }
.actions-container { display: flex; align-items: center; gap: var(--spacing-2); }
.command-select { background-color: var(--fundo-terciario); color: var(--texto-principal); border: var(--border-width) solid var(--cor-borda); border-radius: var(--border-radius-sm); padding: var(--spacing-1) var(--spacing-2); font-size: var(--font-size-sm); }
.send-button { cursor: pointer; padding: var(--spacing-1) var(--spacing-3); color: #ffffff; font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); background-color: var(--cor-destaque); border-radius: var(--border-radius-sm); border: none; transition: all 0.2s ease; }
.send-button:hover:not(:disabled) { filter: brightness(1.1); }
.send-button:disabled, .command-select:disabled { background-color: var(--fundo-terciario); color: var(--texto-secundario); cursor: not-allowed; opacity: 0.5; }

.messages-container { flex-grow: 1; overflow-y: auto; padding: var(--spacing-2); background-color: var(--fundo-principal); }
.messages { display: flex; flex-direction: column; }
.line { color: var(--texto-secundario); white-space: pre-wrap; font-family: 'Courier New', Courier, monospace; font-size: var(--font-size-sm); padding: 2px 4px; border-radius: var(--border-radius-sm); }
.line:first-child { background-color: rgba(0,0,0,0.2); }
/* Estilos semânticos para as linhas de log */
.line.command { color: var(--cor-destaque); font-weight: var(--font-weight-bold); }
.line.success { color: var(--cor-sucesso); }
.line.fail { color: var(--cor-erro); }
</style>