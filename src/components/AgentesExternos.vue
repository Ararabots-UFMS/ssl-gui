<script>
    import {socket, visionOutput} from '@/socket'
    import { ref } from 'vue'

    export default {
        data() {
            return {
                selectedTab: 'juiz', // Default tab
                visionRef: ref(visionOutput),
                visionRunnig: false,
            };
        },
        methods: {
            refereeButton() {
                socket.emit('refereeButton');
            },
            visionButton() {
                socket.emit('visionButton');
            },
            communicationButton() {
                socket.emit('communicationButton');
            },
            showTab (tabName) {
                this.selectedTab = tabName;
            },
            printText (message, tabName) {
                const terminal = document.getElementById(tabName);
                // Remove a classe especial da última mensagem anterior
                const lastLine = terminal.querySelector('.last-line');
                if (lastLine) {
                    lastLine.classList.remove('last-line');
                }

                const newLine = document.createElement('div');
                newLine.className = 'line last-line';
                newLine.textContent = message;
                terminal.prepend(newLine); // Adiciona a nova linha no início do conteúdo
            },
        },
        watch: {
            visionRef: {
                handler() {
                    this.printText(visionOutput.message.line, 'visao');
                },
                deep: true,
            },
        },
    };

</script>

<template>
    <div class="buttons-container">
        <div class="buttons" @click="refereeButton()">
            <div class="icon-container">
                <img class="icons" src="https://img.icons8.com/ios/50/foul.png" alt="foul"/>
            </div>
            <div class="line-color"></div>  
            <span class="button-text">Juiz</span>
        </div>
        <div class="buttons" @click="visionButton()">
            <div class="icon-container">
                <img class="icons" src="https://img.icons8.com/ios/50/visible--v1.png" alt="visible--v1"/>
            </div>
            <div class="line-color"></div> 
            <span class="button-text">Visão</span>
        </div>
        <div class="buttons" @click="communicationButton()">
            <div class="icon-container">
                <img class="icons" src="https://img.icons8.com/ios/50/wifi--v1.png" alt="wifi--v1"/>
            </div>
            <div class="line-color"></div> 
            <span class="button-text">Comunicação</span>
        </div>
    </div>
    <div class="terminal">
            <div class="tabs">
                <div class="tab juizTab" @click="showTab('juiz')" :class="{ 'tab-selected':
                    selectedTab === 'juiz' }">Juiz</div>
                <div class="tab visaoTab" @click="showTab('visao')" :class="{ 'tab-selected':
                    selectedTab === 'visao'}">Visão</div>
                <div class="tab comunicacaoTab" @click="showTab('comunicacao')" :class="{ 'tab-selected':
                    selectedTab === 'comunicacao'}">Comunicação</div>
            </div>
        <div class="messages" id="juiz" v-show="selectedTab === 'juiz'">
            <div class="line">Welcome to the Juiz tab!</div>
            <div class="tab-button" @click="printText('teste','juiz')">Update message</div>
        </div>
        <div class="messages" id="visao" v-show="selectedTab === 'visao'">
            <div class="line">Welcome to the Visão tab!</div>
            <div class="tab-button" @click="printText('teste','juiz')">Update message</div>
        </div>
        <div class="messages" id="comunicacao" v-show="selectedTab === 'comunicacao'">
            <div class="line">Welcome to the Comunicação tab!</div>
            <div class="tab-button" @click="printText('teste','comunicacao')">Update message</div>
        </div>
    </div>
</template>

<style scoped>
    .buttons-container {           
        display: flex;
        width: 90%;
        height: 5%;
        justify-content: space-between;
        margin-top: 2%;
        margin-bottom: 2%;
    }
    .buttons {
        cursor: pointer;
        width: 25%;
        height: 100%;
        background-color: #383f6b;
        color: #d2d1cb;
        border-radius: 10px;
        display:flex;
        flex-direction: row;
    }
    .icon-container {
        width: 30%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .icons {
        height: 80%;
    }
    .button-text {
        width:100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
    }
    .line-color {
        width: 5%; /* Largura da linha */
        height: 100%; /* Altura igual à dos botões */
        background-color: #00ff00; /* Cor da linha */
    }
    .terminal {
        background-color: #383f6b;
        border-radius: 10px;
        width: 90%; 
        height: 20%; 
        display: flex;
        flex-direction: column;
    }
    .tabs {
        display: flex;
        justify-content: space-between;
        background-color: #252838; /* Mesma cor do terminal para continuidade visual */
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        color: black;
        height: 19%;
    }
    .tabs > div {
        flex: 1;
        text-align: center;
        cursor: pointer;
        font-weight: bold;
    }
    .tab {
        cursor: pointer;
        width: 33%;
        height: 100%;
        background-color: #D2D1CB;
        color: #252838;
    }
    .tab-selected {
        background-color: #383f6b;
        color: white;
    }
    .tab:first-child {
        border-top-left-radius: 10px; /* Apenas o primeiro botão terá a borda arredondada no canto superior esquerdo */
    }
    .tab:last-child {
        border-top-right-radius: 10px; /* Apenas o último botão terá a borda arredondada no canto superior direito */
    }
    .messages {
        flex: 1;
        display: flex;
        flex-direction: column-reverse; /* Adiciona novos elementos de baixo para cima */
        overflow-y: auto;
        margin: 1%; /* Adiciona padding para o conteúdo */
    }
    .line {
        color: #d2d1cb;
        white-space: pre-wrap; /* Mantém espaços e quebras de linha */
    }
    .last-line {
        background-color: white; /* Fundo claro para a última mensagem */
        color: black;
        border-bottom-left-radius: 5px; /* Adiciona borda arredondada no canto inferior esquerdo */
        border-bottom-right-radius: 5px; /* Adiciona borda arredondada no canto inferior direito */
    }
    .tab-button{
        cursor: pointer;
        color: #d2d1cb;
    }
</style>