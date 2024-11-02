<template>
  <div class="card-list-config">
    <div v-for="(group, groupIndex) in groupedCards" :key="groupIndex" class="card-group">
      <div class="card-config" v-for="(card, index) in group" :key="index">
        <div class="card-info">
          <div class="row">
            <img
              class="icons"
              :src="index === 0 ? 'https://img.icons8.com/ios/50/foul.png' : 
                    index === 1 ? 'https://img.icons8.com/ios/50/visible--v1.png' : 
                    'https://img.icons8.com/ios/50/wifi--v1.png'"
              :alt="index === 0 ? 'foul' : index === 1 ? 'visible--v1' : 'wifi--v1'"
            />
            <label class="third-width">
              ID
              <input type="text" v-model="card.id" placeholder="Digite o ID" @input="onCardChange(groupIndex, index)" />
            </label>
            <label class="third-width">
              Porta
              <input type="text" v-model="card.port" placeholder="Digite a Porta" @input="onCardChange(groupIndex, index)" />
            </label>
            <label class="third-width">
              Cams
              <input type="text" v-model="card.num_cams" placeholder="Digite o Número de Cameras" @input="onCardChange(groupIndex, index)" />
            </label>
          </div>
        </div>
      </div>
    </div>
    <div class="save">
      <button @click="saveButton()">Salvar</button>
    </div>
  </div>
</template>

<script>
import { socket } from '@/socket';

export default {
  data() {
    return {
      groupedCards: [
        [
          { id: '', port: '', num_cams: '' },
          { id: '', port: '', num_cams: '' },
          { id: '', port: '', num_cams: '' }
        ]
      ]
    };
  },
  created() {
    // Carrega os dados do localStorage quando o componente é montado
    const storedData = localStorage.getItem('groupedCards');
    if (storedData) {
      this.groupedCards = JSON.parse(storedData);
    }
  },
  methods: {
    saveButton() {
      // Emite os dados de todos os cartões através do socket
      const allCardData = this.groupedCards[0].map(card => ({
        id: card.id,
        port: card.port,
        num_cams: card.num_cams,
      }));

      socket.emit('configSaveButton', allCardData);
      console.log('Dados enviados:', allCardData);
    },
    onCardChange(groupIndex, cardIndex) {
      const card = this.groupedCards[groupIndex][cardIndex];
      const cardData = {
        id: card.id,
        port: card.port,
        num_cams: card.num_cams,
      };
      console.log('Card atualizado:', cardData);
      localStorage.setItem('groupedCards', JSON.stringify(this.groupedCards));
    }
  }
};
</script>

<style scoped>

  .card-config {
    background-color: #383f6b;
    border-radius: 8px;
    padding: 10px;
    color: #D2D1CB;
    margin-bottom: 1.5%;
    display: flex;
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
    height: 55%;
  }

  .row {
    display: flex;
    justify-content: space-between;
    margin: 4px;
    align-items: center;
  }

  .third-width {
    width: 30%;
    display: flex;
  }

  .card-list-config {
    width: 80%; /* Ajuste para não ultrapassar a tela */
    display: flex;
    flex-direction: column; /* Organiza os elementos verticalmente */
    margin-left: 5%; /* Ajuste lateral para centralizar */
    margin-top: 10%;
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

  .icons {
    height: 60%;
  }

</style>