<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { useRobotData } from '@/robotData/robotData'
import { useTheme } from '@/composables/useTheme'
import FieldControlBar from './FieldControlBar.vue'
import { FIELD_GEOMETRIES, type FieldType } from './fieldConfig'
import { FieldRenderer } from './fieldRenderer'

const { socket } = useRobotData()
const { activeTheme } = useTheme()

const fieldType = ref<FieldType>((localStorage.getItem('fieldType') as FieldType) || 'SSL-EL')
const showTrajectories = ref<boolean>(JSON.parse(localStorage.getItem('showTrajectories') || 'true'))

const wrapper = ref<HTMLDivElement | null>(null)
const canvasHost = ref<HTMLDivElement | null>(null)
const hostW = ref(0)
const hostH = ref(0)

const aspectRatio = computed(() => FIELD_GEOMETRIES[fieldType.value].aspectRatio)

let renderer: FieldRenderer | null = null
const initError = ref<string | null>(null)
let wrapperObserver: ResizeObserver | null = null

const fitHost = () => {
  if (!wrapper.value) return
  const ww = wrapper.value.clientWidth
  const wh = wrapper.value.clientHeight
  if (!ww || !wh) return
  const ar = aspectRatio.value
  let w: number, h: number
  if (ww / wh > ar) { h = wh; w = wh * ar }
  else { w = ww; h = ww / ar }
  hostW.value = Math.floor(w)
  hostH.value = Math.floor(h)
}

const onFieldTypeUpdate = (v: FieldType) => {
  fieldType.value = v
  localStorage.setItem('fieldType', v)
  try { socket.emit('fieldType', v) } catch { /* ignore */ }
  renderer?.setFieldType(v)
  nextTick(fitHost)
}

const onTrajectoriesUpdate = (v: boolean) => {
  showTrajectories.value = v
  localStorage.setItem('showTrajectories', JSON.stringify(v))
  try { socket.emit('showTrajectories', v) } catch { /* ignore */ }
  renderer?.setShowTrajectories(v)
}

watch(aspectRatio, () => nextTick(fitHost))
watch(activeTheme, () => renderer?.reloadTheme())

onMounted(async () => {
  try { socket.emit('fieldType', fieldType.value) } catch { /* ignore */ }
  if (!canvasHost.value || !wrapper.value) return

  fitHost()
  wrapperObserver = new ResizeObserver(fitHost)
  wrapperObserver.observe(wrapper.value)

  renderer = new FieldRenderer(canvasHost.value, fieldType.value, showTrajectories.value)
  try {
    await renderer.init()
    renderer.setShowTrajectories(showTrajectories.value)
  } catch (e) {
    initError.value = String(e)
    console.error('FieldRenderer init failed:', e)
  }
})

onBeforeUnmount(() => {
  wrapperObserver?.disconnect()
  wrapperObserver = null
  renderer?.destroy()
  renderer = null
})
</script>

<template>
  <div class="field-container">
    <FieldControlBar
      :fieldType="fieldType"
      :showTrajectories="showTrajectories"
      @update:fieldType="onFieldTypeUpdate"
      @update:showTrajectories="onTrajectoriesUpdate"
    />
    <div class="field-wrapper" ref="wrapper">
      <div
        class="field-canvas-host"
        :class="fieldType"
        :style="{ width: hostW + 'px', height: hostH + 'px' }"
        ref="canvasHost"
      >
        <div v-if="initError" class="init-error">Falha ao iniciar renderer: {{ initError }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
}
.field-wrapper {
  flex-grow: 1;
  width: 100%;
  min-height: 0;
  min-width: 0;
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
