<template>
  <div class="status-indicator" :class="statusClass" :title="status"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

// Mapeia o status (string) para uma classe CSS
const statusClass = computed(() => {
  return `status-${props.status?.toLowerCase() || 'idle'}`;
});
</script>

<style scoped>
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-running { background-color: var(--cor-aviso); } /* Amarelo */
.status-success { background-color: var(--cor-sucesso); } /* Verde */
.status-failed { background-color: var(--cor-erro); } /* Vermelho */
.status-idle { background-color: var(--texto-secundario); } /* Cinza */
</style>