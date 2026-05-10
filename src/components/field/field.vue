<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { FIELD_GEOMETRIES, type FieldType } from './fieldConfig'
import { FieldRenderer } from './fieldRenderer'
import { liveFieldGeometry } from '@/robotData/fieldGeometry'

const props = defineProps<{
  fieldType: FieldType
  showTrajectories: boolean
}>()

const { activeTheme } = useTheme()

const container = ref<HTMLDivElement | null>(null)
const canvasHost = ref<HTMLDivElement | null>(null)
const hostW = ref(0)
const hostH = ref(0)
const initError = ref<string | null>(null)

const aspectRatio = computed(() => {
  const live = liveFieldGeometry.value
  if (live && live.field_length && live.field_width) {
    const w = live.field_length + 2 * live.boundary_width
    const h = live.field_width + 2 * live.boundary_width
    return w / h
  }
  return FIELD_GEOMETRIES[props.fieldType].aspectRatio
})

let renderer: FieldRenderer | null = null
let containerObserver: ResizeObserver | null = null

const fit = () => {
  const c = container.value
  if (!c) return
  const cw = c.clientWidth
  const ch = c.clientHeight
  if (!cw || !ch) return
  const ar = aspectRatio.value
  let w: number, h: number
  if (cw / ch > ar) { h = ch; w = ch * ar }
  else { w = cw; h = cw / ar }
  hostW.value = Math.floor(w)
  hostH.value = Math.floor(h)
}

watch(activeTheme, () => renderer?.reloadTheme())
watch(aspectRatio, () => requestAnimationFrame(fit))
watch(liveFieldGeometry, () => requestAnimationFrame(fit), { deep: true })
watch(() => props.fieldType, (v) => {
  renderer?.setFieldType(v)
  requestAnimationFrame(fit)
})
watch(() => props.showTrajectories, (v) => renderer?.setShowTrajectories(v))

onMounted(async () => {
  if (!container.value || !canvasHost.value) return
  fit()
  containerObserver = new ResizeObserver(fit)
  containerObserver.observe(container.value)

  renderer = new FieldRenderer(canvasHost.value, props.fieldType, props.showTrajectories)
  try {
    await renderer.init()
    renderer.setShowTrajectories(props.showTrajectories)
  } catch (e) {
    initError.value = String(e)
    console.error('FieldRenderer init failed:', e)
  }
})

onBeforeUnmount(() => {
  containerObserver?.disconnect()
  containerObserver = null
  renderer?.destroy()
  renderer = null
})
</script>

<template>
  <div class="field-container" ref="container">
    <div
      class="field-canvas-host"
      :class="fieldType"
      :style="{ width: hostW + 'px', height: hostH + 'px' }"
      ref="canvasHost"
    >
      <div v-if="initError" class="init-error">Falha ao iniciar renderer: {{ initError }}</div>
    </div>
  </div>
</template>

<style scoped>
.field-container {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.field-canvas-host {
  position: relative;
  background: var(--fundo-principal);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  flex-shrink: 0;
}
.field-canvas-host :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
.init-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cor-erro);
  font-weight: bold;
  padding: var(--spacing-3);
  text-align: center;
}
</style>
