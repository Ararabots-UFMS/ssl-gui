<script setup lang="ts">
import { ref, computed } from 'vue';
import { socket } from '@/socket';

// --- INTERFACES E CONSTANTES ---
interface RobotConfig {
  number: number | null; 
  name: string;
  address: string;
  kp: string;
  ki: string;
  kd: string;
}
const MAX_ROBOTS = 6;
const MAX_ROBOT_NUMBER = 15;
const pidPresets = {
  default: { kp: '3.0', ki: '0.2', kd: '1.0' },
  aggressive: { kp: '5.0', ki: '0.5', kd: '1.5' },
  conservative: { kp: '1.5', ki: '0.1', kd: '0.5' },
};

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
  emit('configs-updated', dataToSave);
}

const createEmptyCard = (): RobotConfig => ({
  number: null,
  name: '',
  address: '0,0,0,0,0',
  kp: '3.0',
  ki: '0.2',
  kd: '1.0',
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

function applyPreset(card: RobotConfig, presetKey: string) {
  if (presetKey in pidPresets) {
    const preset = pidPresets[presetKey as keyof typeof pidPresets];
    card.kp = preset.kp;
    card.ki = preset.ki;
    card.kd = preset.kd;
    onCardChange();
  }
}

// --- LÓGICA DE INICIALIZAÇÃO ---
const initializeCards = () => {
  const savedOption = localStorage.getItem('selectedOption') || '3';
  selectedOption.value = savedOption;
  const initialCount = parseInt(savedOption, 10);
  
  const savedCardsData = localStorage.getItem('cardData');
  let initialCards: RobotConfig[] = [];
  
  if (savedCardsData) {
    initialCards = JSON.parse(savedCardsData);
  }
  
  while (initialCards.length < initialCount) {
    initialCards.push(createEmptyCard());
  }
  initialCards.length = initialCount;
  cards.value = initialCards;

  autoAssignNumbers();
  onCardChange();
};

initializeCards();
</script>

<template>
  <div class="control-container">
    <div class="form-section">
      <label class="input-wrapper">
        <span class="section-label">Quantidade de Robôs</span>
        <select id="options" class="dropdown" v-model="selectedOption" @change="updateCardList">
          <option v-for="n in MAX_ROBOTS" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
    </div>

    <div class="card-list">
      <div class="form-section" v-for="(card, index) in filteredCards" :key="index">
        <span class="section-label">Robô {{ index }}</span>
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
              <input type="text" v-model="card.kp" @input="onCardChange" />
            </label>
            <label class="input-wrapper">
              <span class="input-label">KI</span>
              <input type="text" v-model="card.ki" @input="onCardChange" />
            </label>
            <label class="input-wrapper">
              <span class="input-label">KD</span>
              <input type="text" v-model="card.kd" @input="onCardChange" />
            </label>
          </div>
          <div class="row preset-row">
             <label class="input-wrapper">
              <span class="input-label">Presets PID</span>
              <select class="dropdown" @change="applyPreset(card, ($event.target as HTMLSelectElement).value)">
                <option value="">Selecione um preset...</option>
                <option v-for="(preset, key) in pidPresets" :key="key" :value="key">
                  {{ key.charAt(0).toUpperCase() + key.slice(1) }}
                </option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="save-action">
      <button class="action-button" @click="saveButton">Salvar Configurações</button>
    </div>
  </div>
</template>

<style scoped>
.control-container { width: 100%; display: flex; flex-direction: column; gap: var(--spacing-4); animation: fadeInSlideUp 0.5s ease-out forwards; }
@keyframes fadeInSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.form-section { display: flex; flex-direction: column; gap: var(--spacing-3); background: rgba(0,0,0,0.2); padding: var(--spacing-3); border-radius: var(--border-radius-md); border: 1px solid var(--cor-borda); }
.section-label { font-size: var(--font-size-base); color: var(--texto-principal); font-weight: var(--font-weight-bold); }
.dropdown { font-size: var(--font-size-base); border: var(--border-width) solid var(--cor-borda); border-radius: var(--border-radius-sm); background-color: var(--fundo-terciario); color: var(--texto-principal); padding: var(--spacing-1) var(--spacing-2); cursor: pointer; }
.card-list { display: flex; flex-direction: column; gap: var(--spacing-3); }
.card-info { display: flex; flex-direction: column; flex-grow: 1; gap: var(--spacing-3); }
.row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-3); }
.row:has(input[placeholder*="Atacante"]) { grid-template-columns: 2fr 1fr; }
.preset-row { margin-top: var(--spacing-2); }
.input-wrapper { display: flex; flex-direction: column; gap: var(--spacing-1); }
.input-label { font-size: var(--font-size-sm); color: var(--texto-secundario); font-weight: var(--font-weight-bold); }
input[type="text"] { width: 100%; padding: var(--spacing-2); border: none; border-bottom: 2px solid var(--cor-borda); background: transparent; color: var(--texto-principal); font-size: var(--font-size-base); transition: border-color 0.3s ease; }
input[type="text"]:focus { outline: none; border-color: var(--cor-destaque); }
.save-action { display: flex; justify-content: flex-end; margin-top: var(--spacing-2); }
.action-button { cursor: pointer; padding: var(--spacing-2) var(--spacing-4); color: white; font-size: var(--font-size-base); font-weight: var(--font-weight-bold); background-color: var(--cor-sucesso); border-radius: var(--border-radius-md); border: none; transition: all 0.2s ease; }
.action-button:hover { filter: brightness(1.1); }
</style>