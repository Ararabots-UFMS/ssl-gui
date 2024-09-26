<script>
    import {socket, visionOutput, visionStatus} from '@/socket'
    import { ref } from 'vue'

    export default {
        data() {
            return {
                selectedTab: 'juiz', // Default tab
                visionRef: ref(visionOutput),
            };
        },
        computed: {
            visionStatus() {
                return visionStatus.status ? 'status-line active-line-color' : 'status-line inactive-line-color';
            },
        },
        methods: {
            refereeButton() {
                socket.emit('refereeButton');
                console.log('refereeButton');
            },
            visionButton() {
                socket.emit('visionButton');
                console.log('visionButton');
            },
            communicationButton() {
                socket.emit('communicationButton');
                console.log('communicationButton');
            },
            showTab (tabName) {
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
    <div class="terminal-components">
        <div class="terminal-buttons-container">
            <div class="terminal-buttons" @click="refereeButton()">
                <div class="icon-container">
                    <img class="icons" src="https://img.icons8.com/ios/50/foul.png" alt="foul"/>
                </div>
                <div class="status-line inactive-line-color"></div>  
                <span class="terminal-button-text">Juiz</span>
            </div>
            <div class="terminal-buttons" @click="visionButton()">
                <div class="icon-container">
                    <img class="icons" src="https://img.icons8.com/ios/50/visible--v1.png" alt="visible--v1"/>
                </div>
                <div :class="visionStatus"></div> 
                <span class="terminal-button-text">Visão</span>
            </div>
            <div class="terminal-buttons" @click="communicationButton()">
                <div class="icon-container">
                    <img class="icons" src="https://img.icons8.com/ios/50/wifi--v1.png" alt="wifi--v1"/>
                </div>
                <div class="status-line inactive-line-color"></div> 
                <span class="terminal-button-text">Comunicação</span>
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
            </div>
            <div class="messages" id="visao" v-show="selectedTab === 'visao'">
                <div class="line">Welcome to the Visão tab!</div>
            </div>
            <div class="messages" id="comunicacao" v-show="selectedTab === 'comunicacao'">
                <div class="line">Welcome to the Comunicação tab!</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .terminal-components {           
        margin-left: 10%;
        width: 100%;
        height: 50%;
    }
    .terminal-buttons-container {           
        display: flex;
        width: 90%;
        height: 15%;
        justify-content: space-between;
        margin-top: 9%;
        margin-bottom: 2%;

    }
    .terminal-buttons {
        cursor: pointer;
        width: 25%;
        height: 75%;
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
    .terminal-button-text {
        width:100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
    }
    .status-line{
        width: 5%; /* Largura da linha */
        height: 100%; /* Altura igual à dos botões */
    }
    .inactive-line-color {
        background-color: #ff0000;
    }
    .active-line-color {
        background-color: #00ff00; /* Cor da linha */
    }
    .terminal {
        background-color: #383f6b;
        border-radius: 10px;
        width: 90%; 
        height: 50%; 
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
        height: 35px;
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
        color: #D2D1CB;
        white-space: pre-wrap; /* Mantém espaços e quebras de linha */
        font-weight: bold;
        padding-left: 1%;
    }
    .tab-button{
        cursor: pointer;
        color: #d2d1cb;
    }
</style>