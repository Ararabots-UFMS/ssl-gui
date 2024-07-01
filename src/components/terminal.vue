<template>
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
            <div class="tab-button" @click="printText('juiz')">Update message</div>
        </div>
        <div class="messages" id="visao" v-show="selectedTab === 'visao'">
            <div class="line">Welcome to the Visão tab!</div>
            <div class="tab-button" @click="printText('visao')">Update message</div>
        </div>
        <div class="messages" id="comunicacao" v-show="selectedTab === 'comunicacao'">
            <div class="line">Welcome to the Comunicação tab!</div>
            <div class="tab-button" @click="printText('comunicacao')">Update message</div>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
        return {
            selectedTab: 'juiz', // Default tab
        };
        },
        methods: {
            showTab (tabName) {
                this.selectedTab = tabName;
            },
            printText (tabName) {
                const terminal = document.getElementById(tabName);
                // Remove a classe especial da última mensagem anterior
                const lastLine = terminal.querySelector('.last-line');
                if (lastLine) {
                    lastLine.classList.remove('last-line');
                }

                const newLine = document.createElement('div');
                newLine.className = 'line last-line';
                newLine.textContent = `Button clicked times`;
                terminal.prepend(newLine); // Adiciona a nova linha no início do conteúdo
            }
        },
    };
</script>

<style scoped>
    .terminal {
        background-color: #383f6b;
        border-radius: 10px;
        width: 90%; /* Largura fixa */
        height: 20%; /* Altura fixa */
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