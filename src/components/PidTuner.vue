<script setup lang="ts">
import { ref } from 'vue';
import { socket } from '@/socket';

// --- (Estado do formulário Kp, Ki, Kd, etc. - sem mudanças) ---
const robotId = ref(0);
// ...

// --- NOVO: Estado do Log de Respostas ---
const responses = ref<string[]>([]);

// --- NOVO: Listeners de Resposta do Backend ---
socket.on('pid_update_response', (data) => {
  const time = new Date().toLocaleTimeString();
  const message = data.success 
    ? `[${time}] SUCESSO: PID atualizado.`
    : `[${time}] FALHA: PID não atualizado.`;
  responses.value.unshift(message);
  if (responses.value.length > 20) responses.value.pop();
});

// --- Funções de Ação ---
function updatePid() {
  const payload = { /* ... */ };
  socket.emit('update_pid', payload);
  responses.value.unshift(`[${new Date().toLocaleTimeString()}] Enviando PID para robô ${robotId.value}...`);
}

// ... (outras funções: updateKpAngular, etc. Adicione o unshift() nelas também)
</script>

<template>
  <div class="pid-tuner-container">
    <div class="form-section response-log-section">
      <span class="input-label">Últimas Respostas de PID</span>
      <div class="response-log">
        <p v-for="(msg, index) in responses" :key="index">{{ msg }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... (Seus estilos anteriores) ... */
/* O estilo do log de respostas do StrategyControl.vue pode ser reutilizado aqui */
.response-log-section { margin-top: var(--spacing-3); }
.response-log {
  background-color: var(--fundo-principal);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-2);
  height: 150px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: var(--font-size-sm);
}
</style>