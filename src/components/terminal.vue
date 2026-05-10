<template>
  <div class="terminal-container card">
    <div class="terminal-tabs">
      <button :class="{ active: activeTab === 'logs' }" @click="activeTab = 'logs'">Logs Gerais</button>
      <button :class="{ active: activeTab === 'referee' }" @click="activeTab = 'referee'">
        Referee
        <span v-if="refereeLogs.length > 0" class="log-count">{{ refereeLogs.length }}</span>
      </button>
    </div>

    <div v-show="activeTab === 'logs'" class="terminal-log-area" ref="generalLogAreaRef">
      <div v-for="(log, index) in generalLogs" :key="index" class="log-entry">
        <span class="timestamp">{{ formatTimestamp(log.timestamp) }}</span>
        <span :class="['log-message', log.type]">{{ log.message }}</span>
      </div>
    </div>

    <div v-show="activeTab === 'referee'" class="terminal-log-area" ref="refereeLogAreaRef">
       <div v-if="refereeLogs.length === 0" class="empty-state">Nenhum comando do juiz enviado nesta sessão.</div>
       <div v-for="(log, index) in refereeLogs" :key="index" class="log-entry">
        <span class="timestamp">{{ formatTimestamp(log.timestamp) }}</span>
        <span :class="['log-message', log.type]">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useLogs } from '@/composables/useLogs';

const { generalLogs, refereeLogs } = useLogs();

const activeTab = ref<'logs' | 'referee'>('logs');
const generalLogAreaRef = ref<HTMLElement | null>(null);
const refereeLogAreaRef = ref<HTMLElement | null>(null);

const scrollToBottom = (areaRef: typeof generalLogAreaRef) => {
  nextTick(() => {
    if (areaRef.value) areaRef.value.scrollTop = areaRef.value.scrollHeight;
  });
};

watch(generalLogs, () => scrollToBottom(generalLogAreaRef), { deep: true, flush: 'post' });
watch(refereeLogs, () => scrollToBottom(refereeLogAreaRef), { deep: true, flush: 'post' });

const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

onMounted(() => {
  if (generalLogs.value.length === 0) {
    // Seed only once across the session, not on every remount.
    useLogs().addGeneralLog('Terminal inicializado. Aguardando logs...');
  }
});
</script>

<style scoped>
.terminal-container { display: flex; flex-direction: column; height: 100%; padding: 0; overflow: hidden; }
.terminal-tabs { display: flex; gap: var(--spacing-1); padding: var(--spacing-1); border-bottom: var(--border-width) solid var(--cor-borda); flex-shrink: 0; }
.terminal-tabs button { padding: var(--spacing-2) var(--spacing-3); background-color: transparent; color: var(--texto-secundario); border: none; border-radius: var(--border-radius-sm); font-weight: var(--font-weight-bold); cursor: pointer; transition: all 0.2s ease; position: relative; }
.terminal-tabs button:hover { color: var(--texto-principal); background-color: var(--fundo-terciario); }
.terminal-tabs button.active { color: var(--texto-principal); background-color: var(--fundo-terciario); }
.log-count { background-color: var(--cor-destaque); color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.7em; position: absolute; top: 4px; right: 4px; }
.terminal-log-area { flex-grow: 1; overflow-y: auto; font-family: 'Fira Code', Courier, monospace; font-size: 0.9em; padding: var(--spacing-2); }
.log-entry { display: flex; gap: var(--spacing-2); line-height: 1.5; }
.timestamp { color: var(--texto-secundario); }
.log-message.referee { color: var(--cor-aviso); font-weight: var(--font-weight-bold); }
.log-message.error { color: var(--cor-erro); }
.empty-state { color: var(--texto-secundario); font-style: italic; text-align: center; margin-top: var(--spacing-4); }
</style>
