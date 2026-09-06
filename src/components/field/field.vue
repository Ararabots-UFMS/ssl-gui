<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { FIELD_GEOMETRIES, type FieldType } from './fieldConfig'
import { FieldRenderer, type RobotKey } from './fieldRenderer'
import { liveFieldGeometry } from '@/robotData/fieldGeometry'
import { useRobotControl } from '@/composables/useRobotControl'
import { addGeneralLog } from '@/composables/useLogs'

const props = defineProps<{
  fieldType: FieldType
  showTrajectories: boolean
}>()

const { activeTheme } = useTheme()
const {
  isManual, selectedTeam, selectedKey, lastTarget,
  selectRobot, clearSelection, sendTargetTo,
} = useRobotControl()

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
watch(selectedKey, (v) => renderer?.setSelectedRobot(v as RobotKey | null), { immediate: true })
watch(lastTarget, (v) => renderer?.setTargetMarker(v))

// Left-click picks a robot, right-click sends it there. Only our own team is selectable:
// commanding an opponent is not a thing the movement stack can do.
const onFieldClick = (e: MouseEvent) => {
  const p = renderer?.screenToField(e.clientX, e.clientY)
  if (!p) return
  const hit = renderer!.hitTestRobot(p.x, p.y, [selectedTeam.value])
  if (hit) {
    const [team, id] = hit.split(':')
    selectRobot(team as 'yellow' | 'blue', Number(id))
  } else {
    clearSelection()
  }
}

const onFieldContextMenu = (e: MouseEvent) => {
  const p = renderer?.screenToField(e.clientX, e.clientY)
  if (!p) return

  if (!isManual.value) {
    addGeneralLog('Modo ESTRATÉGIA: troque para MANUAL no painel Estratégia para comandar robôs.', 'error')
    return
  }
  if (selectedKey.value === null) {
    addGeneralLog('Nenhum robô selecionado: clique num robô antes de definir o destino.', 'error')
    return
  }

  sendTargetTo({ x: Math.round(p.x), y: Math.round(p.y) })
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') clearSelection()
}

onMounted(async () => {
  if (!container.value || !canvasHost.value) return
  fit()
  containerObserver = new ResizeObserver(fit)
  containerObserver.observe(container.value)

  window.addEventListener('keydown', onKeydown)

  renderer = new FieldRenderer(canvasHost.value, props.fieldType, props.showTrajectories)
  try {
    await renderer.init()
    renderer.setShowTrajectories(props.showTrajectories)
    renderer.setSelectedRobot(selectedKey.value as RobotKey | null)
    renderer.setTargetMarker(lastTarget.value)
  } catch (e) {
    initError.value = String(e)
    console.error('FieldRenderer init failed:', e)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
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
      :class="[fieldType, { manual: isManual }]"
      :style="{ width: hostW + 'px', height: hostH + 'px' }"
      ref="canvasHost"
      @click="onFieldClick"
      @contextmenu.prevent="onFieldContextMenu"
    >
      <div v-if="isManual" class="manual-badge">
        MODO MANUAL
        <span class="manual-hint">
          {{ selectedKey ? 'botão direito define o destino' : 'clique num robô' }}
        </span>
      </div>
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
.field-canvas-host.manual {
  cursor: crosshair;
}
.manual-badge {
  position: absolute;
  top: var(--spacing-2);
  left: var(--spacing-2);
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  background: color-mix(in srgb, var(--cor-destaque) 85%, transparent);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.04em;
  pointer-events: none;
}
.manual-hint {
  font-weight: normal;
  opacity: 0.85;
  text-transform: none;
  letter-spacing: 0;
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
