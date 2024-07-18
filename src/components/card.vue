<template>
  <div class="card">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    description: String
  }
};
</script>

<style scoped>
.card {
  background-color: #383f6b;
  border-radius: 8px;
  padding: 10px;
  margin: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  height: 10vh;
  width: 45vw;
}

h2 {
  margin-bottom: 10px;
  font-size: 20px;
  color: #D2D1CB;
}

p {
  color: #D2D1CB;
}
</style>