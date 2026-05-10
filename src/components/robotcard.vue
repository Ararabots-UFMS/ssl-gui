<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import { useRobotData } from '@/robotData/robotData';

const { socket } = useRobotData();

interface RobotConfig {
  number: number | null;
  name: string;
  address: string;
  kp: string;
  ki: string;
  kd: string;
  Kp_angular: string;
}
const MAX_ROBOTS = 6;
const MAX_ROBOT_NUMBER = 15;

const pidPresets = {
  default:      { kp: '3.0', ki: '0.2', kd: '1.0', Kp_angular: '2.5' },
  aggressive:   { kp: '5.0', ki: '0.5', kd: '1.5', Kp_angular: '3.0' },
  conservative: { kp: '1.5', ki: '0.1', kd: '0.5', Kp_angular: '2.0' },
};

const props = defineProps<{
  roles?: { [id: number]: string }
}>();

const emit = defineEmits(['configs-updated', 'roles-updated']);

const selectedOption = ref<string>(localStorage.getItem('selectedOption') || '3');
const cards = ref<RobotConfig[]>([]);
const localRoles = ref<{ [id: number]: string }>({});

watch(() => props.roles, (newRoles) => {
  localRoles.value = { ...(newRoles || {}) };
}, { immediate: true, deep: true });

const filteredCards = computed(() => {
  const count = parseInt(selectedOption.value, 10);
  return cards.value.slice(0, count);
});

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

function onRoleChange(robotId: number | null) {
  if (robotId === null) return;
  const role = localRoles.value[robotId];
  socket.emit('updateRobotRole', { id: robotId, role });
  localStorage.setItem('selectedRobotRoles', JSON.stringify(localRoles.value));
  emit('roles-updated', localRoles.value);
}

const createEmptyCard = (): RobotConfig => ({
  number: null,
  name: '',
  address: '0,0,0,0,0',
  kp: '3.0',
  ki: '0.2',
  kd: '1.0',
  Kp_angular: '2.5'
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
    card.Kp_angular = preset.Kp_angular;
    onCardChange();
  }
}

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
    <!-- Quantity selector — pinned to the top of the panel. -->
    <div class="form-section quantity-section">
      <span class="section-label">Quantidade de Robôs</span>
      <select id="options" class="dropdown" v-model="selectedOption" @change="updateCardList">
        <option v-for="n in MAX_ROBOTS" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>

    <div class="card-list">
      <div class="form-section robot-card" v-for="(card, index) in filteredCards" :key="index">
        <div class="robot-header">
          <span class="section-label">Robô {{ card.number ?? index }}</span>
          <select
            v-if="card.number !== null"
            class="dropdown role-dropdown"
            v-model="localRoles[card.number]"
            @change="onRoleChange(card.number)"
          >
            <option value="0">Função…</option>
            <option value="1">Atacante</option>
            <option value="2">Goleiro</option>
            <option value="3">Zagueiro</option>
          </select>
        </div>

        <div class="card-info">
          <div class="row two-col">
            <label class="input-wrapper">
              <span class="input-label">Nome</span>
              <input type="text" v-model="card.name" placeholder="Ex: Atacante" @input="onCardChange" />
            </label>
            <label class="input-wrapper">
              <span class="input-label">Endereço</span>
              <input type="text" v-model="card.address" placeholder="0,0,0,0,0" @input="onCardChange" />
            </label>
          </div>

          <div class="row pid-grid">
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
            <label class="input-wrapper">
              <span class="input-label">Kp Ang.</span>
              <input type="text" v-model="card.Kp_angular" @input="onCardChange" />
            </label>
          </div>

          <div class="preset-row">
            <span class="input-label">Presets PID</span>
            <div class="preset-buttons">
              <button
                v-for="(_preset, key) in pidPresets"
                :key="key"
                type="button"
                class="preset-button"
                @click="applyPreset(card, key)"
              >
                {{ key.charAt(0).toUpperCase() + key.slice(1) }}
              </button>
            </div>
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
.control-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  animation: fadeInSlideUp 0.5s ease-out forwards;
}

@keyframes fadeInSlideUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  background: rgba(0, 0, 0, 0.2);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--cor-borda);
}

.quantity-section {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.section-label {
  font-size: var(--font-size-base);
  color: var(--texto-principal);
  font-weight: var(--font-weight-bold);
}

.dropdown {
  font-size: var(--font-size-sm);
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

.robot-card {
  /* Establish a query container so the PID grid can collapse to 2x2
     when the panel is narrow. */
  container-type: inline-size;
}

.robot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.role-dropdown {
  font-weight: var(--font-weight-bold);
  min-width: 110px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.row {
  display: grid;
  gap: var(--spacing-2);
}

.two-col {
  grid-template-columns: 1fr 1fr;
}

.pid-grid {
  grid-template-columns: 1fr 1fr 1fr 1fr;
}

@container (max-width: 320px) {
  .pid-grid { grid-template-columns: 1fr 1fr; }
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.input-label {
  font-size: var(--font-size-sm);
  color: var(--texto-secundario);
  font-weight: var(--font-weight-bold);
}

input[type="text"] {
  width: 100%;
  padding: 4px 6px;
  border: none;
  border-bottom: 1px solid var(--cor-borda);
  background: transparent;
  color: var(--texto-principal);
  font-size: var(--font-size-sm);
  transition: border-color 0.3s ease;
  min-width: 0;
}

input[type="text"]:focus {
  outline: none;
  border-color: var(--cor-destaque);
}

.preset-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-buttons {
  display: flex;
  gap: var(--spacing-1);
}

.preset-button {
  flex: 1 1 0;
  min-width: 0;
  padding: 4px 6px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  border-radius: var(--border-radius-sm);
  background-color: var(--fundo-terciario);
  color: var(--texto-principal);
  border: 1px solid var(--cor-borda);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.preset-button:hover {
  background-color: var(--cor-destaque);
  color: #fff;
  border-color: var(--cor-destaque);
}

.save-action {
  display: flex;
  justify-content: flex-end;
}

.action-button {
  cursor: pointer;
  padding: var(--spacing-2) var(--spacing-3);
  color: white;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  background-color: var(--cor-sucesso);
  border-radius: var(--border-radius-md);
  border: none;
  transition: filter 0.2s ease;
  width: 100%;
}

.action-button:hover { filter: brightness(1.1); }
</style>
