<script setup lang="ts">
import ThemeSwitcher from '../ThemeSwitcher.vue'
import { FIELD_GEOMETRIES, type FieldType } from './fieldConfig'

defineProps<{
  fieldType: FieldType
  showTrajectories: boolean
}>()

const emit = defineEmits<{
  (e: 'update:fieldType', v: FieldType): void
  (e: 'update:showTrajectories', v: boolean): void
}>()

const onFieldChange = (e: Event) => {
  emit('update:fieldType', (e.target as HTMLSelectElement).value as FieldType)
}
const onTrajToggle = (e: Event) => {
  emit('update:showTrajectories', (e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="control-bar">
    <div class="control-group">
      <label for="field-select" class="control-label">Campo</label>
      <select id="field-select" :value="fieldType" @change="onFieldChange" class="select-field">
        <option v-for="key in Object.keys(FIELD_GEOMETRIES)" :key="key" :value="key">{{ key }}</option>
      </select>
    </div>
    <div class="control-group theme-group">
      <span class="control-label">Tema</span>
      <ThemeSwitcher />
    </div>
    <div class="control-group">
      <span class="control-label">Trajetórias</span>
      <p class="toggle-label" :class="{ inactive: !showTrajectories }">{{ showTrajectories ? 'ON' : 'OFF' }}</p>
      <label class="switch">
        <input type="checkbox" :checked="showTrajectories" @change="onTrajToggle" />
        <span class="slider trajectories round"></span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.control-bar {
  width: 100%;
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-2);
  gap: var(--spacing-4);
  background-color: var(--fundo-secundario);
  border-radius: var(--border-radius-md);
}
.control-group { display: flex; align-items: center; gap: var(--spacing-2); }
.control-label {
  font-size: var(--font-size-sm); color: var(--texto-secundario);
  font-weight: var(--font-weight-bold); margin-right: var(--spacing-1);
}
.toggle-label {
  color: var(--texto-principal); font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm); margin: 0; transition: color 0.3s ease;
}
.toggle-label.inactive { color: var(--texto-secundario); font-weight: var(--font-weight-regular); }
.switch { position: relative; display: inline-block; width: 50px; height: 28px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; inset: 0; transition: .4s;
  border-radius: 28px; border: var(--border-width) solid var(--cor-borda);
}
.slider:before {
  position: absolute; content: ""; height: 20px; width: 20px; left: 3px;
  bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;
}
input:checked + .slider:before { transform: translateX(22px); }
.slider.trajectories { background-color: #ce3131ff; }
input:checked + .slider.trajectories { background-color: var(--cor-destaque); }
.select-field {
  background-color: var(--fundo-terciario); color: var(--texto-principal);
  border: var(--border-width) solid var(--cor-borda);
  border-radius: var(--border-radius-sm); padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); cursor: pointer;
}
.select-field:focus { outline: 2px solid var(--cor-destaque); outline-offset: 2px; }
.theme-group { padding-left: var(--spacing-3); border-left: 1px solid var(--cor-borda); }
@media (max-width: 768px) {
  .control-bar { display: grid; grid-template-columns: 1fr 1fr; justify-items: start;
                 gap: var(--spacing-3) var(--spacing-2); padding: var(--spacing-3); }
  .control-group { width: 100%; justify-content: space-between; }
}
</style>
