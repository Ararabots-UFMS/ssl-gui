<script lang="ts">
    import {position} from '@/socket'
    import {socket} from '@/socket'

    export default {
        name: 'Arena',
        data() {
            return {
                position: position,
                side: true,
                teamColor: true
            }
        },
        methods: {
            changeSide() {
                this.side = !this.side;
                socket.emit('fieldSide', this.side);
            },
            changeTeamColor() {
                this.teamColor = !this.teamColor;
                socket.emit('teamColor', this.teamColor);
            },
        },
    }
</script>

<template>
    <div class="components-field">
        <div class="buttons">
            <div class="button-side">
                <p class="texto-button">E</p>
                <label class="switch">
                    <input type="checkbox" @click="changeSide()">
                    <span class="slider2 round"></span>
                </label>
                <p class="texto-button">D</p>
            </div>
            <div>
                <label class="switch">
                    <input type="checkbox" @click="changeTeamColor()">
                    <span class="slider1 round"></span>
                </label>
            </div>
        </div>
        <div class="field">
            <div class="robot" :style="{top: position.y+'px', left: position.x+'px', transform: 'rotate('+position.angle+'rad)'}">
                <div class="dot">
            </div>
        </div>
        <div class="ball" :style="{top: '100px', left: '100px', transform: 'rotate(2rad)'}"></div>
    
        <!-- <div class="texto">
            Coordinates: ({{position.x}}, {{position.y}}, {{ position.angle }})
        </div>
    
        <button @click="sendMessage">Send Message</button> -->
    </div>
    </div>
</template>

<style>
    .components-field {
        margin-left: 10%;
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

    .yrobot {
        background-color: white
    }

    .field{
        display: flex;
        border: 5px solid grey;
        border-radius: 5px;
        /*width: 716px;
        height: 450px;*/
        width: 90%; 
        aspect-ratio: 1.575 / 1; /* Sets height to 50% of width */
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
        color: #D2D1CB;
        margin-top: 15%;
        font-weight: bold;
    }

</style>
