<template>
    <div class="menu-container">
        <div class="menu-buttons">
            <div
                v-for="(button, index) in buttons"
                :key="index"
                class="menu-button"
                :class="{ 'selected': selectedButton === index }"
                @click="selectButton(index)"
            >
                <p class="menu-button-text">{{ button }} Screen</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            buttons: ['Main', 'Config'], // Índices dos botões
            selectedButton: null // Índice do botão selecionado
        };
    },
    mounted() {
        // Colocar o primeiro botão como selecionado inicialmente
        this.selectedButton = 0;
    },
    methods: {
        selectButton(index) {
            this.selectedButton = index;
        }
    }
};
</script>


<style>
    .menu-container {
        top: 0;
        right: 0;
        height: 100%;
        width: 4%;
        gap: 5px;
    }

    .menu-buttons {
        top: 0;
        right: 0;
        height: 100%;
        width: 80%;
        display: flex;
        flex-direction: column; /* Empilha os botões verticalmente */
    }

    .menu-button {
        width: 100%;
        height: 100%;
        background-color: #D2D1CB;
        color: #252838;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center; /* Centraliza o texto verticalmente */
        justify-content: center; /* Centraliza o texto horizontalmente */
    }

    .menu-button-text {
        writing-mode: vertical-lr; /* Texto na vertical, da esquerda para a direita */
        transform: rotate(180deg); /* Rotaciona o texto 180 graus */
    }

    .selected {
        background-color: #252838; /* Cor de fundo quando selecionado */
        color: #D2D1CB;
    }

</style>