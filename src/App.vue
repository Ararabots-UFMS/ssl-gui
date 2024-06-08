<script setup lang="ts">
  import FieldCanvas from "@/components/FieldCanvas.vue";
  import {inject, ref} from "vue";
  import {defaultField} from "@/field";
  import type {Field} from "@/field";
  import Arena from './components/Arena.vue'


  const visionApi = inject<VisionApi>('vision-api')
  const field = ref(defaultField)
  visionApi?.RegisterConsumer((f: Field) => field.value = f)
</script>

<template>
  <FieldCanvas :field="field"/>
  
  <header>
    <div class="wrapper">
      <!-- <arena/> -->
    </div>
  </header>

</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    /* display: flex; */
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  /* header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  } */
}
</style>
