<template>
  <div class="full-screen">
    <div class="left-side">
      <name></name>
       <div class="card-list">
      <card
        v-for="(card, index) in cards"
        :key="index"
        :title="card.title"
        :description="card.description"
      />
    </div>
    <play></play>
    </div>
    <div class="right-side">
      <field></field>
      <buttons></buttons>
      <terminal></terminal>
    </div>
  </div>
</template>

<script>
  import field from './components/field.vue';
  import buttons from './components/buttons.vue';
  import terminal from './components/terminal.vue';
  import name from './components/name.vue';
  import card from './components/card.vue';
  import play from './components/play.vue';

  export default {
    name: 'FullScreen',
    components: {
      field,
      buttons,
      terminal,
      name,
      card,
      play,
    },
    data() {
      return {
        cards: [
        { title: 'Card 1', description: 'Descrição do Card 1.' },
        { title: 'Card 2', description: 'Descrição do Card 2.' },
        { title: 'Card 3', description: 'Descrição do Card 3.' },
        { title: 'Card 4', description: 'Descrição do Card 4.' },
        { title: 'Card 5', description: 'Descrição do Card 5.' },
        { title: 'Card 6', description: 'Descrição do Card 6.' }
      ]
      };
    },
    methods: {
      // Métodos da sua aplicação aqui
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

.left-side {
  top: 0;
  right: 0;
  height: 100%;
  width: 50%;
  display: flex;
  flex-direction:column;
  align-items: center;
  gap: 5px
}

.right-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 0;
  right: 0;
  height: 100%;
  width: 50%;
}

.card-list {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  flex-direction: column;
}

</style>


