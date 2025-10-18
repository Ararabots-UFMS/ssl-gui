<template>
  <div class="system-status-container">
    <div class="status-item">
      <span class="label">Vision:</span>
      <span class="indicator" :class="statusClass(statuses.vision)"></span>
      <span class="status-text">{{ statuses.vision }}</span>
    </div>
    <div class="status-item">
      <span class="label">Referee:</span>
      <span class="indicator" :class="statusClass(statuses.referee)"></span>
      <span class="status-text">{{ statuses.referee }}</span>
    </div>
    <div class="status-item">
      <span class="label">Radio:</span>
      <span class="indicator" :class="statusClass(statuses.radio)"></span>
      <span class="status-text">{{ statuses.radio }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
export type ConnectionStatus = 'Connected' | 'Disconnected';

export interface SystemStatus {
  vision: ConnectionStatus;
  referee: ConnectionStatus;
  radio: ConnectionStatus;
}

defineProps<{
  statuses: SystemStatus
}>();

const statusClass = (status: ConnectionStatus) => {
  return status === 'Connected' ? 'connected' : 'disconnected';
};
</script>

<style scoped>
.system-status-container { display: flex; gap: var(--spacing-4); align-items: center; }
.status-item { display: flex; align-items: center; gap: var(--spacing-2); }
.label { font-weight: var(--font-weight-bold); color: var(--texto-secundario); }
.indicator { width: 12px; height: 12px; border-radius: 50%; transition: background-color 0.3s ease; }
.indicator.connected { background-color: var(--cor-sucesso); box-shadow: 0 0 8px var(--cor-sucesso); }
.indicator.disconnected { background-color: var(--cor-erro); }
.status-text { font-size: 0.9em; color: var(--texto-principal); }
</style>