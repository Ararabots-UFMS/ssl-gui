<template>
  <div class="card-list-config">
    <div class="card-group" v-for="(card, index) in cards" :key="index">
      <div class="card-config">
        <div class="card-info">
          <div class="row">
            <img
              class="icons"
              :src="icons[index]"
              :alt="`icon-${index}`"
            />
            <label class="third-width">
              ID
              <input
                type="text"
                v-model="card.id"
                placeholder="Digite o ID"
                @input="onCardChange"
              />
            </label>
            <label class="third-width" v-if="index !== 2">
              Porta
              <input
                type="text"
                v-model="card.port"
                placeholder="Digite a Porta"
                @input="onCardChange"
              />
            </label>
            <label class="third-width" v-if="index === 1">
              N° Cameras
              <input
                type="text"
                v-model="card.num_cams"
                placeholder="Digite o Número de Cameras"
                @input="onCardChange"
              />
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
      cards: [
        { id: '0', port: '0' },
        { id: '0', port: '0', num_cams: '0' },
        { id: '0', port: '0' },
      ],
      icons: [
        'https://img.icons8.com/ios/50/foul.png',
        'https://img.icons8.com/ios/50/visible--v1.png',
        'https://img.icons8.com/ios/50/wifi--v1.png',
      ],
    };
  },
  created() {
    // Carrega os dados do localStorage ao criar o componente
    const storedData = localStorage.getItem('cardData');
    if (storedData) {
      this.cards = JSON.parse(storedData);
    }
  },
  methods: {
    onCardChange() {
      // Salva os dados no localStorage a cada alteração
      localStorage.setItem('cardData', JSON.stringify(this.cards));
    },
    saveButton() {
      // Envia os dados para o backend via socket
      socket.emit('terminalSaveButton', this.cards);
      console.log('Dados enviados:', this.cards);
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