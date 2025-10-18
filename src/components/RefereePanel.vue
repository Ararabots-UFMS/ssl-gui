<template>
  <div class="referee-panel-container">
    <div class="button-group">
      <h4>Game Control</h4>
      <button @click="emitCommand('HALT')">HALT</button>
      <button @click="emitCommand('STOP')">STOP</button>
      <button @click="emitCommand('NORMAL_START')">Normal Start</button>
      <button @click="emitCommand('FORCE_START')">Force Start</button>
    </div>

    <div class="button-group">
      <h4>Preparation</h4>
      <button class="blue" @click="emitCommand('PREPARE_KICKOFF_BLUE')">Kickoff Blue</button>
      <button class="yellow" @click="emitCommand('PREPARE_KICKOFF_YELLOW')">Kickoff Yellow</button>
      <button class="blue" @click="emitCommand('PREPARE_PENALTY_BLUE')">Penalty Blue</button>
      <button class="yellow" @click="emitCommand('PREPARE_PENALTY_YELLOW')">Penalty Yellow</button>
    </div>

    <div class="button-group">
      <h4>Free Kicks</h4>
      <button class="blue" @click="emitCommand('DIRECT_FREE_BLUE')">Direct Free Blue</button>
      <button class="yellow" @click="emitCommand('DIRECT_FREE_YELLOW')">Direct Free Yellow</button>
      <button class="blue" @click="emitCommand('INDIRECT_FREE_BLUE')">Indirect Free Blue</button>
      <button class="yellow" @click="emitCommand('INDIRECT_FREE_YELLOW')">Indirect Free Yellow</button>
    </div>
    
    <div class="button-group">
      <h4>Events</h4>
      <button class="blue" @click="emitCommand('TIMEOUT_BLUE')">Timeout Blue</button>
      <button class="yellow" @click="emitCommand('TIMEOUT_YELLOW')">Timeout Yellow</button>
      <button class="blue" @click="emitCommand('GOAL_BLUE')">Goal Blue</button>
      <button class="yellow" @click="emitCommand('GOAL_YELLOW')">Goal Yellow</button>
    </div>

  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['sendCommand']);

// Tipagem expandida com todos os novos comandos
type RefereeCommand = 
  'HALT' | 'STOP' | 'NORMAL_START' | 'FORCE_START' | 
  'PREPARE_KICKOFF_BLUE' | 'PREPARE_KICKOFF_YELLOW' |
  'PREPARE_PENALTY_BLUE' | 'PREPARE_PENALTY_YELLOW' |
  'DIRECT_FREE_BLUE' | 'DIRECT_FREE_YELLOW' |
  'INDIRECT_FREE_BLUE' | 'INDIRECT_FREE_YELLOW' |
  'TIMEOUT_BLUE' | 'TIMEOUT_YELLOW' |
  'GOAL_BLUE' | 'GOAL_YELLOW';

function emitCommand(command: RefereeCommand) {
  emit('sendCommand', command);
}
</script>

<style scoped>
.referee-panel-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.button-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background-color: var(--fundo-terciario);
  border-radius: var(--border-radius-sm);
}

.button-group h4 {
  grid-column: 1 / -1;
  margin: 0 0 var(--spacing-2) 0;
  padding-bottom: var(--spacing-2);
  border-bottom: var(--border-width) solid var(--cor-borda);
  font-weight: var(--font-weight-bold);
  text-align: center;
}

button {
  padding: var(--spacing-2) var(--spacing-1);
  border: var(--border-width) solid var(--cor-borda);
  background-color: var(--fundo-secundario);
  color: var(--texto-principal);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
  font-size: 0.85em; /* Reduz a fonte para caber mais texto */
  white-space: nowrap; /* Impede a quebra de linha */
}

button:hover {
  background-color: var(--cor-destaque);
  border-color: var(--cor-destaque);
}

/* Estilos específicos para botões de time */
button.blue { border-left: 4px solid var(--time-azul); }
button.blue:hover { background-color: var(--time-azul); color: white; }

button.yellow { border-left: 4px solid var(--time-amarelo); }
button.yellow:hover { background-color: var(--time-amarelo); color: #333; }
</style>