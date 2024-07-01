<template>
  <div>
    <h1>{{ message }}</h1>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'ARARABOTS - GUI'
    };
  }
};
</script>

<style scoped>
div {
  text-align: left;
  margin-top: 20px;
}
h1 {
  color: white;
  font-size: 24px;
}
</style>
