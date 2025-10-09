<script setup lang="ts">
import { ref, watch } from 'vue';
import { socket } from '@/socket';

// --- INTERFACE E PROPRIEDADES ---
interface RobotInfo {
  id: number;
  name: string;
}
const props = defineProps({
  robots: {
    type: Array as () => RobotInfo[],
    required: true,
    default: () => []
  },
  roles: {
    type: Object as () => { [key: number]: string },
    required: true,
    default: () => ({})
  }
});

const emit = defineEmits(['roles-updated']);

const localRoles = ref<{ [key: number]: string }>({});

watch(() => props.roles, (newRoles) => {
  localRoles.value = { ...newRoles };
}, { immediate: true, deep: true });

function updateRobotRole(robotId: number) {
  const newRole = localRoles.value[robotId];
  socket.emit('updateRobotRole', { id: robotId, role: newRole });
  
  localStorage.setItem('selectedRobotRoles', JSON.stringify(localRoles.value));
  
  emit('roles-updated', localRoles.value);
}
</script>

<template>
  <div class="card-list">
    <div class="card" v-for="robot in robots" :key="robot.id">
      <div class="status-dot"></div>
      <div class="card-icon">
        <h2>{{ robot.id }}</h2>
      </div>
      <div class="card-name">
        <h2>{{ robot.name || `Robô ${robot.id}` }}</h2>
      </div>
      <div class="card-role-selector">
        <select 
          class="dropdown-role" 
          v-model="localRoles[robot.id]" 
          @change="updateRobotRole(robot.id)"
        >
          <option value="0">Função...</option>
          <option value="1">Atacante</option>
          <option value="2">Goleiro</option>
          <option value="3">Zagueiro</option>
        </select>
      </div>      
    </div>
    <p v-if="!robots || robots.length === 0" class="no-robots-message">Nenhum robô configurado.</p>
  </div>
</template>

<style scoped>
.card-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  width: 100%;
}

.card {
  background-color: var(--fundo-secundario);
  border-radius: var(--border-radius-md);
  color: var(--texto-principal);
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--spacing-2);
  border: var(--border-width) solid var(--cor-borda);
  box-shadow: var(--box-shadow-sm);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-md);
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: var(--cor-sucesso);
  border-radius: 50%;
  margin-right: var(--spacing-2);
  flex-shrink: 0;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: var(--spacing-2);
  border-right: var(--border-width) solid var(--cor-borda);
}

.card-icon h2, .card-name h2 {
  font-size: var(--font-size-md);
  margin: 0;
  color: var(--texto-secundario);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.card-name {
  flex-grow: 1;
  margin-left: var(--spacing-2);
  min-width: 0; 
}

.card-role-selector {
  margin-left: auto;
  position: relative; 
}

/* --- AQUI ESTÁ A ESTILIZAÇÃO DO DROPDOWN --- */
.dropdown-role {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  border: var(--border-width) solid var(--cor-borda);
  border-radius: var(--border-radius-sm);
  background-color: var(--fundo-terciario);
  color: var(--texto-principal);
  padding: var(--spacing-1) var(--spacing-3) var(--spacing-1) var(--spacing-2);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

/* 3. Adiciona a seta customizada como uma imagem de fundo */
.dropdown-role {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0a0c0'%3E%3Cpath d='M7.41,8.59L12,13.17l4.59-4.58L18,10l-6,6l-6-6L7.41,8.59z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  background-size: 1.5em;
}

.dropdown-role:hover {
  border-color: var(--cor-destaque-hover);
}

.dropdown-role:focus {
  outline: 2px solid var(--cor-destaque);
  outline-offset: 2px;
  border-color: var(--cor-destaque);
}

.no-robots-message {
  text-align: center;
  color: var(--texto-secundario);
  padding: var(--spacing-3);
}
</style>