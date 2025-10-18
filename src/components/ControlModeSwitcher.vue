<template>
  <div class="control-switcher-panel card">
    <div class="panel-header">
      <span>Control Mode</span>
    </div>
    <div class="panel-content">
      <div v-for="robot in controlModes" :key="robot.id" class="robot-control-row">
        <span class="robot-name">Robô {{ robot.id }}</span>
        <div class="switcher">
          <button 
            :class="{ active: robot.mode === 'ai' }" 
            @click="changeMode(robot.id, 'ai')"
          >
            AI
          </button>
          <button 
            :class="{ active: robot.mode === 'manual' }"
            @click="changeMode(robot.id, 'manual')"
          >
            Manual
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export type ControlMode = 'ai' | 'manual';
export interface RobotControlState {
  id: number;
  mode: ControlMode;
}

// Propriedade vinda do App.vue com o estado atual de todos os robôs
defineProps<{
  controlModes: RobotControlState[]
}>();

const emit = defineEmits(['mode-changed']);

function changeMode(robotId: number, mode: ControlMode) {
  emit('mode-changed', { robotId, mode });
}
</script>

<style scoped>
.control-switcher-panel { padding: 0; }
.panel-header { padding: var(--spacing-2) var(--spacing-3); background-color: var(--fundo-terciario); font-weight: var(--font-weight-bold); border-bottom: var(--border-width) solid var(--cor-borda); }
.panel-content { padding: var(--spacing-3); display: flex; flex-direction: column; gap: var(--spacing-2); }
.robot-control-row { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-2); background-color: var(--fundo-terciario); border-radius: var(--border-radius-sm); }
.robot-name { font-weight: var(--font-weight-bold); }
.switcher { display: flex; background-color: var(--fundo-secundario); border-radius: var(--border-radius-sm); border: var(--border-width) solid var(--cor-borda); }
.switcher button { background: transparent; border: none; padding: var(--spacing-1) var(--spacing-3); cursor: pointer; color: var(--texto-secundario); font-weight: var(--font-weight-bold); }
.switcher button.active { background-color: var(--cor-destaque); color: white; border-radius: var(--border-radius-sm); }
</style>