<script>
import {position} from '@/socket'
import {socket} from '@/socket'


const msg = "POR FAVOR FUNCIONA VEI"
console.log(msg);
socket.emit('message', msg)

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
    <div class="field">
        <div class="robot" :style="{top: position.y+'px', left: position.x+'px' }">
        </div>
    </div>

    <div class="texto">
        Coordinates: ({{position.x}}, {{position.y}})
    </div>

    <button @click="sendMessage">Send Message</button>
</template>

<style>
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
