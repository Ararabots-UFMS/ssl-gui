<template>
  <div class="full-screen">
      <div class="menu-container">
        <div class="menu-buttons">
          <div
            v-for="(button, index) in buttons"
            :key="index"
            class="menu-button"
            :class="{ 'selected': selectedButton === index }"
            @click="selectButton(index)"
          >
            <p class="menu-button-text">{{ button }} Screen</p>
          </div>
        </div>
    </div>
    <div v-if="selectedButton === 0" class="main-screen">
      <div class="menu-left-side">
        <name></name>
        <card></card>
        <play></play>
      </div>
      <div class="menu-right-side">
        <field></field>
        <terminal></terminal>
      </div>
    </div>
    <div v-if="selectedButton === 1" class="config-screen">
      <div class="config-left-side">
        <name></name>
        <robotcard></robotcard>
      </div>
      <div class="config-right-side">
        <field></field>
      </div>
    </div>
  </div>
</template>

<script>
  import field from './components/field.vue';
  import terminal from './components/terminal.vue';
  import name from './components/name.vue';
  import card from './components/card.vue';
  import play from './components/play.vue';
  import robotcard from './components/robotcard.vue';

  export default {
    name: 'FullScreen',
    components: {
      field,
      terminal,
      name,
      card,
      play,
      robotcard,
    },
    data() {
      return {
        buttons: ['Main', 'Config'], // Índices dos botões
        selectedButton: null // Índice do botão selecionado
      };
    },
    mounted() {
      // Colocar o primeiro botão como selecionado inicialmente
      this.selectedButton = 0;
    },
    methods: {
      selectButton(index) {
        this.selectedButton = index;
      }
    },
  };
</script>

<style scoped>
.full-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  background-color: #252838
}

.menu-container {
  top: 0;
  right: 0;
  height: 100%;
  width: 4%;
  gap: 5px;
}

.menu-buttons {
  top: 0;
  right: 0;
  height: 100%;
  width: 80%;
  display: flex;
  flex-direction: column; /* Empilha os botões verticalmente */
}

.menu-button {
  width: 100%;
  height: 100%;
  background-color: #D2D1CB;
  color: #252838;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center; /* Centraliza o texto verticalmente */
  justify-content: center; /* Centraliza o texto horizontalmente */
}

.menu-button-text {
  writing-mode: vertical-lr; /* Texto na vertical, da esquerda para a direita */
  transform: rotate(180deg); /* Rotaciona o texto 180 graus */
}

.selected {
  background-color: #252838; /* Cor de fundo quando selecionado */
  color: #D2D1CB;
}

.main-screen {
  display: flex;
  width: 96%;
  height: 100%;
}

.menu-left-side {
  top: 0;
  right: 0;
  height: 100%;
  width: 48%;
  display: flex;
  flex-direction:column;
  align-items: center;
  gap: 5px
}

.menu-right-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 0;
  right: 0;
  height: 100%;
  width: 48%;
}

.config-screen {
  display: flex;
  flex: 1;
  height: 96%;
  width: 100%;
}

.config-left-side {
  top: 0;
  right: 0;
  height: 100%;
  width: 80%;
  display: flex;
  flex-direction:column;
  align-items: center;
  gap: 5px
}

.config-right-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 5%;
  height: 100%;
  width: 120%;
}
</style>


