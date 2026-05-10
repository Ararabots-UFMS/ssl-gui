<script setup lang="ts">
import ThemeSwitcher from './ThemeSwitcher.vue'
import ModeSwitcher, { type RunMode } from './ModeSwitcher.vue'
import PlayButton from './play.vue'
import ararabotsLogo from '@/assets/logo-arara-vermelha-borda-branca.png'

defineProps<{
  showTrajectories: boolean
  mode: RunMode
}>()

const emit = defineEmits<{
  (e: 'update:showTrajectories', v: boolean): void
  (e: 'mode-changed', v: RunMode): void
}>()

const onTrajToggle = (e: Event) => {
  emit('update:showTrajectories', (e.target as HTMLInputElement).checked)
}
</script>

<template>
  <header class="top-bar">
    <div class="top-bar-section brand">
      <img :src="ararabotsLogo" alt="Ararabots" class="brand-logo" />
      <span class="brand-mark">ARARABOTS</span>
    </div>

    <div class="top-bar-section controls">
      <div class="control-group">
        <span class="control-label">Trajetórias</span>
        <label class="switch">
          <input type="checkbox" :checked="showTrajectories" @change="onTrajToggle" />
          <span class="slider trajectories round"></span>
        </label>
      </div>

      <div class="control-group">
        <span class="control-label">Tema</span>
        <ThemeSwitcher />
      </div>

      <div class="control-group">
        <ModeSwitcher :currentMode="mode" @mode-changed="(v) => emit('mode-changed', v)" />
      </div>
    </div>

    <div class="top-bar-section play">
      <PlayButton />
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: 4px var(--spacing-3);
  background: var(--fundo-gradiente-painel, var(--fundo-secundario));
  border-radius: var(--border-radius-md);
  flex-shrink: 0;
  height: 44px;
}

.top-bar-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.brand-logo {
  height: 32px;
  width: auto;
  display: block;
}

.brand-mark {
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.06em;
  font-size: var(--font-size-sm);
  color: var(--cor-destaque);
}

.controls {
  flex-grow: 1;
  justify-content: center;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.control-label {
  font-size: var(--font-size-sm);
  color: var(--texto-secundario);
  font-weight: var(--font-weight-bold);
}

.switch { position: relative; display: inline-block; width: 42px; height: 22px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; inset: 0; transition: .3s;
  border-radius: 22px; border: var(--border-width) solid var(--cor-borda);
}
.slider:before {
  position: absolute; content: ""; height: 16px; width: 16px; left: 2px;
  bottom: 2px; background-color: white; transition: .3s; border-radius: 50%;
}
input:checked + .slider:before { transform: translateX(20px); }
.slider.trajectories { background-color: #ce3131ff; }
input:checked + .slider.trajectories { background-color: var(--cor-destaque); }
</style>
