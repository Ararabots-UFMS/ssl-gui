<script setup lang="ts">
import { ref } from 'vue';
// 1. IMPORTAÇÃO ATUALIZADA:
// Importamos o objeto de status unificado e os logs centralizados
import {
  socket,
  systemStatus,
  refereeLog,
  visionLog,
  communicationLog
} from '@/socket';

// --- (A lógica de comandos do juiz permanece a mesma) ---
type TabName = 'juiz' | 'visao' | 'comunicacao';
const refereeCommands = [
  { name: 'Parar (STOP)', value: 'STOP' },
  { name: 'Iniciar (START)', value: 'START' },
  { name: 'Forçar Início (FORCE_START)', value: 'FORCE_START' },
  { name: 'Parada Total (HALT)', value: 'HALT' },
  // ... (outros comandos)
];
const selectedTab = ref<TabName>('juiz');
const selectedCommand = ref<string>(refereeCommands[0].value);

function sendRefereeCommand() {
  if (!selectedCommand.value) return;
  socket.emit('refereeCommand', selectedCommand.value);
  // Adiciona a mensagem ao log centralizado do juiz
  refereeLog.value.unshift(`[COMANDO ENVIADO]: ${selectedCommand.value}`);
}
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

      <div class="actions-container">
        <select class="command-select" v-model="selectedCommand">
          <option v-for="cmd in refereeCommands" :key="cmd.value" :value="cmd.value">
            {{ cmd.name }}
          </option>
        </select>
        <button class="send-button" @click="sendRefereeCommand">Enviar</button>
      </div>
    </div>

    <div class="messages-container">
       <div class="messages" v-show="selectedTab === 'juiz'">
        <div v-for="(msg, index) in refereeLog" :key="index" class="line">{{ msg }}</div>
      </div>
      <div class="messages" v-show="selectedTab === 'visao'">
        <div v-for="(msg, index) in visionLog" :key="index" class="line">{{ msg }}</div>
      </div>
      <div class="messages" v-show="selectedTab === 'comunicacao'">
        <div v-for="(msg, index) in communicationLog" :key="index" class="line">{{ msg }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* O CSS pode permanecer o mesmo da última versão refinada, pois ele já é genérico */
.terminal { background-color: var(--fundo-secundario); border-radius: var(--border-radius-md); width: 100%; height: 100%; min-height: 300px; display: flex; flex-direction: column; overflow: hidden; border: var(--border-width) solid var(--cor-borda); }
.terminal-header { display: flex; justify-content: space-between; align-items: center; padding: 0 var(--spacing-3); background-color: var(--fundo-principal); border-bottom: var(--border-width) solid var(--cor-borda); flex-shrink: 0; height: 50px; }
.tabs-container { display: flex; height: 100%; }
.tab { display: flex; align-items: center; padding: 0 var(--spacing-3); cursor: pointer; color: var(--texto-secundario); border-bottom: 2px solid transparent; font-weight: var(--font-weight-bold); transition: color 0.2s ease, border-color 0.2s ease; height: 100%; }
.tab:hover { color: var(--texto-principal); }
.tab.is-active { color: var(--texto-principal); border-bottom-color: var(--cor-destaque); }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background-color: var(--cor-erro); margin-right: var(--spacing-2); transition: background-color 0.3s ease; }
.status-dot.active { background-color: var(--cor-sucesso); }
.actions-container { display: flex; align-items: center; gap: var(--spacing-2); }
.command-select { background-color: var(--fundo-terciario); color: var(--texto-principal); border: var(--border-width) solid var(--cor-borda); border-radius: var(--border-radius-sm); padding: var(--spacing-1) var(--spacing-2); font-size: var(--font-size-sm); }
.send-button { cursor: pointer; padding: var(--spacing-1) var(--spacing-3); color: #ffffff; font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); background-color: var(--cor-destaque); border-radius: var(--border-radius-sm); border: none; transition: all 0.2s ease; }
.send-button:hover { filter: brightness(1.1); }
.messages-container { flex-grow: 1; overflow-y: auto; padding: var(--spacing-2); background-color: var(--fundo-principal); }
.messages { display: flex; flex-direction: column; }
.line { color: var(--texto-principal); white-space: pre-wrap; font-family: 'Courier New', Courier, monospace; font-size: var(--font-size-sm); padding: 2px 4px; }
.line:first-child { background-color: var(--cor-destaque-hover); border-radius: var(--border-radius-sm); }
</style>