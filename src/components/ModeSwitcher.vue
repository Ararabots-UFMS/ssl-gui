<template>
  <div class="mode-switcher" @click="toggleMode" :title="`Mudar para ${isReal ? 'Simulação' : 'Real'}`">
    <span class="label" :class="{ active: !isReal }">Sim</span>
    <div class="switch" :class="{ real: isReal }">
      <div class="knob"></div>
    </div>
    <span class="label" :class="{ active: isReal }">Real</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type RunMode = 'simulation' | 'real';

// Recebe o modo atual do App.vue (que é a fonte da verdade)
const props = defineProps<{
  currentMode: RunMode
}>();

const emit = defineEmits(['mode-changed']);

const isReal = computed(() => props.currentMode === 'real');

function toggleMode() {
  const newMode: RunMode = isReal.value ? 'simulation' : 'real';
  emit('mode-changed', newMode);
}
</script>

<style scoped>
.mode-switcher {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  background-color: var(--fundo-terciario);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  user-select: none;
}

.label {
  font-weight: var(--font-weight-bold);
  color: var(--texto-secundario);
  transition: color 0.2s ease;
}

.label.active {
  color: var(--texto-principal);
}

.switch {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: var(--fundo-principal);
  border-radius: 12px;
  transition: background-color 0.2s ease;
}

.knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.switch.real {
  background-color: var(--cor-sucesso);
}

.switch.real .knob {
  transform: translateX(20px);
}
</style>