<script setup lang="ts">
import { ref } from 'vue';
import { socket } from '@/socket';

// --- INTERFACES E TIPOS ---
interface CardConfig {
  id: string;
  port?: string;
  num_cams?: string;
}

// --- ESTADO REATIVO ---
const cards = ref<CardConfig[]>([
  { id: '0', port: '0' },
  { id: '0', port: '0', num_cams: '0' },
  { id: '0' }, 
]);

const icons = [
  'https://img.icons8.com/ios/50/foul.png', // Juiz
  'https://img.icons8.com/ios/50/visible--v1.png', // Visão
  'https://img.icons8.com/ios/50/wifi--v1.png', // Comunicação
];

// --- FUNÇÕES ---
function onCardChange() {
  // Salva os dados no localStorage sempre que um campo é alterado.
  // Para otimizar, poderíamos adicionar um "debounce" aqui, mas para já, está bom.
  localStorage.setItem('cardData', JSON.stringify(cards.value));
}

function saveButton() {
  // Envia o estado atual dos cards para o backend.
  socket.emit('terminalSaveButton', cards.value);
  console.log('Dados de configuração enviados:', cards.value);
  // Poderíamos adicionar um feedback visual aqui (ex: "Salvo com sucesso!")
}

// --- LÓGICA DE INICIALIZAÇÃO ---
// Carrega os dados salvos do localStorage quando o componente é montado.
const storedData = localStorage.getItem('cardData');
if (storedData) {
  // Validação simples para garantir que os dados carregados têm a estrutura esperada.
  const parsedData = JSON.parse(storedData);
  if (Array.isArray(parsedData) && parsedData.length === cards.value.length) {
    cards.value = parsedData;
  }
}
</script>

<template>
  <div class="config-container">
    <div class="card-group" v-for="(card, index) in cards" :key="index">
      <div class="card-config">
        <img class="card-icon" :src="icons[index]" :alt="`icon-${index}`" />

        <div class="card-inputs">
          <label class="input-wrapper">
            <span class="input-label">ID</span>
            <input
              type="text"
              v-model="card.id"
              placeholder="0"
              @input="onCardChange"
            />
          </label>

          <label class="input-wrapper" v-if="'port' in card">
            <span class="input-label">Porta</span>
            <input
              type="text"
              v-model="card.port"
              placeholder="0"
              @input="onCardChange"
            />
          </label>

          <label class="input-wrapper" v-if="'num_cams' in card">
            <span class="input-label">N° Cams</span>
            <input
              type="text"
              v-model="card.num_cams"
              placeholder="0"
              @input="onCardChange"
            />
          </label>
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
  max-width: 600px;
  margin: var(--spacing-5) auto; 
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);}

.card-config {
  background-color: var(--fundo-secundario);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-3);
  color: var(--texto-principal);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  border: var(--border-width) solid var(--cor-borda);
}

.card-icon {
  width: 32px; 
  filter: invert(90%) sepia(10%) saturate(150%) hue-rotate(190deg) brightness(100%) contrast(90%);
}

.card-inputs {
  display: flex;
  flex-grow: 1;
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