<script setup lang="ts">
import { defineProps } from 'vue';
import ararabotsLogo from '@/assets/logo-arara-vermelha-borda-branca.png'; 

defineProps({
  title: {
    type: String,
    required: true
  }
});
</script>

<template>
  <div class="header-container">
    <img :src="ararabotsLogo" alt="Ararabots Logo" class="logo" />
    <h1 class="title">{{ title }}</h1>
  </div>
</template>

<style scoped>
.header-container {
  display: flex;
  flex-direction: row; 
  align-items: center;    
  gap: var(--spacing-3);  
  padding: 0 var(--spacing-2) var(--spacing-3) var(--spacing-2); 
  border-bottom: 1px solid var(--cor-borda);
  flex-shrink: 0; 
}

.logo {
  max-width: 150px; 
  height: auto;
  transition: transform 0.3s ease; 
}

.logo:hover {
  transform: scale(1.1); 
}

.title {
  font-size: var(--font-size-lg); 
  color: var(--texto-principal);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin: 0;
  white-space: nowrap; 
}
</style>  