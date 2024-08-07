<template>
  <div class="card-list">
    <div class="card" v-for="(card, index) in cards" :key="index">
      <h2>{{ card.title }}</h2>
      <p>{{ card.description }}</p>
    </div>
  </div>
</template>

<script>
export default {
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
  }
};
</script>

<style scoped>
.card {
  background-color: #383f6b;
  border-radius: 10px;
  padding: 1.5%;
  margin-bottom: 1.5%;
  color: #D2D1CB;
}

.card h2 {
  margin-bottom: 0.5%;
  font-size: 100%;
}

.card p {
  margin: 0; /* Remover margem padrão do parágrafo */
  font-size: 80%;
}

.card-list {
  height: 70%;
  width: 95%;
  display: flex;
  flex-direction: column;
}
</style>
