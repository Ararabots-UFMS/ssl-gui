<template>
  <div class="play" @click="playButton()" >
    <button v-bind:class="{'red': clicked, 'green': !clicked}">
      {{ buttonText }}
    </button>
  </div>
</template>

<script>
    import {socket} from '@/socket'

    export default {
        data() {
            return {
                selectedTab: 'play', // Default tab
                clicked: false, // Variável para rastrear o estado do botão
                buttonText: 'JOGAR', // Texto inicial do botão
                //visionRef: ref(visionOutput),
            };
        },
        /*computed: {
            visionStatus() {
                return visionStatus.status ? 'status-line active-line-color' : 'status-line inactive-line-color';
            },
        },*/
        methods: {
            playButton() {
                this.clicked = !this.clicked; // Alterna o estado do botão
                this.buttonText = this.clicked ? 'PARAR' : 'JOGAR'; // Alterna o texto
                socket.emit('playButton',this.buttonText);
                console.log('playButton',this.buttonText);
            },
            /*showTab (tabName) {
                this.selectedTab = tabName;
            },
            printText (message, tabName) {
                const terminal = document.getElementById(tabName);
                // Remove a classe especial da última mensagem anterior
                const lastLine = terminal.querySelector('.new-line');
                if (lastLine) {
                    lastLine.style.color = '#D2D1CB';
                    lastLine.style.backgroundColor = '#383f6b';
                }

                const newLine = document.createElement('div');
                newLine.className = 'new-line';
                newLine.textContent = message;
                newLine.style.color = '#000000';
                newLine.style.backgroundColor = '#D2D1CB';
                newLine.style.borderBottomLeftRadius = '5px';
                newLine.style.borderBottomRightRadius = '5px';
                newLine.style.fontWeight = 'bold';
                newLine.style.paddingLeft = '1%';
                terminal.prepend(newLine); // Adiciona a nova linha no início do conteúdo
            },*/
        },
        /*watch: {
            visionRef: {
                handler() {
                    this.printText(visionOutput.message.line, 'visao');
                },
                deep: true,
            },

        },*/
    };
</script>

<style scoped>
.play {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
button {
    cursor: pointer;
    width: 30%;
    height:45%;
    color: #D2D1CB;
    font-size: 2rem;
    border-radius: 10px;
    border: none;
    font-size: 200%;
}
.green {
    background-color: green;
}
.red {
    background-color: red;
}
</style>