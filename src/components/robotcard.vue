<script setup lang="ts">
import { ref, computed } from 'vue';
import { socket } from '@/socket';

// --- INTERFACES E TIPOS ---
interface RobotConfig {
  number: number | null; 
  name: string;
  address: string;
  kp: string;
  ki: string;
  kd: string;
}

// --- CONSTANTES ---
const MAX_ROBOTS = 6;
const MAX_ROBOT_NUMBER = 15;

const emit = defineEmits(['configs-updated']);

// --- ESTADO REATIVO ---
const selectedOption = ref<string>(localStorage.getItem('selectedOption') || '3');
const cards = ref<RobotConfig[]>([]);

// --- PROPRIEDADES COMPUTADAS ---
const filteredCards = computed(() => {
  const count = parseInt(selectedOption.value, 10);
  return cards.value.slice(0, count);
});

// --- FUNÇÕES ---
function onCardChange() {
  localStorage.setItem('cards', JSON.stringify(cards.value));
}

function updateCardList() {
  localStorage.setItem('selectedOption', selectedOption.value);
  const count = parseInt(selectedOption.value, 10);
  
  while (cards.value.length < count) {
    cards.value.push(createEmptyCard());
  }
  cards.value.length = count;

  autoAssignNumbers();
  onCardChange();
}

function saveButton() {
  const dataToSave = filteredCards.value.map(card => ({
    id: card.number, 
    name: card.name,
    address: card.address,
    kp: card.kp,
    ki: card.ki,
    kd: card.kd,
  }));

  socket.emit('configSaveButton', dataToSave);
  localStorage.setItem('cardData', JSON.stringify(dataToSave));
  localStorage.setItem('selectedOption', selectedOption.value);
  emit('configs-updated', dataToSave);
}

const createEmptyCard = (): RobotConfig => ({
  number: null,
  name: '',
  address: '0,0,0,0,0',
  kp: '0.0',
  ki: '0.0',
  kd: '0.0',
});

const autoAssignNumbers = () => {
  const usedNumbers = new Set<number>();
  cards.value.forEach(card => card.number = null); 

  cards.value.forEach(card => {
    for (let i = 0; i <= MAX_ROBOT_NUMBER; i++) {
      if (!usedNumbers.has(i)) {
        card.number = i;
        usedNumbers.add(i);
        break;
      }
    }
  });
};

// --- LÓGICA DE INICIALIZAÇÃO ---
const initializeCards = () => {
  const savedCards = localStorage.getItem('cards');
  const initialCount = parseInt(selectedOption.value, 10);
  
  if (savedCards) {
    cards.value = JSON.parse(savedCards);
  } else {
    cards.value = Array(initialCount).fill(null).map(() => createEmptyCard());
  }
  
  cards.value.length = initialCount;
  for (let i = 0; i < initialCount; i++) {
    if (!cards.value[i]) {
      cards.value[i] = createEmptyCard();
    }
  }

  autoAssignNumbers();
  onCardChange();
};

initializeCards();
</script>

<template>
  <div class="config-container">
    <div class="config-header">
      <label for="options">Quantidade de Robôs</label>
      <select id="options" class="dropdown" v-model="selectedOption" @change="updateCardList">
        <option v-for="n in MAX_ROBOTS" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>

    <div class="card-list">
      <div class="card-config" v-for="(card, index) in filteredCards" :key="index">
        <div class="card-sequential-number">
          {{ index }} 
        </div>

        <div class="card-info">
          <div class="row">
            <label class="input-wrapper">
              <span class="input-label">Nome</span>
              <input type="text" v-model="card.name" placeholder="Ex: Robô Atacante" @input="onCardChange" />
            </label>
            <label class="input-wrapper">
              <span class="input-label">Endereço</span>
              <input type="text" v-model="card.address" placeholder="0,0,0,0,0" @input="onCardChange" />
            </label>
          </div>
          <div class="row">
            <label class="input-wrapper">
              <span class="input-label">KP</span>
              <input type="text" v-model="card.kp" placeholder="0.0" @input="onCardChange" />
            </label>
            <label class="input-wrapper">
              <span class="input-label">KI</span>
              <input type="text" v-model="card.ki" placeholder="0.0" @input="onCardChange" />
            </label>
            <label class="input-wrapper">
              <span class="input-label">KD</span>
              <input type="text" v-model="card.kd" placeholder="0.0" @input="onCardChange" />
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="save-action">
      <button @click="saveButton">Salvar Configurações</button>
    </div>
  </div>
</template>

<style scoped>
.config-container {
  width: 100%;
  max-width: 800px;
  margin: var(--spacing-5) auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.config-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--texto-secundario);
  font-weight: var(--font-weight-bold);
}

.dropdown {
  font-size: var(--font-size-base);
  border: var(--border-width) solid var(--cor-borda);
  border-radius: var(--border-radius-sm);
  background-color: var(--fundo-terciario);
  color: var(--texto-principal);
  padding: var(--spacing-1) var(--spacing-2);
  cursor: pointer;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.card-config {
  background-color: var(--fundo-secundario);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-3);
  display: flex;
  gap: var(--spacing-3);
  border: var(--border-width) solid var(--cor-borda);
}

.card-sequential-number {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--texto-principal);
  padding-right: var(--spacing-3);
  border-right: var(--border-width) solid var(--cor-borda);
  min-width: 40px;
  flex-shrink: 0;
}

.card-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: var(--spacing-2);
}

.row {
  display: flex;
  gap: var(--spacing-3);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  flex: 1;
}

.input-label {
  font-size: var(--font-size-sm);
  color: var(--texto-secundario);
  font-weight: var(--font-weight-bold);
}

input[type="text"] {
  width: 100%;
  padding: var(--spacing-2);
  border: var(--border-width) solid var(--cor-borda);
  border-radius: var(--border-radius-sm);
  background-color: var(--fundo-principal);
  color: var(--texto-principal);
  font-size: var(--font-size-base);
}

input[type="text"]:focus {
  outline: 2px solid var(--cor-destaque);
  outline-offset: 2px;
  border-color: var(--cor-destaque);
}

.save-action {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-2);
}

button {
  cursor: pointer;
  padding: var(--spacing-2) var(--spacing-4);
  color: var(--texto-principal);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  background-color: var(--cor-sucesso);
  border-radius: var(--border-radius-md);
  border: none;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

button:hover {
  filter: brightness(1.1);
}

button:active {
  transform: scale(0.98);
  filter: brightness(0.9);
}
</style>