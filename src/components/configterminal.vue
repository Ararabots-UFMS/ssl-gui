<template>
  <div class="card-list-config">
    <div class="card-group">
      <div class="card-config">
        <div class="card-info">
          <div class="row">
            <img class="icons" src="https://img.icons8.com/ios/50/foul.png" alt="foul" />
            <label class="third-width">
              ID
              <input type="text" v-model="card1.id" placeholder="Digite o ID" @input="onCardChange(0)" />
            </label>
            <label class="third-width">
              Porta
              <input type="text" v-model="card1.port" placeholder="Digite a Porta" @input="onCardChange(0)" />
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="card-group">
      <div class="card-config">
        <div class="card-info">
          <div class="row">
            <img class="icons" src="https://img.icons8.com/ios/50/visible--v1.png" alt="visible--v1" />
            <label class="third-width">
              ID
              <input type="text" v-model="card2.id" placeholder="Digite o ID" @input="onCardChange(1)" />
            </label>
            <label class="third-width">
              Porta
              <input type="text" v-model="card2.port" placeholder="Digite a Porta" @input="onCardChange(1)" />
            </label>
            <label class="third-width">
              N° Cameras
              <input type="text" v-model="card2.num_cams" placeholder="Digite o Número de Cameras" @input="onCardChange(1)" />
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="card-group">
      <div class="card-config">
        <div class="card-info">
          <div class="row">
            <img class="icons" src="https://img.icons8.com/ios/50/wifi--v1.png" alt="wifi--v1" />
            <label class="third-width">
              ID
              <input type="text" v-model="card3.id" placeholder="Digite o ID" @input="onCardChange(2)" />
            </label>
            <label class="third-width">
              Porta
              <input type="text" v-model="card3.port" placeholder="Digite a Porta" @input="onCardChange(2)" />
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
      // Definindo três objetos separados para cada cartão
      card1: { id: '0', port: '0' },
      card2: { id: '0', port: '0', num_cams: '0' },
      card3: { id: '0', port: '0' },
    };
  },
  created() {
    // Carrega os dados do localStorage quando o componente é montado
    const storedData = localStorage.getItem('cardData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      this.card1 = parsedData.card1 || this.card1;
      this.card2 = parsedData.card2 || this.card2;
      this.card3 = parsedData.card3 || this.card3;
    }
  },
  methods: {
    saveButton() {
      // Coleta os dados dos três cartões e os envia via socket
      const allCardData = [this.card1, this.card2, this.card3];
      socket.emit('terminalSaveButton', allCardData);
      console.log('Dados enviados:', allCardData);
      
      // Atualiza o localStorage com os dados atuais dos cartões
      localStorage.setItem('cardData', JSON.stringify({ card1: this.card1, card2: this.card2, card3: this.card3 }));
    },
    onCardChange(cardIndex) {
      // Salva os dados no localStorage após qualquer mudança
      const allCards = { card1: this.card1, card2: this.card2, card3: this.card3 };
      console.log(`Card ${cardIndex + 1} atualizado:`, allCards[`card${cardIndex + 1}`]);
      localStorage.setItem('cardData', JSON.stringify(allCards));
    },
  },
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
    width: 100%;
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
    width: 50%;
    height: 55%;
  }

  .row {
    display: flex;
    justify-content: flex-start;
    margin: 4px;
    align-items: center;
    gap: 10px;
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