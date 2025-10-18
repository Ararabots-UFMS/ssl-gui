<template>
  <div class="ai-status-panel card">
    <div class="panel-header">
      <span>AI Status</span>
    </div>
    <div class="panel-content">
      <div class="play-section">
        <span class="label">Active Play:</span>
        <div class="status-item">
          <span class="name">{{ aiState?.activePlay?.name || 'None' }}</span>
          <StatusIndicator :status="aiState?.activePlay?.status || 'Idle'" />
        </div>
      </div>

      <div class="robots-section">
        <div v-for="robot in aiState?.robotStates" :key="robot.id" class="robot-state-row">
          <span class="robot-id">Robot {{ robot.id }}</span>
          <div class="details">
            <div class="status-item">
              <span class="label">Role:</span>
              <span class="name">{{ robot.role.name }}</span>
              <StatusIndicator :status="robot.role.status" />
            </div>
            <div class="status-item">
              <span class="label">Skill:</span>
              <span class="name">{{ robot.skill.name }}</span>
              <StatusIndicator :status="robot.skill.status" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusIndicator from './StatusIndicator.vue'; // Um componente auxiliar que criaremos a seguir

// Define a estrutura de dados que este componente espera receber
interface AIState {
  activePlay: { name: string; status: string; };
  robotStates: {
    id: number;
    role: { name: string; status: string; };
    skill: { name: string; status: string; };
  }[];
}

// A prop 'aiState' virá do App.vue
defineProps<{
  aiState: AIState | null
}>();
</script>

<style scoped>
.ai-status-panel { padding: 0; }
.panel-header { padding: var(--spacing-2) var(--spacing-3); background-color: var(--fundo-terciario); font-weight: var(--font-weight-bold); border-bottom: var(--border-width) solid var(--cor-borda); }
.panel-content { padding: var(--spacing-3); display: flex; flex-direction: column; gap: var(--spacing-3); }
.play-section { border-bottom: var(--border-width) solid var(--cor-borda); padding-bottom: var(--spacing-3); }
.label { font-size: 0.8em; color: var(--texto-secundario); margin-right: var(--spacing-2); }
.status-item { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-2); }
.name { font-weight: var(--font-weight-bold); color: var(--texto-principal); }
.robots-section { display: flex; flex-direction: column; gap: var(--spacing-2); }
.robot-state-row { display: flex; flex-direction: column; gap: var(--spacing-1); padding: var(--spacing-2); background-color: var(--fundo-terciario); border-radius: var(--border-radius-sm); }
.robot-id { font-weight: var(--font-weight-bold); border-bottom: 1px solid var(--cor-borda); padding-bottom: var(--spacing-1); margin-bottom: var(--spacing-1); }
.details { display: flex; flex-direction: column; gap: var(--spacing-1); }
</style>