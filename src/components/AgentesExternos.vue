@import("https://img.icons8.com/ios/50/foul.png"); 
@import("https://img.icons8.com/ios/50/wifi--v1.png"); 
@import("https://img.icons8.com/ios/50/visible--v1.png"); 

<template>
    <div class="container">
        <div class="buttons-container">
            <div class="buttons" onclick="showTab('juiz')">
                <div class="line-color"></div>  
                <span class="button-text">Juiz</span></div>
            <div class="buttons" onclick="showTab('visao')">
                <div class="line-color"></div> 
                <span class="button-text">Visão</span></div>
            <div class="buttons" onclick="showTab('comunicacao')">
                <div class="line-color"></div> 
                <span class="button-text">Comunicação</span></div>
        </div>
        <div class="terminal">
                <div class="tabs">
                    <div class="juizTab" @click="showTab('juiz')" :class="{ 'tab-selected':
                        selectedTab === 'juiz' }">Juiz</div>
                    <div class="visaoTab" @click="showTab('visao')" :class="{ 'tab-selected':
                        selectedTab === 'visao'}">Visão</div>
                    <div class="comunicacaoTab" @click="showTab('comunicacao')" :class="{ 'tab-selected':
                        selectedTab === 'comunicacao'}">Comunicação</div>
                </div>
            <div class="messages" id="juiz" v-show="selectedTab === 'juiz'">
                <div class="line">Welcome to the Juiz tab!</div>
                <div class="button" @click="updateMessage('juiz')">Update message</div>
            </div>
            <div class="messages" id="visao" v-show="selectedTab === 'visao'">
                <div class="line">Welcome to the Visão tab!</div>
                <div class="button" @click="updateMessage('visao')">Update message</div>
            </div>
            <div class="messages" id="comunicacao" v-show="selectedTab === 'comunicacao'">
                <div class="line">Welcome to the Comunicação tab!</div>
                <div class="button" @click="updateMessage('comunicacao')">Update message</div>
            </div>
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
                newLine.textContent = `Button clicked ${clickCounts[tabName]} times`;
                terminal.prepend(newLine); // Adiciona a nova linha no início do conteúdo
            },
            updateMessage (tabName) {
                clickCounts[tabName]++;
                printText(tabName);
            }
        },
    };
</script>

<style scoped>
    .container {
        display: flex;
        position: fixed;
        bottom: 230px;
        right: 20px; 
    }
    .terminal {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #383f6b;
        border-radius: 10px;
        width: 700px; /* Largura fixa */
        height: 200px; /* Altura fixa */
        display: flex;
        flex-direction: column;
    }
    .tabs {
        display: flex;
        justify-content: space-between;
        margin: 0; /* Remove qualquer margem */
        background-color: white; /* Mesma cor do terminal para continuidade visual */
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        color: black;
        height: 30px
    }
    .tabs > div {
        flex: 1;
        text-align: center;
        cursor: pointer;
        font-weight: bold;
    }
    .tab-selected {
        background-color: #252838;
        color: white;
    }
    .tab {
        cursor: pointer;
        padding: 5px 34px;
        background-color: white;
        color: #252838;
        margin-right: 0px;
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
        padding: 10px; /* Adiciona padding para o conteúdo */
    }
    .line {
        color: #d2d1cb;
        margin: 0;
        white-space: pre-wrap; /* Mantém espaços e quebras de linha */
    }
    .last-line {
        background-color: #d2d1cb; /* Fundo claro para a última mensagem */
        color: #252838;
        margin: 0; 
        padding: 0px 10px; /* Adiciona padding para a última linha */
        border-bottom-left-radius: 5px; /* Adiciona borda arredondada no canto inferior esquerdo */
        border-bottom-right-radius: 5px; /* Adiciona borda arredondada no canto inferior direito */
    }
    .button {
        cursor: pointer;
        color: #d2d1cb;
        padding: 0px 0px; /* Espaçamento interno do botão */
    }
    .buttons-container {           
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px; /* Adiciona margem abaixo dos botões */
    }
    .buttons {
        cursor: pointer;
        padding: 10px 50px;
        background-color: #383f6b;
        color: #d2d1cb;
        border-radius: 10px;
        position: relative;
    }
    .buttons:not(:last-child) {
        margin-right: 108px;
    }
    .button-text {
        flex-grow: 1; /* Faz o texto ocupar todo o espaço restante */
        text-align: right; /* Alinha o texto à direita */
        margin-left: 10px;
    }
    .line-color {
        width: 5px; /* Largura da linha */
        height: 44px; /* Altura igual à dos botões */
        background-color: #00ff00; /* Cor da linha */
        position: absolute; /* Posiciona a linha dentro do botão */
        top: 0; /* Alinha a linha ao topo */
    }
</style>