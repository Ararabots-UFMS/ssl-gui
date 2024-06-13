<script lang="ts">
    import {position} from '@/socket'
    import {socket} from '@/socket'

    export default {
        name: 'Arena',
        data() {
            return {
                position: position,
                msg: "POR FAVOR FUNCIONA VEI"
            }
        },
        methods: {
            sendMessage() {
                console.log(this.msg);
                socket.emit('message', this.msg);
            }
        },
    }
</script>

<template>
    <div class="conteudo">
        <div class="field">
            <div class="robot" :style="{top: '10px', left: position.x+'px', transform: 'rotate(2rad)'}">
                <div class="dot">
                </div>
            </div>
        </div>
    
        <div class="texto">
            Coordinates: ({{position.x}}, {{position.y}}, {{ position.angle }})
        </div>
    
        <button @click="sendMessage">Send Message</button>
    </div>
</template>

<style>
    .yrobot {
        background-color: white
    }

    .conteudo {
        position: fixed;
        width: 400px; /* Largura fixa */
        height: 600px; /* Altura fixa */
    }

    .field {
        width: 100px;
        height: 100px;
        background-color: black;
        position: relative;
        margin-top: 15px;
    }

    .robot {
        position: absolute;
        width: 26px;
        height: 26px;
        background-color: yellow;
        border-radius: 50%;
    }

    .dot{
        position: absolute;
        width: 6px; /* largura do ponto */
        height: 6px; /* altura do ponto */
        background-color: black; /* cor do ponto */
        border-radius: 50%; /* torna o ponto circular */
        left: 0px; /* posição horizontal do ponto dentro da div container */
        top: 10px; /* posição vertical do ponto dentro da div container */
    }

    .texto {
        font-size: small;
    }
</style>
