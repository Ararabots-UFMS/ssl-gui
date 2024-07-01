<template>
  <div class="full-screen">
    <div class="left-side">

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

  export default {
    name: 'FullScreen',
    components: {
      field,
      buttons,
      terminal,
    },
    data() {
      return {
        // Dados da sua aplicação aqui
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

</style>


