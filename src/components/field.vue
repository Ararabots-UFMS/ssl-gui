<script lang="ts">
    import {yellowRobots, blueRobots, balls} from '@/socket'
    import {socket} from '@/socket'

    const FIELD_W_MM = 5500;
    const FIELD_H_MM = 4000;


    export default {
        name: 'Arena',
        data() {
            return {
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
            updateScale() {
                const fieldEl = (this.$el as HTMLElement).querySelector(".field") as HTMLElement;
                if (!fieldEl) return;
                const { width, height } = fieldEl.getBoundingClientRect();
                this.fieldWidth = width;
                this.fieldHeight = height;
                this.scaleX = (width)  / FIELD_W_MM;
                this.scaleY = (height) / FIELD_H_MM;
                },
            mapX(x_mm: number): string {
                const robotWidth = this.fieldWidth * 0.026;
                return `${((FIELD_W_MM / 2 + x_mm) * this.scaleX) - robotWidth / 2}px`;
            },
            mapY(y_mm: number): string {
                const robotHeight = this.fieldHeight * 0.04;
                return `${((FIELD_H_MM / 2 - y_mm) * this.scaleY) - robotHeight / 2}px`;
            },
        },
        mounted() {
            // Carrega os estados salvos do localStorage
            this.side = JSON.parse(localStorage.getItem('side') || 'false');
            this.teamColor = JSON.parse(localStorage.getItem('teamColor') || 'false');
            this.mode = JSON.parse(localStorage.getItem('mode') || 'false');
            socket.emit('fieldMode', this.mode);
            socket.emit('fieldSide', this.side);
            socket.emit('teamColor', this.teamColor);
            
            this.$nextTick(this.updateScale);
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
                    <input type="checkbox" :checked="mode" @click="changeMode()">
                    <span class="slider3 round"></span>
                </label>
                <p class="texto-button">Real</p>
            </div>
            <div class="button-side">
                <p class="texto-button">E</p>
                <label class="switch">
                    <input type="checkbox" :checked="side" @click="changeSide()">
                    <span class="slider2 round"></span>
                </label>
                <p class="texto-button">D</p>
            </div>
            <div>
                <label class="switch">
                    <input type="checkbox" :checked="teamColor" @click="changeTeamColor()">
                    <span class="slider1 round"></span>
                </label>
            </div>
        </div>
        <div class="field">
            <!-- yellow robots -->
            <div
            v-for="r in yellowRobots"
            :key="`yellow-${r.id}`"
            class="robot yellow"
            :style="{
                top:    mapY(r.position_y),
                left:   mapX(r.position_x),
                transform: 'rotate(' + r.orientation + 'rad)'
            }"
            />

            <!-- blue robots -->
            <div
            v-for="r in blueRobots"
            :key="`blue-${r.id}`"
            class="robot blue"
            :style="{
                top:    mapY(r.position_y),
                left:   mapX(r.position_x),
                transform: 'rotate(' + r.orientation + 'rad)'
            }"
            />

            <!-- balls -->
            <div
            v-for="b in balls"
            :key="`ball-${b.id}`"
            class="ball"
            :style="{
                top:  mapY(b.position_y),
                left: mapX(b.position_x),
            }"
            />
        </div>
    
        <!-- <div class="texto">
            Coordinates: ({{position.x}}, {{position.y}}, {{ position.angle }})
        </div>
    
        <button @click="sendMessage">Send Message</button> -->
    </div>
</template>

<style>
    .components-field {
        width: 100%; /* Largura fixa */
        height: 55%; /* Altura fixa */
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

    .field{
        display: flex;
        border: 5px solid grey;
        border-radius: 5px;
        /*width: 716px;
        height: 450px;*/
        margin-left: 5%;
        width: 90%; 
        aspect-ratio: 1.575; /* Sets height to 50% of width */
        position: relative;
        background-image: url('../assets/campo.png');
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        float:left;
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

</style>
