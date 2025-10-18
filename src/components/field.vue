<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { yellowRobots, blueRobots, balls, trajectories, socket, systemStatus } from '@/socket';
import ThemeSwitcher from './ThemeSwitcher.vue';

const FIELD_DIMENSIONS = {
    'SSL-EL': { fieldW: 5500, fieldH: 4000 },
    'SSL': { fieldW: 10400, fieldH: 7400 },
    'treino': { fieldW: 1530, fieldH: 1330 },
} as const
type FieldType = keyof typeof FIELD_DIMENSIONS;

type Robot = { id: number; position_x: number; position_y: number; orientation: number }
type Ball = { id: number; position_x: number; position_y: number }

const fieldEl = ref<HTMLElement | null>(null)
const lineThickness = ref(2)

const fieldType = ref<FieldType>((localStorage.getItem('fieldType') as FieldType) || 'SSL-EL')
const side = ref<boolean>(JSON.parse(localStorage.getItem('side') || 'false'))
const teamColor = ref<boolean>(JSON.parse(localStorage.getItem('teamColor') || 'false'))
const mode = ref<boolean>(JSON.parse(localStorage.getItem('mode') || 'false'))
const showTrajectories = ref<boolean>(JSON.parse(localStorage.getItem('showTrajectories') || 'true'))
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

const styledTrajectories = computed(() => {
    const result: { [key: number]: { x: number, y: number }[] } = {}
    
    Object.entries(trajectories).forEach(([robotId, points]) => {
        const dims = FIELD_DIMENSIONS[fieldType.value]
        const centerX = dims.fieldW / 2
        const centerY = dims.fieldH / 2
        
        result[parseInt(robotId)] = points.map(point => {
            const xMm = point.x * 1000
            const yMm = point.y * 1000
            
            const xPixels = (centerX + xMm) * scaleFactors.value.x
            const yPixels = (centerY - yMm) * scaleFactors.value.y
            
            return { x: xPixels, y: yPixels }
        })
    })
    
    return result
})
const generatePathString = (points: { x: number, y: number }[]) => {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
    
    let path = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
        if (!isNaN(points[i].x) && !isNaN(points[i].y)) {
            path += ` L ${points[i].x} ${points[i].y}`
        }
    }
    
    return path
}

const getRobotColor = (robotId: number) => {
    const yellowRobot = yellowRobots.find(r => r.id === robotId)
    const blueRobot = blueRobots.find(r => r.id === robotId)
    
    if (yellowRobot) return 'yellow'
    if (blueRobot) return 'blue'
    return 'unknown'
}

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
const changeTrajectories = () => {
 
    localStorage.setItem('showTrajectories', JSON.stringify(showTrajectories.value))
    try {
        socket.emit('showTrajectories', showTrajectories.value)
    } catch (e) {
   
    }
}

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
                <label for="field-select" class="control-label">Campo</label>
                <select id="field-select" :value="fieldType" @change="changeFieldType" class="select-field">
                    <option v-for="key in Object.keys(FIELD_DIMENSIONS)" :key="key" :value="key">
                        {{ key }}
                    </option>
                </select>
            </div>

            <div class="control-group theme-group">
                <span class="control-label">Tema</span>
                <ThemeSwitcher />
            </div>
            <div class="control-group">
                <span class="control-label">Trajetórias</span>
                <p class="toggle-label" :class="{ inactive: !showTrajectories }">{{ showTrajectories ? 'ON' : 'OFF' }}</p>
                <label class="switch">
                    <input type="checkbox" v-model="showTrajectories" @change="changeTrajectories" />
                    <span class="slider trajectories round"></span>
                </label>
            </div>
           
        </div>

     <div class="field-wrapper">
            <div :class="['field', fieldType]" ref="fieldEl">
                <!-- Trajetórias dos robôs -->
                <svg v-if="showTrajectories && Object.keys(styledTrajectories).length > 0" class="trajectories-overlay" :width="fieldSize.width" :height="fieldSize.height">
                    <g v-for="(points, robotId) in styledTrajectories" :key="`trajectory-${robotId}`">

                        <path 
                            v-if="points.length > 1"
                            :d="generatePathString(points)" 
                            :class="['trajectory', getRobotColor(robotId)]"
                            fill="none"
                            stroke-width="3"
                            stroke-dasharray="8,4"
                        />
                    
                        <circle 
                            v-for="(point, index) in points" 
                            :key="`point-${robotId}-${index}`"
                            :cx="point.x" 
                            :cy="point.y" 
                            r="3"
                            :class="['trajectory-point', getRobotColor(robotId)]"
                        />
                    
                        <circle 
                            v-if="points.length > 0"
                            :cx="points[0].x" 
                            :cy="points[0].y" 
                            r="5"
                            :class="['trajectory-start', getRobotColor(robotId)]"
                        />
                    </g>
                </svg>

                <!-- Robôs -->
                <div v-for="r in styledYellowRobots" :key="`yellow-${r.id}`" class="robot yellow" :style="r.style">
                    <span class="robot-id">{{ r.id }}</span>
                </div>
                <div v-for="r in styledBlueRobots" :key="`blue-${r.id}`" class="robot blue" :style="r.style">
                    <span class="robot-id">{{ r.id }}</span>
                </div>
                <div v-for="b in styledBalls" :key="`ball-${b.id}`" class="ball" :style="b.style" />

                <!-- Elementos do campo -->
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
/* ==========================================================================
 * CONTAINERS PRINCIPAIS
 * ========================================================================== */
.field-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  height: 100%;
}

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

/* ==========================================================================
 * BARRA DE CONTROLE
 * ========================================================================== */
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

.control-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.control-label {
  font-size: var(--font-size-sm);
  color: var(--texto-secundario);
  font-weight: var(--font-weight-bold);
  margin-right: var(--spacing-1);
}

.toggle-label {
  color: var(--texto-principal);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  margin: 0;
  transition: color 0.3s ease;
}

.toggle-label.inactive {
  color: var(--texto-secundario);
  font-weight: var(--font-weight-regular);
}

/* ==========================================================================
 * SWITCHES
 * ========================================================================== */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  transition: .4s;
  border-radius: 28px;
  border: var(--border-width) solid var(--cor-borda);
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

/* --- Tipos de slider --- */
input:checked + .slider:before { transform: translateX(22px); }

.slider.mode { background-color: var(--cor-sucesso); }
input:checked + .slider.mode { background-color: var(--cor-aviso); }

.slider.side { background-color: var(--fundo-terciario); }
input:checked + .slider.side { background-color: #e62a2aff; }

.slider.team-color { background-color: var(--time-azul); }
input:checked + .slider.team-color { background-color: var(--time-amarelo); }

.slider.trajectories { background-color: #ce3131ff; }
input:checked + .slider.trajectories { background-color: var(--cor-destaque); }

/* ==========================================================================
 * CAMPOS DE SELEÇÃO
 * ========================================================================== */
.select-field {
  background-color: var(--fundo-terciario);
  color: var(--texto-principal);
  border: var(--border-width) solid var(--cor-borda);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.select-field:focus {
  outline: 2px solid var(--cor-destaque);
  outline-offset: 2px;
}

/* ==========================================================================
 * ELEMENTOS DO CAMPO
 * ========================================================================== */

.robot, .ball {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.robot {
  width: 2.8%; 
  height: 4.2%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s linear; 
    background: radial-gradient(circle at 70% 30%, #2C2C2C, #000000);
    border: 3px solid var(--robot-border-color, var(--cor-borda));
    box-shadow: 0 0 8px var(--robot-border-color), 0 4px 12px rgba(0, 0, 0, 0.5);
}

.robot::before {
  content: '';
  position: absolute;
  top: 15%; 
  width: 20%;
  height: 30%;
  
  background: white;
  border-radius: 50%;
  opacity: 0.4;
  box-shadow: 0 0 5px 2px white; 
}

.robot.yellow {
  --robot-border-color: var(--time-amarelo);
}
.robot.blue {
  --robot-border-color: var(--time-azul);
}

.robot-id {
  font-size: 15px;
  font-weight: 900;
  color: white;
  text-shadow: 0px 0px 4px rgba(0, 0, 0, 1);
  z-index: 1; 
}

.ball {
  width: 1.8%;
  height: 2.8%;
  background: radial-gradient(circle at 70% 30%, #ffc107, #e65100);
}
/* ==========================================================================
 * TRAJETÓRIAS
 * ========================================================================== */
.trajectories-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.trajectory {
  opacity: 0.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trajectory.yellow {
  stroke: var(--time-amarelo);
  filter: drop-shadow(0 0 4px rgba(255, 193, 7, 0.8));
}

.trajectory.blue {
  stroke: var(--time-azul);
  filter: drop-shadow(0 0 4px rgba(0, 123, 255, 0.8));
}

.trajectory.unknown {
  stroke: #dbe9e8;
  opacity: 0.8;
  filter: drop-shadow(0 0 3px rgba(229, 255, 0, 0.6));
}

/* ==========================================================================
 * TEMAS DE CAMPO — SSL, SSL-EL e TREINO
 * ========================================================================== */

/* --- 1. SSL (verde) --- */
.field.SSL {
  position: relative;
  aspect-ratio: 1.405405405;
  background: radial-gradient(circle at center, #0b2d1a 0%, #062011 80%);
  border: calc(var(--line-thickness) * 2) solid #ffffff33;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  --field-line-color: rgba(255, 255, 255, 0.8);
  --goal-color: rgba(255, 255, 255, 0.5);
  --ret-ext-w: 86.53%;
  --ret-ext-h: 81.08%;
  --ret-ext-t: 9.5%;
  --ret-ext-l: 7%;
  --linha-v-h: 81.08%;
  --linha-v-t: 9.5%;
  --gol-w: 5%;
  --gol-h: 13.51%;
  --gol-l: 2.15%;
  --gol-r: 1.75%;
  --circulo-w: 12%;
  --circulo-h: 20%;
  --area-w: 9.61%;
  --area-h: 27.02%;
  --area-l: 7%;
  --area-r: 6.5%;
}

/* --- 2. SSL-EL (azul escuro com linhas brancas) --- */
.field.SSL-EL { 
    --field-line-color: #ffffff98;
    --goal-color: #ffffff6e; 

    position: relative;
    aspect-ratio: 1.405;
    background: radial-gradient(circle at center, #222e5c 0%, #050a1a 80%);
    border: calc(var(--line-thickness) * 2) solid #ffffff;
    border-radius: 1.5%;
    box-shadow: inset 0 0 20px rgba(59, 1, 1, 0.05),
                inset 0 0 60px rgba(0, 0, 0, 0.6);
    overflow: hidden;

    --ret-ext-w: 81.82%; 
    --ret-ext-h: 75%;
    --ret-ext-t: 12.5%;
    --ret-ext-l: 9.09%;
    --linha-v-h: 75%;
    --linha-v-t: 12.5%;
    --gol-w: 5.82%;
    --gol-h: 20%;
    --gol-l: 3.55%; 
    --circulo-w: 15%;
    --circulo-h: 25%;
    --area-w: 8.44%;
    --area-h: 36.38%;
    --area-l: 9.10%; 
    --area-r: 9.10%;
    --corner-size: 8%;
}

.field.SSL-EL::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
}
/* --- 3. Treino/Debug --- */
.field.treino {
  position: relative;
  aspect-ratio: 1.15037593;
  background: var(--fundo-terciario);
  border: calc(var(--line-thickness) * 2) solid var(--cor-aviso);
  box-shadow: inset 0 0 15px rgba(114, 30, 30, 0.5);
  --field-line-color: var(--cor-aviso);
  --goal-color: var(--cor-borda);
  --ret-ext-w: 70%;
  --ret-ext-h: 60%;
  --ret-ext-t: 20%;
  --ret-ext-l: 15%;
  --linha-v-h: 60%;
  --linha-v-t: 20%;
  --gol-w: 6%;
  --gol-h: 15%;
  --gol-l: 9.2%;
  --circulo-w: 10%;
  --circulo-h: 15%;
  --area-w: 6.5%;
  --area-h: 25%;
  --area-l: 15%;
}


/* ==========================================================================
 * LINHAS DO CAMPO
 * ========================================================================== */
.ret-ext, .linha-centro, .gol-esquerdo, .gol-direito,
.circulo-central, .area-esquerda, .area-direita {
  position: absolute;
  box-sizing: border-box;
  border-style: solid;
  border-width: var(--line-thickness);
  border-color: var(--field-line-color);
}

/* === Linhas centrais === */
.linha-centro.horizontal {
  height: var(--line-thickness);
  width: var(--ret-ext-w);
  top: 50%;
  left: var(--ret-ext-l);
  transform: translateY(-50%);
}

.linha-centro.vertical {
  width: var(--line-thickness);
  height: var(--linha-v-h);
  left: 50%;
  top: var(--linha-v-t);
  transform: translateX(-50%);
}

/* === Retângulo e áreas === */
.ret-ext {
  width: var(--ret-ext-w);
  height: var(--ret-ext-h);
  top: var(--ret-ext-t);
  left: var(--ret-ext-l);
}

.gol-esquerdo, .gol-direito {
  width: var(--gol-w);
  height: var(--gol-h);
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.06);
  border-color: var(--goal-color);
}

.gol-esquerdo {
  left: var(--gol-l);
  border-right: var(--line-thickness) solid var(--field-line-color);
}

.gol-direito {
  right: var(--gol-r, var(--gol-l));
  border-left: var(--line-thickness) solid var(--field-line-color);
}

/* === Círculo central === */
.circulo-central {
  width: var(--circulo-w);
  height: var(--circulo-h);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.circulo-central::after {
  content: "";
  position: absolute;
  width: 5%;
  height: 5%;
  background: var(--field-line-color);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* === Áreas === */
.area-esquerda, .area-direita {
  width: var(--area-w);
  height: var(--area-h);
  top: 50%;
  transform: translateY(-50%);
}

.area-esquerda { left: var(--area-l); }
.area-direita { right: var(--area-r, var(--area-l)); }

/* === Escanteios === */
.corner {
  position: absolute;
  width: 3%;
  height: 3%;
  border: calc(var(--line-thickness)) solid var(--field-line-color);
  border-radius: 50%;
}

.corner.tl { top: 0; left: 0; border-bottom: none; border-right: none; }
.corner.tr { top: 0; right: 0; border-bottom: none; border-left: none; }
.corner.bl { bottom: 0; left: 0; border-top: none; border-right: none; }
.corner.br { bottom: 0; right: 0; border-top: none; border-left: none; }

/* ==========================================================================
 * STATUS / SERVIÇOS
 * ========================================================================== */
.status-section {
  display: flex;
  gap: var(--spacing-3);
  padding-left: var(--spacing-4);
  border-left: 1px solid var(--cor-borda);
}

.service-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.service-item span {
  font-size: var(--font-size-sm);
  color: var(--texto-secundario);
  font-weight: var(--font-weight-bold);
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--cor-erro);
  transition: all 0.3s ease;
}

.status-indicator.online {
  background-color: var(--cor-sucesso);
  box-shadow: 0 0 8px var(--cor-sucesso);
}

/* ==========================================================================
 * RESPONSIVIDADE
 * ========================================================================== */
@media (max-width: 768px) {
  .control-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    justify-items: start;
    gap: var(--spacing-3) var(--spacing-2);
    padding: var(--spacing-3);
  }

  .control-group {
    width: 100%;
    justify-content: space-between;
  }
}

/* ==========================================================================
 * SELETOR DE TEMA
 * ========================================================================== */
.theme-group {
  padding-left: var(--spacing-3);
  border-left: 1px solid var(--cor-borda);
}
</style>
