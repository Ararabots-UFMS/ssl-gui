<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true, 
    default: 'ARARABOTS - GUI'
  }
})
</script>

<template>
  <div class="title-container">
    <h1>{{ title }}</h1>
  </div>
</template>

<style scoped>
.title-container {
  padding: var(--spacing-2) var(--spacing-4);
}

h1 {
  color: var(--texto-principal);
  font-size: var(--font-size-h1); /* Tamanho de título principal do nosso sistema. */
  font-weight: var(--font-weight-bold);
  text-align: center; /* Centralizamos para um visual de header. */
  margin: 0;
}
</style>