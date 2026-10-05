<script>
// Aba "Tool": o painel do ararabots.sh dentro da GUI.
//
// POR QUE ESTE COMPONENTE E FINO
// ------------------------------
// O painel inteiro (HTML, CSS e JS) mora em ssl-VICE/docs/ararabots_painel.html
// e e servido pela ponte. Esta aba o exibe atraves do proxy /ponte do Vite, na
// mesma origem da GUI.
//
// A alternativa seria reescrever a mesma tela em Vue. Seriam DUAS interfaces
// para a mesma ferramenta, divergindo a cada mudanca - exatamente o defeito que
// este projeto ja pagou com a receita de montagem em tres copias. Uma tela so.
//
// Quem sobe a ponte: o plugin 'ararabots-ponte' do vite.config.ts, junto com o
// 'npm run dev'. Se ela nao estiver no ar (GUI servida sem o Vite, ou o script
// faltando), esta aba explica o comando manual e reconecta sozinha.
const PONTE = '/ponte';

export default {
  name: 'ferramenta',
  data() {
    return {
      viva: false,
      verificando: true,
      tentativas: 0,
      relogio: null,
      url: PONTE + '/',
    };
  },
  mounted() {
    this.verificar();
    this.relogio = setInterval(this.verificar, 2500);
  },
  unmounted() {
    if (this.relogio) clearInterval(this.relogio);
  },
  methods: {
    async verificar() {
      try {
        const r = await fetch(PONTE + '/api/estado', { cache: 'no-store' });
        if (!r.ok) throw new Error('status ' + r.status);
        await r.json();
        if (!this.viva) this.viva = true;   // o iframe monta uma vez
      } catch (e) {
        this.viva = false;
        this.tentativas += 1;
      } finally {
        this.verificando = false;
      }
    },
  },
};
</script>

<template>
  <div class="ferramenta">
    <iframe v-if="viva" :src="url" title="Ferramenta Ararabots"></iframe>

    <div v-else class="espera">
      <h2 v-if="verificando">procurando a ponte…</h2>
      <template v-else>
        <h2>A ponte da ferramenta não está no ar</h2>
        <p>
          Esta aba executa o <code>ararabots.sh</code>, e o script roda no
          <b>host</b> — não dentro do container. Normalmente o
          <code>npm run dev</code> sobe a ponte junto com a GUI; se ela não
          subiu, veja o terminal da GUI por uma linha
          <code>[ararabots]</code> com o motivo.
        </p>
        <p>Para subir na mão, em outro terminal:</p>
        <pre>cd Arara_Bots/ssl-VICE/docs
./ararabots.sh web</pre>
        <p class="nota">
          Reconectando sozinha · {{ tentativas }} tentativa<span v-if="tentativas !== 1">s</span>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ferramenta {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: #1f2230;
}
iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
.espera {
  margin: auto;
  max-width: 620px;
  padding: 32px 36px;
  color: #e7e6e1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.6;
}
.espera h2 { margin: 0 0 14px; font-size: 19px; }
.espera p { margin: 0 0 12px; color: #9aa0b5; }
.espera b { color: #e7e6e1; }
.espera code { color: #e2a33c; font-family: ui-monospace, Menlo, monospace; }
.espera pre {
  margin: 0 0 14px;
  padding: 13px 16px;
  background: #282c3e;
  border: 1px solid #3c4257;
  border-radius: 8px;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 13.5px;
  color: #cfd4e4;
}
.espera .nota { font-size: 13px; color: #767c92; }
</style>
