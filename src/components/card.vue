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
  background-color: #f0f0f0;
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
  color: #333;
}

p {
  color: #666;
}
</style>