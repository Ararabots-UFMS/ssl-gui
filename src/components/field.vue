<script>
import {position} from '@/socket'
import {socket} from '@/socket'

export default {
  data() {
    return {
        position: position,
        msg: "POR FAVOR FUNCIONA VEI"
    }
  },
  methods: {
    sendMessage() {
        console.log(msg);
        socket.emit('message', msg);
    }
  },
}
</script>

<template>
    <div class="conteudo">
        <div class="field">
            <div class="robot" :style="{top: position.y+'px', left: position.x+'px', transform: 'rotate('+position.angle+'rad)'}">
            </div>
        </div>
    
        <div class="texto">
            Coordinates: ({{position.x}}, {{position.y}}, {{ position.angle }})
        </div>
    
        <button @click="sendMessage">Send Message</button>
    </div>
</template>

<style>
    .conteudo {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .field {
        width: 500px;
        height: 500px;
        background-color: black;
        position: relative;
        margin-top: 15px;
    }

    .robot {
        position: absolute;
        width: 25px;
        height: 25px;
        background-color: yellow;
    }

    .texto {
        font-size: small;
    }
</style>
