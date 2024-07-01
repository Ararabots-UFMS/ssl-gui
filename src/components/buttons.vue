<template>
    <div class="buttons-container">
        <div class="buttons" onclick="showTab('juiz')">
            <div class="icon-container">
                <img class="icons" src="https://img.icons8.com/ios/50/foul.png" alt="foul"/>
            </div>
            <div class="line-color"></div>  
            <span class="button-text">Juiz</span>
        </div>
        <div class="buttons" onclick="showTab('visao')">
            <div class="icon-container">
                <img class="icons" src="https://img.icons8.com/ios/50/visible--v1.png" alt="visible--v1"/>
            </div>
            <div class="line-color"></div> 
            <span class="button-text">Visão</span>
        </div>
        <div class="buttons" onclick="showTab('comunicacao')">
            <div class="icon-container">
                <img class="icons" src="https://img.icons8.com/ios/50/wifi--v1.png" alt="wifi--v1"/>
            </div>
            <div class="line-color"></div> 
            <span class="button-text">Comunicação</span>
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
</style>