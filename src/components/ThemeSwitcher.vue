<script setup lang="ts">
import { activeTheme } from '@/socket';

const themes = [
  { id: 'theme-default', name: 'Púrpura', color: '#8e44ad' },    /*Tema Padrão*/    
  { id: 'theme-Purple', name: 'Deep Purple', color: '#5e35b1' },     
  { id: 'theme-sunset-glow', name: 'Sunset Glow', color: '#ff7043' },
  { id: 'theme-black-red', name: 'Black & Red', color: '#2c2c2c' }, /*Tema Escuro*/  
  { id: 'theme-light-red', name: 'White & Red', color: '#630407' },   /*Tema Claro com Vermelho*/  
  { id: 'theme-light', name: 'Branco', color: '#f5f7fa' },           /*Tema Claro*/
  { id: 'theme-volcanic', name: 'Vulcânico', color: '#b71c1c' },      
];

function changeTheme(themeId: string) {
  activeTheme.value = themeId;
  localStorage.setItem('app-theme', themeId);
}
</script>

<template>
  <div class="theme-switcher">
    <button
      v-for="theme in themes"
      :key="theme.id"
      class="theme-button"
      :style="{ backgroundColor: theme.color }"
      :title="`Ativar tema ${theme.name}`"
      @click="changeTheme(theme.id)"
    ></button>
  </div>
</template>

<style scoped>
.theme-switcher { display: flex; gap: var(--spacing-2); align-items: center; }
.theme-button { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--cor-borda); cursor: pointer; padding: 0; transition: all 0.2s ease; }
.theme-button:hover { transform: scale(1.2); border-color: var(--texto-principal); }
.theme-button {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--cor-borda);
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: var(--shadow-card);
}

.theme-button:hover {
  transform: scale(1.2);
  border-color: var(--texto-principal);
}

.theme-button.active {
  border-color: var(--cor-destaque);
  box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.25);
  transform: scale(1.15);
}

</style>