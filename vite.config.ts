import { fileURLToPath, URL } from 'node:url'
import { spawn, type ChildProcess } from 'node:child_process'
import net from 'node:net'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// ============================================================================
//  Ponte do ararabots.sh, subida junto com a GUI
// ============================================================================
//
// POR QUE ISTO VIVE AQUI
// ----------------------
// O ararabots.sh precisa do HOST: chama docker, sobe o grSim, recria o container
// do arbitro. O apiNode da GUI roda DENTRO do container 'vice' e nao alcanca
// nada disso. Mas o servidor de desenvolvimento do Vite roda no host - entao e
// ELE quem pode iniciar a ponte, e e o que este plugin faz.
//
// Resultado: 'npm run dev' sobe a GUI e a ponte juntas. Nao e preciso abrir um
// segundo terminal nem lembrar de nenhum comando extra.
//
// O QUE ELE NAO FAZ
// -----------------
// - nao sobe o ambiente de teste (container, grSim, arbitro). Isso continua
//   sendo o botao 'Preparar' do painel, que e o mesmo './ararabots.sh preparar';
// - nao reinicia a ponte se ela JA estiver no ar (porta ocupada): quem rodou
//   './ararabots.sh web' na mao continua no comando;
// - nao roda no 'npm run build' (apply: 'serve'), porque ali nao ha servidor.
const PORTA_PONTE = 8099
// A ponte e o painel moram NESTE repositorio (painel/), porque sao interface.
// A ferramenta continua inteira em ssl-VICE/docs/ - a ponte so a executa.
const CAMINHO_PONTE = fileURLToPath(new URL('./painel/ararabots_web.py', import.meta.url))

function portaOcupada(porta: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.connect({ host: '127.0.0.1', port: porta })
    const fim = (r: boolean) => { s.destroy(); resolve(r) }
    s.setTimeout(700)
    s.on('connect', () => fim(true))
    s.on('timeout', () => fim(false))
    s.on('error', () => fim(false))
  })
}

function pontePlugin(): Plugin {
  let filho: ChildProcess | null = null

  const derrubar = () => {
    if (filho && !filho.killed) {
      const alvo = filho
      alvo.kill('SIGTERM')
      // se nao sair em 2 s, nao fica pendurado
      setTimeout(() => { if (!alvo.killed) alvo.kill('SIGKILL') }, 2000).unref?.()
      filho = null
    }
  }

  return {
    name: 'ararabots-ponte',
    apply: 'serve',
    async configureServer(server) {
      const marca = '\x1b[36m[ararabots]\x1b[0m'

      if (await portaOcupada(PORTA_PONTE)) {
        server.config.logger.info(
          `${marca} ponte já estava no ar em 127.0.0.1:${PORTA_PONTE} — reaproveitando`,
        )
        return
      }

      try {
        // --pai: a ponte vigia este processo e encerra sozinha se ele morrer,
        // inclusive num kill -9 do Vite, em que os 'on close' abaixo nao rodam.
        // Sem isso sobraria uma ponte orfa ocupando a porta, e o usuario teria
        // de matar na mao - com o agravante de que 'pkill -f ararabots_web.py'
        // casa com a propria linha de comando que o executa.
        filho = spawn('python3', [CAMINHO_PONTE, '--porta', String(PORTA_PONTE),
                                  '--pai', String(process.pid)], {
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      } catch (e) {
        server.config.logger.warn(
          `${marca} não consegui iniciar a ponte (${CAMINHO_PONTE}): ${e}`,
        )
        return
      }

      filho.on('error', (e) => {
        server.config.logger.warn(`${marca} ponte falhou: ${e.message}`)
        server.config.logger.warn(
          `${marca} suba na mão:  python3 painel/ararabots_web.py`,
        )
        filho = null
      })
      filho.on('exit', (codigo) => {
        if (codigo) {
          server.config.logger.warn(`${marca} ponte encerrou com código ${codigo}`)
        }
        filho = null
      })
      // A saida da ponte vai para o mesmo terminal do 'npm run dev', prefixada,
      // para nao se confundir com os logs do Vite.
      const repassar = (fluxo: NodeJS.ReadableStream | null) => {
        fluxo?.on('data', (b: Buffer) => {
          const txt = b.toString().trimEnd()
          if (txt) server.config.logger.info(`${marca} ${txt.replace(/\n/g, `\n${marca} `)}`)
        })
      }
      repassar(filho.stdout)
      repassar(filho.stderr)

      server.config.logger.info(
        `${marca} ponte subindo em 127.0.0.1:${PORTA_PONTE} (aba "Tool" da GUI)`,
      )

      server.httpServer?.on('close', derrubar)
      process.once('exit', derrubar)
      process.once('SIGINT', derrubar)
      process.once('SIGTERM', derrubar)
    },
    closeBundle: derrubar,
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    pontePlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // O painel passa a ser servido na MESMA origem da GUI: sem CORS, e o
      // EventSource da saida ao vivo atravessa o proxy normalmente.
      '/ponte': {
        target: `http://127.0.0.1:${PORTA_PONTE}`,
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/ponte/, ''),
      },
    },
  },
})
