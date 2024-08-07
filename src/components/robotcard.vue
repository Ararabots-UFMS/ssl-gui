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
      <h2>{{ index + 1 }}</h2>
      </div>
      <div class="card-info">
        <label>
          Nome
          <input type="text" v-model="card.name" placeholder="Digite o nome" />
        </label>
        <label>
          Endereço
          <input type="text" v-model="card.address" placeholder="Digite o endereço" />
        </label>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedOption: '1', // Valor inicial do dropdown
      cards: [
        { name: '', address: '' },
        { name: '', address: '' },
        { name: '', address: '' },
        { name: '', address: '' },
        { name: '', address: '' },
        { name: '', address: '' }
      ]
    };
  },
  computed: {
    filteredCards() {
      // Filtra os cartões com base na opção selecionada
      const numberOfCards = parseInt(this.selectedOption, 10);
      return this.cards.slice(0, numberOfCards);
    }
  },
  methods: {
    updateCardList() {
      // Método opcional para lidar com mudanças no dropdown
      console.log('Selected option:', this.selectedOption);
    }
  }
};
</script>

<style scoped>
.dropdown-container {
  display: flex;
  align-items: center;
  width: 100%; /* Ajusta a largura conforme necessário */
  margin-left: 5%;
}

.dropdown-container label {
  color: #D2D1CB; /* Define a cor do texto da label */
  margin-right: 7px;
}

.dropdown {
  font-size: 14px;
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
  padding: 10px;
  color: #D2D1CB;
  margin-bottom: 15px;
  display: flex;
}

.card-number {
  display: flex;
  margin-bottom: 10px;
  width: 7%;
  align-items: center;
}
.card-number h2 {
  font-size: 30px;
}

.card-info {
  display: flex;
  flex-direction: column;
  width: 93%;
}

.card-info label {
  display: flex;
  margin-bottom: 10px;
.card h2 {
  margin-bottom: 5px;
  font-size: 100%;
}

.card-info label:last-of-type {
  margin-bottom: 0; /* Remove a margem do último label */
}

.card-info input {
  margin-left: 7px;
  padding: 5px;
  border: 1px; /* Cor da borda */
  border-radius: 4px; /* Cantos arredondados */
  background-color: #D2D1CB; /* Cor de fundo */
  color: #383f6b; /* Cor do texto */
  width: 100%;
.card p {
  margin: 0; /* Remover margem padrão do parágrafo */
  font-size: 80%;
}

.card-list-config {
  height: 75%;
  width: 95%;
  display: flex;
  flex-direction: column;
}
</style>
