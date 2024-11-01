<template>
  <div class="dropdown-container">
    <label for="options">Quantidade de Robôs</label>
    <select id="options" class="dropdown" v-model="selectedOption" @change="updateCardList">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
    </select>
  </div>
  <div class="card-list-config">
    <div class="card-config" v-for="(card, index) in filteredCards" :key="index">
      <div class="card-number">
        <select v-model="card.number" class="card-number-dropdown" @change="onCardChange(index)">
          <option v-for="number in availableNumbers(card.number)" :key="number" :value="number">
            {{ number }}
          </option>
        </select>
      </div>
      <div class="card-info">
        <!-- Linha com Nome e Endereço -->
        <div class="row">
          <label class="half-width">
            Nome
            <input type="text" v-model="card.name" placeholder="Digite o nome" @input="onCardChange(index)" />
          </label>
          <label class="half-width">
            Endereço
            <input type="text" v-model="card.address" placeholder="Digite o endereço" @input="onCardChange(index)" />
          </label>
        </div>
        <!-- Linha com KP, KI e KD -->
        <div class="row">
          <label class="third-width">
            KP
            <input type="text" v-model="card.kp" placeholder="Digite o KP" @input="onCardChange(index)" />
          </label>
          <label class="third-width">
            KI
            <input type="text" v-model="card.ki" placeholder="Digite o KI" @input="onCardChange(index)" />
          </label>
          <label class="third-width">
            KD
            <input type="text" v-model="card.kd" placeholder="Digite o KD" @input="onCardChange(index)" />
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="save">
    <button @click="saveButton()">
      Salvar
    </button>
  </div>
</template>

<script>
  import {socket} from '@/socket'

  export default {
    data() {
      return {
        selectedOption: localStorage.getItem('selectedOption') || '1', // Carrega do localStorage ou usa '1'
        cards: Array(6).fill().map(() => ({
          name: '',
          address: '0,0,0,0,0',
          kp: '0.0',
          ki: '0.0',
          kd: '0.0',
          number: null
        })),
        maxNumber: 15 // Máximo de números disponíveis
      };
    },
    created() {
      this.loadCardData();
    },
    computed: {
      filteredCards() {
        const numberOfCards = parseInt(this.selectedOption, 10);
        const filtered = this.cards.slice(0, numberOfCards);

        // Lista de números já selecionados
        const usedNumbers = this.cards.map(card => card.number).filter(n => n !== null);

        // Atribui um número automaticamente para cada card se não tiver um número já selecionado
        filtered.forEach(card => {
          if (card.number === null) {
            const available = this.availableNumbers(null).filter(n => !usedNumbers.includes(n));
            if (available.length > 0) {
              card.number = available[0]; // Seleciona o primeiro número disponível e único
              usedNumbers.push(available[0]); // Adiciona o número à lista de usados
            }
          }
        });

        return filtered;
      }
    },
    methods: {
      saveButton() {
        // Cria um array contendo os dados de todos os cartões
        const allCardData = this.filteredCards.map((card) => ({
          id: card.number,
          name: card.name,
          address: card.address,
          kp: card.kp,
          ki: card.ki,
          kd: card.kd,
        }));

        // Emite os dados através do socket
        socket.emit('configSaveButton', allCardData);

        console.log('Dados enviados:', allCardData);

        // Salva os dados no localStorage
        localStorage.setItem('cardData', JSON.stringify(allCardData));
      },
      loadCardData() {
        const savedData = JSON.parse(localStorage.getItem('cardData'));
        if (savedData) {
          this.cards = this.cards.map((card, index) => savedData[index] || card);
        }
      },

      updateCardList() {
        // Salva a opção selecionada no localStorage
        localStorage.setItem('selectedOption', this.selectedOption);
        // Método opcional para lidar com mudanças no dropdown
        console.log('Selected option:', this.selectedOption);
      },
      availableNumbers(currentNumber) {
        // Filtra os números disponíveis, de 0 a 15, excluindo os já selecionados, exceto o número atual
        const selectedNumbers = this.cards.map(card => card.number);
        const allNumbers = Array.from({ length: this.maxNumber + 1 }, (_, i) => i); // Inclui o número 0
        return allNumbers.filter(n => !selectedNumbers.includes(n) || n === currentNumber || currentNumber === null);
      },
      onCardChange(index) {
        const card = this.cards[index];
        const cardData = {
          id: card.number,
          name: card.name,
          address: card.address,
          kp: card.kp,
          ki: card.ki,
          kd: card.kd,
        };
        // Salva o estado dos cards no localStorage
        localStorage.setItem('cards', JSON.stringify(this.cards));
        // console.log('Card changed:', cardData);
      }
    },
    mounted() {
      const savedCards = JSON.parse(localStorage.getItem('cards'));
      if (savedCards) {
        this.cards = savedCards;
      }
    }
  };
</script>

<style scoped>
.dropdown-container {
  display: flex;
  align-items: center;
  width: 80%; /* Ajusta a largura conforme necessário */
  margin-left: 5%;
  margin-right: 5%; /* Garantir que não ultrapasse os limites da tela */
}

.dropdown-container label {
  color: #D2D1CB; /* Define a cor do texto da label */
  margin-right: 7px;
}

.dropdown {
  font-size: 100%;
  border: 1px solid #D2D1CB; /* Cor da borda */
  border-radius: 4px; /* Cantos arredondados */
  background-color: #D2D1CB; /* Cor de fundo do dropdown */
  color: #252838; /* Cor do texto */
  width: 10%; /* Ajusta a largura conforme necessário */
}

.dropdown option {
  background-color: #252838; /* Cor de fundo das opções */
  color: #D2D1CB; /* Cor do texto das opções */
}

.card-config {
  background-color: #383f6b;
  border-radius: 8px;
  padding: 12px;
  color: #D2D1CB;
  margin-bottom: 1.5%;
  display: flex;
}

.card-number {
  display: flex;
  justify-content: center;
  width: 7%;
  align-items: center;
}
.card-number-dropdown {
  font-size: 2rem; /* Tamanho da fonte semelhante ao do h2 */
  text-align: center; /* Centraliza o texto */
  border: none; /* Remove a borda padrão */
  background-color: transparent; /* Fundo transparente para estilo simples */
  color: #D2D1CB; /* Cor do texto */
  appearance: none; /* Remove o estilo padrão do dropdown no navegador */
  width: 100%; /* Ocupa o espaço do contêiner */
  font-weight: bold; /* Texto em negrito para destacar */
  -webkit-appearance: none; /* Remove a seta no Safari/Chrome */
  -moz-appearance: none; /* Remove a seta no Firefox */
  appearance: none; /* Remove a seta nos navegadores que suportam appearance */
  outline: none; /* Remove o foco padrão */
}

.card-number-dropdown option {
  background-color: #252838; /* Cor de fundo das opções */
  color: #D2D1CB; /* Cor do texto das opções */
}

.card-number-dropdown:focus {
  outline: none; /* Remove o foco padrão */
}

.card-number-dropdown::-ms-expand {
  display: none; /* Remove a seta do select no IE e Edge */
}

.card-info {
  display: flex;
  flex-direction: column;
  width: 93%;
}

.card-info label {
  display: flex;
  font-size: 100%;
}

.card-info label:last-of-type {
  margin-bottom: 0; /* Remove a margem do último label */
}

.card-info input {
  margin-left: 7px;
  padding: 6px;
  border: 1px; /* Cor da borda */
  border-radius: 4px; /* Cantos arredondados */
  background-color: #D2D1CB; /* Cor de fundo */
  color: #383f6b; /* Cor do texto */
  width: 100%;
}

.row {
  display: flex;
  justify-content: space-between;
  margin: 4px;
}

.half-width {
  width: 48%;
}

.third-width {
  width: 30%;
}

.card-list-config {
  width: 95%; /* Ajuste para não ultrapassar a tela */
  display: flex;
  flex-direction: column; /* Organiza os elementos verticalmente */
  margin-left: 5%; /* Ajuste lateral para centralizar */
}

.save {
  width: 100%;
  height: 90px;
  display: flex;
  justify-content: center;
  align-items: center;
}

button {
  cursor: pointer;
  width: 25%;
  height: 80%;
  color: #D2D1CB;
  font-size: 2rem;
  background-color: green;
  border-radius: 10px;
  border: none;
  font-size: 200%;
}

button:active {
  background-color: #3e8e41;
}

</style>