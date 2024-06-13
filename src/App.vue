<template>
  <div class="full-screen" :style="{ backgroundColor: '#252838' }">
    <arena></arena>
    <AgentesExternos></AgentesExternos>
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>


