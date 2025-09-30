<script>
    import {socket, visionOutput, refereeOutput, communicationOutput, visionStatus, refereeStatus, communicationStatus} from '@/socket'
    import { ref } from 'vue'

    export default {
        data() {
            return {
                selectedTab: 'juiz', // Default tab
                visionRef: ref(visionOutput),
                refereeRef: ref(refereeOutput),
                communicationRef: ref(communicationOutput),
            };
        },
        computed: {
            visionStatus() {
                return visionStatus.status ? 'status-line active-line-color' : 'status-line inactive-line-color';
            },
            refereeStatus() {
                return refereeStatus.status ? 'status-line active-line-color' : 'status-line inactive-line-color';
            },
            communicationStatus() {
                return communicationStatus.status ? 'status-line active-line-color' : 'status-line inactive-line-color';
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
            refereeRef: {
                handler() {
                    this.printText(refereeOutput.message.line, 'juiz');
                },
                deep: true,
            },
            communicationRef: {
                handler() {
                    this.printText(communicationOutput.message.line, 'comunicacao');
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
                <div :class="refereeStatus"></div>  
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
                <div :class="communicationStatus"></div> 
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
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        gap: 10px;
        margin-top: 20px;
    }

    .terminal-buttons-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        width: 100%;
        margin-bottom: 10px;
    }

    .terminal-buttons {
        flex: 1 1 30%;
        min-width: 120px;
        max-width: 250px;
        height: 8vw;
        max-height: 50px;
        background-color: #383f6b;
        color: #d2d1cb;
        border-radius: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .icon-container {
        width: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .icons {
        height: 60%;
        width: 80%;
    }
    .terminal-button-text {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: 1.2vw;
    }
    .status-line {
        width: 6px;
        height: 100%;
        margin-right: 4px;
    }
    .inactive-line-color {
        background-color: #ff0000;
    }
    .active-line-color {
        background-color: #00ff00; 
    }
    .terminal {
        background-color: #383f6b;
        border-radius: 10px;
        width: 90%;
        height: 250px; 
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .tabs {
        display: flex;
        justify-content: space-between;
        background-color: #252838;
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
        background-color: #D2D1CB;
        color: #252838;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .tab-selected {
        background-color: #383f6b;
        color: white;
    }
    .tab:first-child {
        border-top-left-radius: 10px;
    }
    .tab:last-child {
        border-top-right-radius: 10px; 
    }
    .messages {
        flex: 1;
        display: flex;
        flex-direction: column-reverse;
        overflow-y: auto;
        margin: 8px; 
    }
    .line {
        color: #D2D1CB;
        white-space: pre-wrap; 
        font-weight: bold;
        padding-left: 1%;
    }
    .tab-button{
        cursor: pointer;
        color: #d2d1cb;
    }
    @media screen and (max-width: 768px) {
        .terminal-buttons {
            width: 80%;
            height: 50px;
        }
    }
</style>