<template>
  <div class="full-screen">
    <div class="left-side">

    </div>
    <div class="right-side">
      <arena></arena>
      <AgentesExternos></AgentesExternos>
    </div>
  </div>
</template>

<script>
  import Arena from './components/Arena.vue';
  import AgentesExternos from './components/AgentesExternos.vue';

  export default {
    name: 'FullScreen',
    components: {
      Arena,
      AgentesExternos
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


