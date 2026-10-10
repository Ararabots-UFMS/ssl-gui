# Painel da ferramenta

Interface no navegador para o `ararabots.sh`. **Nada do que existia mudou de
comportamento:** o script continua funcionando igual no terminal, e o painel
apenas executa os mesmos subcomandos.

Esta pasta é a interface inteira, e vive **neste** repositório porque é
interface. A ferramenta continua inteira em `ssl-VICE/docs/`.

| arquivo | o que é |
|---|---|
| `index.html` | o painel — HTML, CSS e JS, sem build |
| `ararabots_web.py` | a ponte: serve o painel e executa o script, no host |
| `LEIAME.md` | este arquivo |

Mais dois pontos de ligação, fora desta pasta:

- `../src/components/ferramenta.vue` — a aba `Tool` da GUI, que exibe este mesmo
  `index.html` através do proxy `/ponte`;
- `../vite.config.ts` — o plugin `ararabots-ponte`, que sobe a ponte junto com o
  `npm run dev`;
- e em `ssl-VICE/docs/ararabots.sh`, **uma única** linha de ligação: o ramo
  `web)` do despachante, que chama a ponte daqui.

---

## 1. Como rodar

### Pela GUI — um comando só

```bash
npm run dev
```

(na primeira vez, `npm install` antes). Abra `http://localhost:5173` e clique em
**Tool Screen**, na coluna de abas à esquerda.

O `npm run dev` **sobe a ponte automaticamente** e a **derruba junto**. Se a
porta 8099 já estiver ocupada, ele reaproveita a ponte que estiver no ar em vez
de subir outra.

### Painel sozinho — sem npm, sem build

```bash
cd ../ssl-VICE/docs && ./ararabots.sh web
```

Abra `http://127.0.0.1:8099`. Para outra porta: `./ararabots.sh web 9000`.
`Ctrl-C` encerra.

Nos dois casos a ponte **não** sobe o ambiente de teste sozinha — quem faz isso
é o botão **Preparar ambiente**, que é o mesmo `./ararabots.sh preparar`.

### A ponte morre junto com quem a subiu

O plugin passa `--pai <pid>` para a ponte, e ela vigia esse processo: se o Vite
morrer — inclusive num `kill -9`, em que os *hooks* de encerramento não rodam —
a ponte encerra sozinha em até 2 s, interrompendo também qualquer lote em
andamento.

Isso existe para ninguém precisar matar processo à mão. E, principalmente,
porque o jeito óbvio de fazer isso é uma armadilha: `pkill -f ararabots_web.py`
casa com a **própria linha de comando que o executa** e mata o shell de quem
tentou — a mesma pegadinha registrada no `PROMPT_IA.md` §7. Se precisar mesmo
derrubar à mão, use a porta, que não tem esse problema:

```bash
fuser -k -n tcp 8099
```

---

## 2. Por que a ponte roda no host

O `ararabots.sh` precisa do **host**: chama `docker`, sobe o grSim, recria o
container do árbitro e edita o `~/.grsim.xml`.

O backend da GUI (`apiNode`, em `ssl-VICE/src/gui_interpreter/`) roda **dentro**
do container `vice` e não tem nenhuma dessas coisas ao alcance — nem o binário
`docker`. Por isso a integração não foi feita nele: não conseguiria executar o
script. Quem pode é o servidor de desenvolvimento do Vite, que roda no host.

```
navegador ──► ponte no host (8099) ──► ararabots.sh ──► docker / grSim / ROS
   │
   └── GUI Vue (5173) ──► apiNode no container (5000) ──► tópicos ROS
```

Os dois caminhos convivem: o da GUI serve para ver o campo e comandar robôs; o
da ponte serve para montar ambiente, rodar lotes e ler resultados.

**Uma interface, não duas.** A aba `Tool` exibe o `index.html` desta pasta num
`iframe`, em vez de reimplementar a mesma tela em Vue. Duas cópias da mesma
tela divergem — é a lição que este projeto já pagou com a receita de montagem em
três cópias.

---

## 3. O que o painel faz

Três passos, na ordem em que se usa, mais um bloco avançado recolhido. À
direita, três abas.

| passo | o que executa |
|---|---|
| **1 · Preparar o ambiente** | `preparar` (com `--headless`/`--janela`), `limpar`, `parar` |
| **2 · Escolher e rodar** | `validar N [cenario]`, `cenario <nome>`, mais as bandeiras |
| **3 · Ler o que aconteceu** | `jogo-analise`, `narrar`, `posse`, `painel` |
| **Avançado** (recolhido) | `sonda`, `sonda-chute`, `mov-bruto`, `grsim`, `ajustes` |

| aba | conteúdo |
|---|---|
| **Saída ao vivo** | o que o comando está imprimindo, em tempo real |
| **Lotes** | últimas linhas de `validacao.csv`, com o resultado em destaque |
| **Replays** | cada execução, com cenário, rótulo, hora e resultado |

Quem nunca usou encontra, aberto por padrão, o cartão **"Primeira vez aqui?"**
com os três passos em uma frase cada — incluindo as duas regras que mais custam
caro: lote de 6 (1 ou 2 de diferença é ruído) e nunca medir em modo janela.

### A prévia do comando

O passo 2 mostra, **antes de executar**, a linha exata que vai rodar:

```
ARARABOTS_SO_NOSSOS=1 ./ararabots.sh validar 6 jogo
```

É de propósito: quem usa o painel aprende o comando, e o painel não vira um
caminho paralelo ao terminal.

### A barra de estado

Luzes lidas a cada 2,5 s — `docker`, container `vice`, árbitro (porta 8081) e
grSim (com o modo registrado em `/tmp/ararabots_modo_grsim`) — e um veredito em
uma frase: *Ambiente pronto para medir* · *Ambiente incompleto — rode o passo 1*
· *Pronto, mas em modo janela — não vale para medir* · *Docker não respondeu*.

### Identidade dos replays

A ponte lê, de dentro de cada replay, o que de fato aconteceu, e o painel mostra:

- **cor própria por cenário**, derivada do nome (o mesmo cenário tem sempre a
  mesma cor, na barra lateral do item e na etiqueta);
- **rótulo** da execução (`val_jogo_3`, `original`, `disp_7`…) e a **hora**;
- **resultado** em pastilha: *gol a favor* (verde), *gol sofrido* (vermelho),
  *sem gol* (neutro) — vocabulário traduzido do `ararabots.py`, que grava
  `"gol": "nosso" | "contra" | None`;
- se **chutou** ou não naquela execução;
- **"sem adversário"** em vermelho quando o lote rodou com
  `ARARABOTS_SO_NOSSOS` — é o atributo que mais decide a leitura, e não estava
  em lugar nenhum (ver seção 7);
- **feedforward do PID** ligado ou desligado, quando o replay registra;
- agrupamento **por dia** e filtro por cenário.

O **visualizador** de cada replay (gerado pelo `ararabots.py`, em `ssl-VICE`)
foi reorganizado junto: identidade no cabeçalho (cenário, rótulo, hora), seis
indicadores no alto (duração, pico da bola, rastreio mediana e p90, disparos,
situação dominante, adversário em campo), linha do tempo com **marcas clicáveis**
de disparo e de gol, controles de velocidade (0,1× a 2×), passo a passo por
quadro e atalhos de teclado.

Os metadados são lidos com cache por `mtime`: cada replay tem ~300 kB, e com 60
deles reler tudo a cada consulta seriam ~18 MB por requisição.

### O que o painel deliberadamente NÃO faz

- **não tem campo de comando livre.** Só os subcomandos da lista branca
  (`ACOES`, em `ararabots_web.py`), com cada argumento validado por tipo;
- **não roda o menu interativo** (`cmd_menu`), que espera teclas;
- **não passa `--headless`/`--janela` para `validar` nem `cenario`** — essas
  flags só existem em `cmd_preparar` e `cmd_grsim`; em `validar` a flag seria
  lida como *nome de cenário* e em `cenario` como *perfil*;
- **não roda dois trabalhos ao mesmo tempo**;
- **não instala nada** (`instalar` é interativo e demorado).

---

## 4. Segurança

A ponte executa processos, então:

- escuta **só em `127.0.0.1`**. Para expor na rede é preciso
  `--host 0.0.0.0 --permitir-rede`, escrito à mão;
- subcomando e argumentos vêm de lista branca; nome de cenário tem de existir no
  `CENARIOS` do `ararabots.py`; `N` e segundos são inteiros com teto;
- variáveis de ambiente também são lista branca — `LD_PRELOAD`, por exemplo, é
  recusado;
- `stdin` do processo é `/dev/null`.

---

## 5. Como reverter

Quase tudo está **neste** repositório:

```bash
rm -rf painel src/components/ferramenta.vue
git checkout src/App.vue vite.config.ts
```

E em `ssl-VICE`, a única linha de ligação:

```bash
cd ../ssl-VICE && git checkout docs/ararabots.sh
```

O que cada edição acrescentou:

- `src/App.vue`: `'Tool'` na lista de abas, o `import`/registro do componente, um
  bloco `v-if="selectedButton === 2"` e a classe `.tool-screen`;
- `vite.config.ts`: o plugin `ararabots-ponte` e o proxy `/ponte`;
- `ssl-VICE/docs/ararabots.sh`: três linhas no cabeçalho de uso e o ramo `web)`.

Sem o subcomando `web` o script roda como antes; sem a aba `Tool` a GUI roda
como antes.

---

## 6. Verificação feita

- a ponte sobe pelo `./ararabots.sh web` no novo caminho e responde: 18 cenários
  lidos **sem** container no ar, 60 replays com metadados, CSV com 435 linhas;
- execução ponta a ponta: o botão de `ajustes status` montou
  `./ararabots.sh ajustes status`, aplicou `DIAG_JOGO=1`, transmitiu a saída ao
  vivo e capturou `codigo=0`;
- validação recusa ação inexistente, cenário inexistente, bandeira fora da lista
  e `N` fora da faixa;
- **o vigia do processo pai foi testado**: matando o pai, a ponte encerrou
  sozinha em 1 s;
- **layout medido no navegador**, não olhado: em 1280×720 os cartões ficam em
  altura natural (384, 412, 716, 373, 48 px) e a coluna rola
  (`scrollHeight` 2024 contra 599 de janela); em 900×700 as colunas empilham e a
  página rola; em 375×812 não há vazamento horizontal. A primeira versão tinha
  os cartões **comprimidos** a 108 px e 14 px por `flex-shrink`, e por isso não
  rolava nada;
- `bash -n` no script e `node --check` no JS do painel, do componente e do
  `vite.config.ts`.

**Não verificado:** o `npm run dev` de fato — sem `node_modules` nesta máquina
não houve build, então o plugin nunca rodou dentro do Vite. Ele executa o mesmo
comando já testado, e os três arquivos passam no `node --check`.

---

## 7. O `validacao.csv` não registra as bandeiras — e isso já enganou

O CSV não tem coluna de bandeiras. As últimas linhas dele são de 21/09 e mostram
`GOL A FAVOR` em 5 de 6 no cenário `jogo`.

**Medido nos replays daquele lote: zero quadros com adversário em campo.** Ele
rodou com `ARARABOTS_SO_NOSSOS`, e "5 em 6 sem adversário" é exatamente a linha
de base conhecida (`ESTADO_ATUAL.md` §4) — enquanto com adversário são 0 gols em
~40 execuções. O único replay com adversário em campo (02/10, 19:06) não fez
gol. Nada na planilha dizia isso.

É por isso que o painel e o visualizador agora mostram **adversário em campo**
como atributo de primeira classe. E continua valendo acrescentar a coluna de
bandeiras no `cmd_validar`: o painel já sabe quais enviou.

Vale acrescentar essa coluna no `cmd_validar`: o painel já sabe quais bandeiras
enviou, e é a informação que falta para a linha ser interpretável meses depois.
