<script lang="ts">
import { yellowRobots, blueRobots, balls } from '@/socket'
import { socket } from '@/socket'

// Definição das dimensões dos campos
const FIELD_DIMENSIONS = {
    'SSL-EL': {
        fieldW: 5500,
        fieldH: 4000,
        golW: 320,
        golH: 800,
        circleW: 825,
        circleH: 1000,
        areaW: 464,
        areaH: 1455,
    },
    'SSL': {
        fieldW: 10400,
        fieldH: 7400,
        golW: 520,
        golH: 1000,
        circleW: 1248,
        circleH: 1480,
        areaW: 1000,
        areaH: 2000,
    },
    'treino': {
        fieldW: 1530,
        fieldH: 1330,
        golW: 92,
        golH: 200,
        circleW: 153,
        circleH: 200,
        areaW: 99,
        areaH: 333,
    }
} as const

type FieldType = keyof typeof FIELD_DIMENSIONS;

interface ComponentData {
    fieldType: FieldType;
    yellowRobots: typeof yellowRobots;
    blueRobots: typeof blueRobots;
    balls: typeof balls;
    side: boolean;
    teamColor: boolean;
    mode: boolean;
    scaleX: number;
    scaleY: number;
    fieldWidth: number;
    fieldHeight: number;
}

export default {
    name: 'Arena',
    data(): ComponentData {
        return {
            fieldType: (localStorage.getItem('fieldType') as FieldType) || 'SSL-EL',
            yellowRobots,
            blueRobots,
            balls,
            side: JSON.parse(localStorage.getItem('side') || 'false'),
            teamColor: JSON.parse(localStorage.getItem('teamColor') || 'false'),
            mode: JSON.parse(localStorage.getItem('mode') || 'false'),
            scaleX: 1,
            scaleY: 1,
            fieldWidth: 1,
            fieldHeight: 1,
        }
    },
    methods: {
        mapX(x_mm: number): string {
            // Busca as dimensões originais definidas para o campo selecionado
            const dims = FIELD_DIMENSIONS[this.fieldType];
            // Calcula a largura do robô com base no percentual definido no CSS
            const robotWidth = this.fieldWidth * 0.026;
            const centerX = dims.fieldW / 2;
            return `${((centerX + x_mm) * this.scaleX) - robotWidth / 2}px`;
        },
        mapY(y_mm: number): string {
            const dims = FIELD_DIMENSIONS[this.fieldType];
            const robotHeight = this.fieldHeight * 0.04;
            const centerY = dims.fieldH / 2;
            return `${((centerY - y_mm) * this.scaleY) - robotHeight / 2}px`;
        },
        changeMode() {
            this.mode = !this.mode;
            socket.emit('fieldMode', this.mode);
            localStorage.setItem('mode', JSON.stringify(this.mode)); // Salva o estado
        },
        changeSide() {
            this.side = !this.side;
            socket.emit('fieldSide', this.side);
            localStorage.setItem('side', JSON.stringify(this.side)); // Salva o estado
        },
        changeTeamColor() {
            this.teamColor = !this.teamColor;
            socket.emit('teamColor', this.teamColor);
            localStorage.setItem('teamColor', JSON.stringify(this.teamColor)); // Salva o estado
        },
        changeFieldType(event: Event) {
            const select = event.target as HTMLSelectElement;
            this.fieldType = select.value as FieldType;
            socket.emit('fieldType', this.fieldType);
            localStorage.setItem('fieldType', this.fieldType);
            // Atualiza a escala após mudança do tipo de campo
            this.$nextTick(() => this.updateScale());
        },
        updateScale() {
            const fieldEl = (this.$el as HTMLElement).querySelector(".field") as HTMLElement;
            if (!fieldEl) return;
            
            const { width, height } = fieldEl.getBoundingClientRect();
            this.fieldWidth = width;
            this.fieldHeight = height;

            const dims = FIELD_DIMENSIONS[this.fieldType];
            this.scaleX = this.fieldWidth / dims.fieldW;
            this.scaleY = this.fieldHeight / dims.fieldH;

            // As dimensões já são calculadas via CSS responsivo
            // Este método agora só atualiza as escalas para os robôs e bolas
        },
    },
    mounted() {
        // Os valores já são carregados no data(), só precisamos emitir para o socket
        socket.emit('fieldMode', this.mode);
        socket.emit('fieldSide', this.side);
        socket.emit('teamColor', this.teamColor);
        socket.emit('fieldType', this.fieldType);

        this.$nextTick(() => this.updateScale());
        window.addEventListener("resize", this.updateScale);
    },
    beforeUnmount() {
        window.removeEventListener("resize", this.updateScale);
    },
}
</script>

<template>
    <div class="components-field">
        <div class="buttons">
            <div class="button-side">
                <p class="texto-button">Simu</p>
                <label class="switch">
                    <input type="checkbox" :checked="mode" @click="changeMode()" />
                    <span class="slider3 round"></span>
                </label>
                <p class="texto-button">Real</p>
            </div>
            <div class="button-side">
                <p class="texto-button">E</p>
                <label class="switch">
                    <input type="checkbox" :checked="side" @click="changeSide()" />
                    <span class="slider2 round"></span>
                </label>
                <p class="texto-button">D</p>
            </div>
            <div>
                <label class="switch">
                    <input type="checkbox" :checked="teamColor" @click="changeTeamColor()" />
                    <span class="slider1 round"></span>
                </label>
            </div>
            <div class="button-side">
                <label for="field-select" class="texto-button" style="margin-right: 5px;">Campo:</label>
                <select id="field-select" :value="fieldType" @change="changeFieldType" class="select-field">
                    <option value="SSL-EL">SSL-EL</option>
                    <option value="SSL">SSL</option>
                    <option value="treino">Treino</option>
                </select>
            </div>
        </div>

        <div class="field-wrapper">
            <div :class="['field', fieldType]">
                <!-- yellow robots -->
                <div
                    v-for="r in yellowRobots"
                    :key="`yellow-${r.id}`"
                    class="robot yellow"
                    :style="{
                        top: mapY(r.position_y),
                        left: mapX(r.position_x),
                        transform: 'rotate(' + r.orientation + 'rad)'
                    }"
                />

                <!-- blue robots -->
                <div
                    v-for="r in blueRobots"
                    :key="`blue-${r.id}`"
                    class="robot blue"
                    :style="{
                        top: mapY(r.position_y),
                        left: mapX(r.position_x),
                        transform: 'rotate(' + r.orientation + 'rad)'
                    }"
                />

                <!-- balls -->
                <div
                    v-for="b in balls"  
                    :key="`ball-${b.id}`"
                    class="ball"
                    :style="{
                        top: mapY(b.position_y),
                        left: mapX(b.position_x)
                    }"
                />

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

        <!-- <div class="texto">
            Coordinates: ({{ position.x }}, {{ position.y }}, {{ position.angle }})
        </div>

        <button @click="sendMessage">Send Message</button> -->
    </div>
</template>

<style>
    .components-field {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px; /* Reduzido de 16px para 8px, por exemplo */
        width: 100%;
    }

    .switch {
        position: relative;
        display: inline-block;
        margin: 10px;
        margin-left: 5px;
        margin-right: 5px;
        width: 60px;
        height: 34px;
    }

    /* Hide default HTML checkbox */
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    /* The slider */
    .slider1 {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #2E81FF;
        -webkit-transition: .4s;
        transition: .4s;
    }
    .slider1:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
    }
    input:checked + .slider1 {
        background-color: #EAD201;
    }
    input:checked + .slider1:before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
    }
    .slider1.round {
        border-radius: 34px;
    }
    .slider1.round:before {
        border-radius: 50%;
    }

    .slider2 {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #D2D1CB;
        -webkit-transition: .4s;
        transition: .4s;
    }
    .slider2:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
    }
    input:checked + .slider2 {
        background-color: #9E9E9A;
    }
    input:checked + .slider2:before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
    }
    .slider2.round {
        border-radius: 34px;
    }
    .slider2.round:before {
        border-radius: 50%;
    }

    .slider3 {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: greenyellow;
        -webkit-transition: .4s;
        transition: .4s;
    }
    .slider3:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
    }
    input:checked + .slider3 {
        background-color: green;
    }
    input:checked + .slider3:before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
    }
    .slider3.round {
        border-radius: 34px;
    }
    .slider3.round:before {
        border-radius: 50%;
    }

    .yrobot {
        background-color: white
    }
    .robot {
        position: absolute;
        width: 2.6%;
        height: 4%;
        background-color: yellow;
        border-radius: 50%;
    }

    .robot.yellow { background: yellow; }
    .robot.blue   { background: blue; } 
    .dot{
        position: absolute;
        width: 40%; /* largura do ponto */
        height: 45%; /* altura do ponto */
        background-color: black; /* cor do ponto */
        border-radius: 50%; /* torna o ponto circular */
        left: 0px; /* posição horizontal do ponto dentro da div container */
        top: 5px; /* posição vertical do ponto dentro da div container */
    }

    .ball {
        position: absolute;
        width: 1.8%;
        height: 2.8%;
        background-color: orange;
        border-radius: 50%;
    }
    
    .field-wrapper {
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
        aspect-ratio: 2 / 1;
        position: relative;
        height: auto;
    }
    .field {
        display: flex;
        border: 5px solid grey;
        border-radius: 5px;
        width: 100%;
        height: 100%;
        margin: 0 auto;
        aspect-ratio: 1.375; /* 5500 / 4000 */
        position: relative;
        background-color: #008000; /* Cor padrão */
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        float: none;
        transition: background-color 0.3s ease, 
        background-image 0.3s ease;
    }
    .field.SSL-EL {
        background-color: #008000;
        background-image: none;
        aspect-ratio: 1.375;
    }

    .field.SSL {
        background-color: #008000;
        background-size: cover;
        aspect-ratio: 1.405405405;
    }

    .field.treino {
        background-color: #535353;
        background-size: cover;
        aspect-ratio: 1.15037593;
    }
    .linha-centro.horizontal {
        position: absolute;
        height: 2px;
        width: 81.82%; /* 4500 / 5500 */
        background-color: white;
        top: 50%;
        left: 9.09%; /* (1 - 0.8182) / 2 */
        transform: translateY(-50%);
    }

    .linha-centro.vertical {
        position: absolute;
        width: 2px; /* 2 / 5500 */
        height: 75%;
        background-color: white;
        left: 50%;
        top: 12.5%;
        transform: translateX(-50%);
    }
    .ret-ext {
        position: absolute;
        border: 2px solid white; 
        background-color: transparent;
        width: 81.82%; 
        height: 75%; 
        top: 12.5%; 
        left: 9.09%;
        box-sizing: border-box;
    }

    .gol-esquerdo, .gol-direito {
        position: absolute;
        width: 5.82%;
        height: 20.00%;
        background-color: transparent;
        border: 3px solid rgb(73, 38, 24);
        top: 50%;
        transform: translateY(-50%);
        box-sizing: border-box;
    }

    .gol-esquerdo {
        left: 3.55%;
        border-right: 2px solid white;
    }

    .gol-direito {
        right: 3.55%;
        border-left: 2px solid white;
    }

    .circulo-central {
        position: absolute;
        width: 15%;
        height: 25%;
        border: 2px solid white;
        background-color: transparent;
        border-radius: 50%;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        box-sizing: border-box;
    }

    .area-esquerda, .area-direita {
        position: absolute;
        width: 8.4375%;
        height: 36.36%;
        border: 2px solid white;
        top: 50%;
        transform: translateY(-50%);
        box-sizing: border-box;
    }

    .area-esquerda {
        left: 9.10%;
    }

    .area-direita {
        right: 9.10%;
    }

    .field.SSL .linha-centro.horizontal {
        width: 86.53%;
        left: 7%;
    }
    .field.SSL .linha-centro.vertical {
        height: 81.081%;
        top: 9.5%;
    }
    .field.SSL .ret-ext {
        width: 86.53%;
        height: 81.081%;
        border: 2px solid white;
        top: 9.5%;
        left: 7%;
    }
    .field.SSL .gol-esquerdo, .field.SSL .gol-direito {
        width: 5%;
        height: 13.51%;
    }
    .field.SSL .gol-esquerdo {
        left: 2.15%;
    }
    .field.SSL .gol-direito {
        right: 1.75%;
    }
    .field.SSL .circulo-central {
        width: 12%;
        height: 20%;
    }
    .field.SSL .area-esquerda, .field.SSL .area-direita {
        width: 9.61%;
        height: 27.027%;
    }
    .field.SSL .area-esquerda {
        left: 7%;
    }
    .field.SSL .area-direita {
        right: 6.5%;
    }
    .field.treino .linha-centro.horizontal {
        width: 70%;
        left: 15%;
    }
    .field.treino .linha-centro.vertical {
        height: 60%;
        top: 20%;
    }
    .field.treino .ret-ext {
        width: 70%;
        height: 60%;
        top: 20%;
        left: 15%;
    }
    .field.treino .gol-direito {
        width: 6%;
        height: 15%;
        right: 9.20%;
    }
    .field.treino .gol-esquerdo {
        width: 6%;
        height: 15%;
        left: 9.20%;
    }
    .field.treino .circulo-central {
        width: 10%;
        height: 15%;
    }
    .field.treino .area-esquerda, .field.treino .area-direita {
        width: 6.5%;
        height: 25%;
    }
    .field.treino .area-esquerda {
        left: 15%;
    }
    .field.treino .area-direita {
        right: 15%;
    }

    .texto {
        font-size: small;
    }

    .buttons {
        width: 93%;
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        padding-right: 22px;
    }

    .button-side {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        margin-right: 20px;
    }

    .texto-button {
        text-align: top;
        color: #D2D1CB;
        margin-top: 15%;
        font-weight: bold;
    }

    .select-field {
        position: relative;
        top: 20%;
        background-color: #353C6B;
        color: white;
        border-color: transparent;
        height: 80%;
        border-radius: 5px;
        padding: 4px 10px;
        font-size: 14px;

    }

</style>