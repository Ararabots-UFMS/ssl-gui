<template>
  <div class="card-list">
    <div class="card" v-for="(card, index) in limitedCards" :key="index">
      <div class="card-icon">
        <h2>{{ card.id || index + 1 }}</h2>
      </div>
      <div class="card-line">
      </div>
      <div class="card-name">
        <h2>{{ card.name }}</h2>
      </div>
      <div class="card-position">
        <select class="dropdown-position" v-model="selectedOptions[index]" @change="updateCardList(index)">
          <option value="0">Posição...</option>
          <option value="1">Atacante</option>
          <option value="2">Goleiro</option>
          <option value="3">Zagueiro</option>
        </select>
      </div>      
    </div>
  </div>
</template>

<script>
import {socket} from '@/socket'
export default {
  data() {
    return {
      num: 6, // Define quantos cartões serão mostrados
      selectedOptions: Array(6).fill("0"),
      cards: [
        { id: 1, name: 'Robô 1', position: 'Descrição do Card 1.' },
        { id: 2, name: 'Robô 2', position: 'Descrição do Card 2.' },
        { id: 3, name: 'Robô 3', position: 'Descrição do Card 3.' },
        { id: 4, name: 'Robô 4', position: 'Descrição do Card 4.' },
        { id: 5, name: 'Robô 5', position: 'Descrição do Card 5.' },
        { id: 6, name: 'Robô 6', position: 'Descrição do Card 6.' }
      ]
    };
  },
  created() {
    // Carrega as opções selecionadas do localStorage ao montar o componente
    const storedSelections = JSON.parse(localStorage.getItem('selectedOptions'));
    const storedCard = JSON.parse(localStorage.getItem('cardData'));

    if (storedSelections) {
      this.selectedOptions = storedSelections;
    }
    if (storedCard) {
      storedCard.forEach((item, index) => {
        if (this.cards[index]) {
          this.cards[index].name = item.name || this.cards[index].name;
          this.cards[index].id = item.id || this.cards[index].id;
        }
      });
      this.num = storedCard.length;
    }
  },
  computed: {
    // Computed property para limitar o número de cards exibidos
    limitedCards() {
      return this.cards.slice(0, this.num);
    }
  },
  methods: {
    updateCardList(index) {
      socket.emit('updateCard',index + 1,this.selectedOptions[index]);
      console.log('updateCard',index + 1,this.selectedOptions[index]);
      // Aqui você pode implementar qualquer lógica adicional ao selecionar uma opção
      localStorage.setItem('selectedOptions', JSON.stringify(this.selectedOptions));
    }
  }
};
</script>

<style scoped>
.card {
  background-color: #383f6b;
  border-radius: 10px;
  margin-bottom: 2%;
  color: #D2D1CB;
  display: flex;
  width: 100%;
}

.card-icon {
  display: flex;
  width: 10%;
  margin: 1%;
  align-items: center; /* Centraliza o texto verticalmente */
  justify-content: center; /* Centraliza o texto horizontalmente */
  padding: 1%;
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
  font-size: 120%;
  border: 1px solid #383f6b; /* Cor da borda */
  border-radius: 4px; /* Cantos arredondados */
  background-color: #383f6b; /* Cor de fundo do dropdown */
  color: #D2D1CB; /* Cor do texto */
  width: 75%; /* Ajusta a largura conforme necessário */
  height: 60%;
}

/* Estilo para as opções dentro do dropdown
.dropdown-position option {
  background-color: #252838; 
  color: #D2D1CB; 
} */

.card-list {
  height: 70%;
  width: 95%;
  display: flex;
  flex-direction: column;
}
</style>
