<template>
  <div class="card-list">
    <div class="card" v-for="(card, index) in cards" :key="index">
      <div class="card-icon">
        <h2>{{ index + 1 }}</h2>
      </div>
      <div class="card-line">
      </div>
      <div class="card-name">
        <h2>{{ card.name }}</h2>
      </div>
      <div class="card-position">
        <select id="options" class="dropdown-position" v-model="selectedOption" @change="updateCardList">
          <option value="1">Atacante</option>
          <option value="2">Goleiro</option>
          <option value="3">Zagueiro</option>
        </select>
      </div>      
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cards: [
        { name: 'Robô 1', position: 'Descrição do Card 1.' },
        { name: 'Robô 2', position: 'Descrição do Card 2.' },
        { name: 'Robô 3', position: 'Descrição do Card 3.' },
        { name: 'Robô 4', position: 'Descrição do Card 4.' },
        { name: 'Robô 5', position: 'Descrição do Card 5.' },
        { name: 'Robô 6', position: 'Descrição do Card 6.' }
      ]
    };
  }
};
</script>

<style scoped>
.card {
  background-color: #383f6b;
  border-radius: 8px;
  margin-bottom: 5%;
  color: #D2D1CB;
  display: flex;
  width: 100%;
}

.card-icon {
  display: flex;
  width: 8%;
  margin: 2%;
  align-items: center; /* Centraliza o texto verticalmente */
  justify-content: center; /* Centraliza o texto horizontalmente */
}

.card-line {
  height: 100%;
  width: 2%;
  background-color: green;
}

.card-name {
  display: flex;
  width: 100%;
  margin-left: 10px;
  align-items: center; /* Centraliza o texto verticalmente */
}

.card-position {
  width: 40%;
  display: flex;
  align-items: center; /* Centraliza o texto verticalmente */
}

.dropdown-position {
  font-size: 25px;
  border: 1px;/* solid #252838; /* Cor da borda */
  border-radius: 4px; /* Cantos arredondados */
  background-color: #383f6b; /* Cor de fundo do dropdown */
  color: #D2D1CB; /* Cor do texto */
  width: 90%; /* Ajusta a largura conforme necessário */
  height: 75%;
}

.dropdown-position option {
  background-color: #252838; /* Cor de fundo das opções */
  color: #D2D1CB; /* Cor do texto das opções */
}

.card-list {
  height: 75%;
  width: 95%;
  display: flex;
  flex-direction: column;
}
</style>
