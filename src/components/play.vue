<script setup lang="ts">
import { ref, computed } from 'vue';

const isActive = ref(false);

const buttonText = computed(() => (isActive.value ? 'PARAR' : 'JOGAR'));
const buttonClass = computed(() => (isActive.value ? 'is-active' : ''));

function playButton() {
  isActive.value = !isActive.value;

  console.log('Play button state:', isActive.value);
}
</script>

<template>
  <div class="play-button-container">
    <button :class="['play-button', buttonClass]" @click="playButton">
      {{ buttonText }}
    </button>
  </div>
</template>

<style scoped>
.play-button-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.play-button {
  cursor: pointer;
  padding: 4px 14px;
  color: var(--texto-principal);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.05em;
  border-radius: var(--border-radius-sm);
  border: none;
  height: 28px;
  line-height: 1;
  background-color: var(--cor-sucesso);
  transition: background-color 0.2s ease, transform 0.1s ease, filter 0.2s ease;
}

.play-button.is-active {
  background-color: var(--cor-erro);
}

.play-button:hover {
  filter: brightness(1.1);
}

.play-button:active {
  transform: scale(0.98);
  filter: brightness(0.95);
}
</style>
