<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { yellowRobots, blueRobots, balls, socket } from '@/socket'

const FIELD_DIMENSIONS = {
    'SSL-EL': { fieldW: 5500, fieldH: 4000 },
    'SSL': { fieldW: 10400, fieldH: 7400 },
    'treino': { fieldW: 1530, fieldH: 1330 },
} as const

type FieldType = keyof typeof FIELD_DIMENSIONS
type Robot = { id: number; position_x: number; position_y: number; orientation: number }
type Ball = { id: number; position_x: number; position_y: number }

const fieldEl = ref<HTMLElement | null>(null)
const lineThickness = ref(2)

const fieldType = ref<FieldType>((localStorage.getItem('fieldType') as FieldType) || 'SSL-EL')
const side = ref<boolean>(JSON.parse(localStorage.getItem('side') || 'false'))
const teamColor = ref<boolean>(JSON.parse(localStorage.getItem('teamColor') || 'false'))
const mode = ref<boolean>(JSON.parse(localStorage.getItem('mode') || 'false'))
const fieldSize = reactive({ width: 1, height: 1 })

const scaleFactors = computed(() => {
    if (!fieldSize.width) return { x: 1, y: 1 }
    const dims = FIELD_DIMENSIONS[fieldType.value]
    return {
        x: fieldSize.width / dims.fieldW,
        y: fieldSize.height / dims.fieldH,
    }
})

const getStyledEntities = (entities: Robot[] | Ball[]) => computed(() =>
    entities.map(entity => {
        const dims = FIELD_DIMENSIONS[fieldType.value]
        const centerX = dims.fieldW / 2
        const centerY = dims.fieldH / 2
        const left = `${(centerX + entity.position_x) * scaleFactors.value.x}px`
        const top = `${(centerY - entity.position_y) * scaleFactors.value.y}px`
        const transform = 'orientation' in entity
            ? `translate(-50%, -50%) rotate(${entity.orientation}rad)`
            : `translate(-50%, -50%)`
        return { ...entity, style: { top, left, transform } }
    })
)

const styledYellowRobots = getStyledEntities(yellowRobots)
const styledBlueRobots = getStyledEntities(blueRobots)
const styledBalls = getStyledEntities(balls)

const updateScale = () => {
    if (fieldEl.value) {
        const { width, height } = fieldEl.value.getBoundingClientRect()
        fieldSize.width = width
        fieldSize.height = height
        lineThickness.value = Math.max(1.5, width * 0.002)
    }
}

const createToggleHandler = (stateRef: typeof side, eventName: string, storageKey: string) => () => {
    stateRef.value = !stateRef.value
    socket.emit(eventName, stateRef.value)
    localStorage.setItem(storageKey, JSON.stringify(stateRef.value))
}

const changeMode = createToggleHandler(mode, 'fieldMode', 'mode')
const changeSide = createToggleHandler(side, 'fieldSide', 'side')
const changeTeamColor = createToggleHandler(teamColor, 'teamColor', 'teamColor')

const changeFieldType = (event: Event) => {
    const newType = (event.target as HTMLSelectElement).value as FieldType
    fieldType.value = newType
    socket.emit('fieldType', newType)
    localStorage.setItem('fieldType', newType)
    nextTick(updateScale)
}

onMounted(() => {
    socket.emit('fieldMode', mode.value)
    socket.emit('fieldSide', side.value)
    socket.emit('teamColor', teamColor.value)
    socket.emit('fieldType', fieldType.value)
    nextTick(updateScale)
    window.addEventListener('resize', updateScale)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateScale)
})
</script>

<template>
    <div class="field-container" :style="{ '--line-thickness': `${lineThickness}px` }">
        <div class="control-bar">
            <div class="control-group">
                <span class="control-label">Modo</span>
                <p class="toggle-label" :class="{ inactive: mode }">Simu</p>
                <label class="switch">
                    <input type="checkbox" :checked="mode" @click="changeMode" />
                    <span class="slider mode round"></span>
                </label>
                <p class="toggle-label" :class="{ inactive: !mode }">Real</p>
            </div>
            <div class="control-group">
                <span class="control-label">Lado</span>
                <p class="toggle-label" :class="{ inactive: side }">E</p>
                <label class="switch">
                    <input type="checkbox" :checked="side" @click="changeSide" />
                    <span class="slider side round"></span>
                </label>
                <p class="toggle-label" :class="{ inactive: !side }">D</p>
            </div>
            <div class="control-group">
                <span class="control-label">Cor</span>
                <label class="switch">
                    <input type="checkbox" :checked="teamColor" @click="changeTeamColor" />
                    <span class="slider team-color round"></span>
                </label>
            </div>
            <div class="control-group">
                <label for="field-select" class="control-label">Campo</label>
                <select id="field-select" :value="fieldType" @change="changeFieldType" class="select-field">
                    <option v-for="key in Object.keys(FIELD_DIMENSIONS)" :key="key" :value="key">
                        {{ key }}
                    </option>
                </select>
            </div>
        </div>

        <div class="field-wrapper">
            <div :class="['field', fieldType]" ref="fieldEl">
                <div v-for="r in styledYellowRobots" :key="`yellow-${r.id}`" class="robot yellow" :style="r.style" />
                <div v-for="r in styledBlueRobots" :key="`blue-${r.id}`" class="robot blue" :style="r.style" />
                <div v-for="b in styledBalls" :key="`ball-${b.id}`" class="ball" :style="b.style" />

                <div class="ret-ext"></div>
                <div class="linha-centro horizontal"></div>
                <div class="linha-centro vertical"></div>
                <div class="gol-esquerdo"></div>
                <div class="gol-direito"></div>
                <div class="circulo-central"></div>
                <div class="area-esquerda"></div>
                <div class="area-direita"></div>
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
}

.control-bar {
  width: 100%;
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-2);
  gap: var(--spacing-4);
  background-color: var(--fundo-secundario);
  border-radius: var(--border-radius-md);
}
.control-group { display: flex; align-items: center; gap: var(--spacing-2); }
.control-label { font-size: var(--font-size-sm); color: var(--texto-secundario); font-weight: var(--font-weight-bold); margin-right: var(--spacing-1); }
.toggle-label { color: var(--texto-principal); font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); margin: 0; transition: color 0.3s ease; }
.toggle-label.inactive { color: var(--texto-secundario); font-weight: var(--font-weight-regular); }
.switch { position: relative; display: inline-block; width: 50px; height: 28px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; transition: .4s; border-radius: 28px; border: var(--border-width) solid var(--cor-borda); }
.slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider:before { transform: translateX(22px); }
.slider.mode { background-color: var(--cor-sucesso); }
input:checked + .slider.mode { background-color: var(--cor-aviso); }
.slider.side { background-color: var(--fundo-terciario); }
input:checked + .slider.side { background-color: #555; }
.slider.team-color { background-color: var(--time-azul); }
input:checked + .slider.team-color { background-color: var(--time-amarelo); }
.select-field { background-color: var(--fundo-terciario); color: var(--texto-principal); border: var(--border-width) solid var(--cor-borda); border-radius: var(--border-radius-sm); padding: var(--spacing-1) var(--spacing-2); font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); cursor: pointer; }
.select-field:focus { outline: 2px solid var(--cor-destaque); outline-offset: 2px; }

.field-wrapper {
    width: 100%;
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
}
.field {
    border: calc(var(--line-thickness) * 2) solid var(--cor-borda);
    border-radius: var(--border-radius-md);
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    position: relative;
    background-color: var(--fundo-principal);
}
.robot, .ball {
    position: absolute;
    transform: translate(-50%, -50%);
    border-radius: 50%;
}
.robot { width: 2.6%; height: 4%; }
.robot.yellow { background: var(--time-amarelo); }
.robot.blue { background: var(--time-azul); }
.ball { width: 1.8%; height: 2.8%; background-color: var(--cor-aviso); }

.field.SSL-EL { 
    aspect-ratio: 1.375;
    --ret-ext-w: 81.82%; --ret-ext-h: 75%; --ret-ext-t: 12.5%; --ret-ext-l: 9.09%;
    --linha-v-h: 75%; --linha-v-t: 12.5%;
    --gol-w: 5.82%; --gol-h: 20%; --gol-l: 3.55%;
    --circulo-w: 15%; --circulo-h: 25%;
    --area-w: 8.4375%; --area-h: 36.36%; --area-l: 9.10%;
}
.field.SSL { 
    aspect-ratio: 1.405405405;
    --ret-ext-w: 86.53%; --ret-ext-h: 81.08%; --ret-ext-t: 9.5%; --ret-ext-l: 7%;
    --linha-v-h: 81.08%; --linha-v-t: 9.5%;
    --gol-w: 5%; --gol-h: 13.51%; --gol-l: 2.15%; --gol-r: 1.75%;
    --circulo-w: 12%; --circulo-h: 20%;
    --area-w: 9.61%; --area-h: 27.02%; --area-l: 7%; --area-r: 6.5%;
}
.field.treino { 
    aspect-ratio: 1.15037593; 
    background-color: var(--fundo-terciario);
    --ret-ext-w: 70%; --ret-ext-h: 60%; --ret-ext-t: 20%; --ret-ext-l: 15%;
    --linha-v-h: 60%; --linha-v-t: 20%;
    --gol-w: 6%; --gol-h: 15%; --gol-l: 9.20%;
    --circulo-w: 10%; --circulo-h: 15%;
    --area-w: 6.5%; --area-h: 25%; --area-l: 15%;
}

.ret-ext, .linha-centro, .gol-esquerdo, .gol-direito, .circulo-central, .area-esquerda, .area-direita {
    position: absolute;
    box-sizing: border-box;
    border-color: var(--field-line-color);
}
.linha-centro { background-color: var(--field-line-color); }
.linha-centro.horizontal { height: var(--line-thickness); width: var(--ret-ext-w); top: 50%; left: var(--ret-ext-l); transform: translateY(-50%); }
.linha-centro.vertical { width: var(--line-thickness); height: var(--linha-v-h); left: 50%; top: var(--linha-v-t); transform: translateX(-50%); }
.ret-ext { border: var(--line-thickness) solid; width: var(--ret-ext-w); height: var(--ret-ext-h); top: var(--ret-ext-t); left: var(--ret-ext-l); }
.gol-esquerdo, .gol-direito { width: var(--gol-w); height: var(--gol-h); border: calc(var(--line-thickness) * 1.5) solid var(--goal-color); top: 50%; transform: translateY(-50%); }
.gol-esquerdo { left: var(--gol-l); border-right: var(--line-thickness) solid var(--field-line-color); }
.gol-direito { right: var(--gol-r, var(--gol-l)); border-left: var(--line-thickness) solid var(--field-line-color); }
.circulo-central { border: var(--line-thickness) solid; width: var(--circulo-w); height: var(--circulo-h); border-radius: 50%; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.area-esquerda, .area-direita { border: var(--line-thickness) solid; width: var(--area-w); height: var(--area-h); top: 50%; transform: translateY(-50%); }
.area-esquerda { left: var(--area-l); }
.area-direita { right: var(--area-r, var(--area-l)); }
</style>