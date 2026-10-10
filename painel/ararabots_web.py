#!/usr/bin/env python3
"""Ponte web do ararabots.sh - roda no HOST e serve a GUI.

    ./ararabots.sh web            sobe em http://127.0.0.1:8099
    ./ararabots.sh web 9000       outra porta

POR QUE ISTO EXISTE, E POR QUE NO HOST
--------------------------------------
O ararabots.sh precisa do HOST: ele chama docker, sobe o grSim, recria o
container do arbitro e edita o ~/.grsim.xml. O apiNode da GUI roda DENTRO do
container 'vice' e nao tem nada disso ao alcance - nem o binario docker. Logo a
GUI nao pode executar o script pelo caminho que ja existe.

Esta ponte roda no host, ao lado do script, e expoe duas coisas:

  1. um PAINEL PROPRIO em http://127.0.0.1:8099 - o index.html desta pasta,
     sem npm e sem build. Funciona mesmo com a GUI Vue desligada;
  2. o MESMO painel dentro da GUI Vue (aba Tool), atraves do proxy /ponte do
     Vite. Uma interface so, nao duas.

NADA AQUI SUBSTITUI O SCRIPT. Cada botao executa exatamente
'./ararabots.sh <subcomando>', no mesmo diretorio e com as mesmas variaveis de
ambiente que seriam digitadas no terminal. A ferramenta continua sendo uma so -
esta e mais uma porta de entrada, nao uma segunda receita de montagem. Foi por
isso que a receita divergiu em tres copias uma vez, e nao se repete.

REGRAS DE SEGURANCA (a ponte executa processos; isso nao e pouco)
----------------------------------------------------------------
- escuta so em 127.0.0.1 por default. '--host 0.0.0.0' exige --permitir-rede,
  escrito a mao, para nao expor execucao de comandos na rede do laboratorio;
- subcomando vem de uma LISTA BRANCA (ACOES). Nao existe campo de comando livre;
- cada argumento e validado por tipo: nome de cenario tem de existir no
  CENARIOS do ararabots.py, repeticao e duracao sao inteiros com teto;
- as variaveis de ambiente aceitas tambem sao lista branca (BANDEIRAS);
- um trabalho por vez. Dois 'validar' simultaneos brigariam pelo grSim e pelos
  mesmos arquivos de saida - o proprio script tem uma trava em /tmp para isso;
- stdin do processo e /dev/null: nenhum subcomando desta lista pergunta nada, e
  se um passar a perguntar, ele falha rapido em vez de travar esperando.
"""

from __future__ import annotations

import argparse
import ast
import csv
import io
import json
import os
import re
import shlex
import socket
import subprocess
import threading
import time
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# ONDE ESTE ARQUIVO MORA, e por que os caminhos sao assim.
#
# A ponte e a interface vivem no repositorio da GUI (ssl-gui/painel/), porque
# sao interface. A FERRAMENTA continua inteira em ssl-VICE/docs/ - este arquivo
# so a executa. O ararabots.sh tem um unico ramo 'web)' que chama este script.
AQUI = Path(__file__).resolve().parent          # .../ssl-gui/painel
GUI = AQUI.parent                               # .../ssl-gui
RAIZ = GUI.parent                               # .../Arara_Bots
VICE = RAIZ / "ssl-VICE"
DOCS = VICE / "docs"
SCRIPT = DOCS / "ararabots.sh"
PY_FERRAMENTA = DOCS / "ararabots.py"
CSV_VALIDACAO = DOCS / "validacao.csv"
PASTA_REPLAYS = RAIZ / "Replays_GrSim"

# ---------------------------------------------------------------- lista branca
#
# 'args' descreve o que cada acao aceita:
#   cenario  -> nome de cenario existente
#   n        -> inteiro 1..MAX_N
#   seg      -> inteiro 5..MAX_SEG
#   texto    -> um de uma lista fixa de opcoes
ACOES = {
    "preparar":     {"args": [],                      "modo": True,  "desc": "sobe container, grSim, arbitro e nodes; confere as taxas"},
    # ATENCAO: 'modo' (--headless/--janela) SO existe em cmd_preparar e cmd_grsim.
    # Em 'cenario' a flag cairia no PERFIL e em 'validar' viraria nome de cenario.
    # Nesses dois o modo vem do ambiente ja montado (/tmp/ararabots_modo_grsim).
    "cenario":      {"args": ["cenario"],             "modo": False, "desc": "monta UM cenario e deixa pronto para gravar"},
    "validar":      {"args": ["n", "cenario"],        "modo": False, "desc": "lote de N execucoes -> validacao.csv"},
    "narrar":       {"args": ["n"],                   "modo": False, "desc": "o que aconteceu, toque a toque"},
    "posse":        {"args": ["n"],                   "modo": False, "desc": "tempo por situacao de jogo"},
    "jogo-analise": {"args": ["n"],                   "modo": False, "desc": "as cinco perguntas do jogo corrido"},
    "sonda":        {"args": [],                      "modo": False, "desc": "linhas [FK] do ultimo teste de bola parada"},
    "sonda-chute":  {"args": ["seg"],                 "modo": False, "desc": "percorre a cadeia do chute"},
    "mov-bruto":    {"args": [],                      "modo": False, "desc": "comanda so a movimentacao, sem estrategia"},
    "painel":       {"args": [],                      "modo": False, "desc": "junta os replays num HTML com taxa de gol"},
    "limpar":       {"args": [],                      "modo": False, "desc": "mata os nodes ROS orfaos"},
    "parar":        {"args": [],                      "modo": False, "desc": "derruba tudo (nodes, grSim, containers)"},
    "grsim":        {"args": [],                      "modo": True,  "desc": "sobe so o simulador"},
    "ajustes":      {"args": ["ajuste_op"],           "modo": False, "desc": "liga/desliga as correcoes fora de src/strategy"},
}
OPCOES_AJUSTE = ["status", "on controle", "off controle"]

# Variaveis de ambiente que o painel pode ligar. Sao as do PROMPT_IA.md.
BANDEIRAS = {
    "DIAG_JOGO": "1",
    "DIAG_FK": "1",
    "ARARABOTS_SO_NOSSOS": "1",
    "ARARABOTS_INIMIGO_PARADO": "1",
    # CHAVES DE EXPERIMENTO: desligam UMA modificacao de 03/10/2026 por vez, para
    # medir o antes e o depois com o mesmo binario. O default e o comportamento
    # novo; a chave devolve o antigo. Ver skills/experimento.py.
    "ARARABOTS_SEM_ORIENTACAO_LADO": "1",
    "ARARABOTS_SEM_ORBITA": "1",
    "ARARABOTS_SEM_PROTECAO": "1",
    "ARARABOTS_SEM_PRESSAO_BOLA": "1",
    # as duas de 07/10/2026, nascidas da leitura dos replays do lote de 03/10
    "ARARABOTS_SEM_MIRA_FIRME": "1",
    "ARARABOTS_SEM_EMPURRAO": "1",
    # as quatro de 09/10/2026, do contorno do portador. O painel estava
    # DEFASADO: as chaves existiam na estrategia e nao davam para desligar
    # daqui, o que quebra o "uma interface so" - quem usa o painel nao
    # conseguia reproduzir o antes/depois que o relatorio cita.
    "ARARABOTS_SEM_PLANEJADOR": "1",
    "ARARABOTS_SEM_DISPARO_ALINHADO": "1",
    "ARARABOTS_SEM_CHEGADA_ALINHADA": "1",
    "ARARABOTS_SEM_PARAR_E_MIRAR": "1",
    # modo de diagnostico: prende o portador na fase de contorno, para medir
    # posicionamento sem o contato por cima
    "ARARABOTS_SO_POSICIONAR": "1",
}
# Bandeiras com valor livre (numerico), com teto.
BANDEIRAS_NUM = {"ARARABOTS_ROBOS": (1, 6), "ARARABOTS_VEL_INIMIGO": (0, 3)}

# Rotulo legivel de cada tipo de cenario. A ordem aqui e a ordem do seletor:
# primeiro o que se usa todo dia, depois os testes das modificacoes, por ultimo
# os casos limite.
TIPOS_ROTULO = [
    ["jogo", "Jogo corrido"],
    ["bola_parada", "Bola parada (falta)"],
    ["kickoff", "Kickoff"],
    ["portador", "Teste · o portador sozinho (contorno)"],
    ["orientacao", "Teste · orientação do corpo"],
    ["orbita", "Teste · contorno (bola atrás)"],
    ["pressao", "Teste · pressão na bola"],
    ["protecao", "Teste · proteção de posse"],
    ["mira", "Teste · mira firme (não gira)"],
    ["empurrao", "Teste · empurrão (bola anda)"],
    ["robustez", "Robustez (contagem de robôs)"],
    # Os desenhados no editor do painel. Vem por ultimo porque sao os que mais
    # mudam - e o playground, nao a bateria de regressao.
    ["local", "Meus cenários (playground)"],
]

MAX_N = 20
MAX_SEG = 120
MAX_LINHAS = 4000          # memoria do log vivo


# ------------------------------------------------------------------ cenarios
def ler_cenarios():
    """Nomes e titulos dos cenarios, lidos do ararabots.py SEM subir container.

    O 'listar' do proprio script faz isto por dentro do container, o que exige o
    ambiente no ar. Aqui o painel precisa da lista ANTES de qualquer coisa estar
    rodando, entao o dict e lido como dado, com ast - nao importando o modulo,
    que depende de rclpy.
    """
    try:
        arvore = ast.parse(PY_FERRAMENTA.read_text(encoding="utf-8"))
    except Exception as e:                                   # pragma: no cover
        return [{"nome": "?", "titulo": "erro lendo ararabots.py: %s" % e}]
    for no in ast.walk(arvore):
        if isinstance(no, ast.Assign):
            alvos = [t.id for t in no.targets if isinstance(t, ast.Name)]
            if "CENARIOS" in alvos and isinstance(no.value, ast.Dict):
                saida = []
                for chave, valor in zip(no.value.keys, no.value.values):
                    if not isinstance(chave, ast.Constant):
                        continue
                    titulo, robos, tipo, desc = "", 0, "outros", ""
                    if isinstance(valor, ast.Dict):
                        for k2, v2 in zip(valor.keys, valor.values):
                            if not isinstance(k2, ast.Constant):
                                continue
                            if k2.value == "titulo" and isinstance(v2, ast.Constant):
                                titulo = v2.value
                            if k2.value == "tipo" and isinstance(v2, ast.Constant):
                                tipo = v2.value
                            if k2.value == "descricao":
                                try:
                                    desc = ast.literal_eval(v2)
                                except Exception:
                                    desc = ""
                            if k2.value == "azuis" and isinstance(v2, ast.List):
                                robos = len(v2.elts)
                    saida.append({"nome": chave.value, "titulo": titulo,
                                  "tipo": tipo, "descricao": desc, "robos": robos})
                return saida + _cenarios_locais_para_lista()
    return _cenarios_locais_para_lista()


# -------------------------------------------------------- cenarios do painel
#
# Os cenarios desenhados no editor moram num JSON ao lado do ararabots.py, e
# nao dentro dele: um editor grafico que reescreve um .py de 5000 linhas e um
# defeito esperando acontecer. O ararabots.py junta esse JSON ao CENARIOS no
# import (ver _carregar_cenarios_locais), entao daquele ponto em diante eles sao
# cenarios como qualquer outro - 'listar', 'rodar', 'robos' e o subcomando
# 'lotes' nao sabem a diferenca.
#
# A ponte le e escreve o MESMO arquivo. As duas pontas juntam a mesma fonte, em
# vez de uma copiar da outra.
ARQ_LOCAIS = PY_FERRAMENTA.parent / "cenarios-locais.json"

# Limites do campo da Division B, em mm, para validar o que o editor manda. Sao
# os mesmos do desenho do campo no painel.
CAMPO_X, CAMPO_Y = 4500, 3000
FORA_DO_CAMPO = 600          # margem atras da linha de fundo que ainda aceitamos


def ler_locais():
    """O dicionario de cenarios locais. Nunca levanta - devolve {} se quebrar."""
    try:
        with ARQ_LOCAIS.open(encoding="utf-8") as fp:
            dados = json.load(fp)
        return dados if isinstance(dados, dict) else {}
    except FileNotFoundError:
        return {}
    except Exception:
        return {}


def _cenarios_locais_para_lista():
    saida = []
    for nome, cen in sorted(ler_locais().items()):
        if not isinstance(cen, dict):
            continue
        saida.append({"nome": nome, "titulo": cen.get("titulo", nome),
                      "tipo": cen.get("tipo", "local"),
                      "descricao": cen.get("descricao", ""),
                      "robos": len(cen.get("azuis", [])), "local": True})
    return saida


def _valida_cenario(nome, cen):
    """Devolve (ok, motivo). Valida o que o editor manda ANTES de gravar.

    Gravar um cenario invalido e pior que recusar: ele entra na lista, alguem
    roda um lote inteiro com ele e o resultado nao quer dizer nada.
    """
    if not re.fullmatch(r"[a-z0-9_]{3,40}", nome or ""):
        return False, ("o nome vale como identificador: so minusculas, numeros "
                       "e _, de 3 a 40 caracteres")
    if nome in {c["nome"] for c in ler_cenarios()} - set(ler_locais()):
        return False, "já existe um cenário do repositório com esse nome"
    try:
        bx, by = float(cen["bola"][0]), float(cen["bola"][1])
    except Exception:
        return False, "cenário sem bola"
    if abs(bx) > CAMPO_X or abs(by) > CAMPO_Y:
        return False, "a bola está fora do campo"
    vistos = {"azuis": set(), "amarelos": set()}
    for lado in ("azuis", "amarelos"):
        for robo in cen.get(lado, []):
            try:
                rid, rx, ry = int(robo[0]), float(robo[1]), float(robo[2])
            except Exception:
                return False, "robô com coordenada inválida em %s" % lado
            if not 0 <= rid <= 5:
                return False, "id de robô fora de 0..5 em %s" % lado
            if rid in vistos[lado]:
                return False, "dois robôs com o id %d em %s" % (rid, lado)
            vistos[lado].add(rid)
            if abs(rx) > CAMPO_X + FORA_DO_CAMPO or abs(ry) > CAMPO_Y:
                return False, "robô fora do campo em %s" % lado
    if not cen.get("azuis"):
        return False, "o cenário precisa de pelo menos um robô nosso"
    return True, ""


def gravar_local(nome, cen):
    """Grava um cenario local. Devolve (ok, motivo)."""
    ok, motivo = _valida_cenario(nome, cen)
    if not ok:
        return False, motivo
    dados = ler_locais()
    limpo = {
        "titulo": str(cen.get("titulo") or nome)[:120],
        "descricao": str(cen.get("descricao") or "")[:800],
        "tipo": str(cen.get("tipo") or "local")[:40],
        "bola": [round(float(cen["bola"][0])), round(float(cen["bola"][1]))],
        "azuis": [[int(r[0]), round(float(r[1])), round(float(r[2])),
                   round(float(r[3] if len(r) > 3 else 0))]
                  for r in cen.get("azuis", [])],
        "amarelos": [[int(r[0]), round(float(r[1])), round(float(r[2])),
                      round(float(r[3] if len(r) > 3 else 0))]
                     for r in cen.get("amarelos", [])],
        "comando": [str(cen.get("comando", ["FORCE_START", "BLUE"])[0]),
                    str(cen.get("comando", ["FORCE_START", "BLUE"])[1])],
    }
    # PAPEIS FIXOS: a chave do editor. Com ela, 'ararabots.py papeis' devolve o
    # mapa e o 'cenario' exporta ARARABOTS_PAPEIS antes de subir o strategyNode -
    # a estrategia passa a obedecer o desenho em vez de distribuir por geometria.
    limpo["papeis_fixos"] = bool(cen.get("papeis_fixos"))
    if isinstance(cen.get("papeis"), dict):
        validos = {"portador", "apoio", "cobertura", "goleiro", "zagueiro"}
        limpo["papeis"] = {str(k): str(v)[:20] for k, v in cen["papeis"].items()
                           if str(v) in validos}
    dados[nome] = limpo
    # ESCRITA ATOMICA: um arquivo temporario e um rename. Se a maquina cair no
    # meio, o que sobra e a versao anterior inteira - nao um JSON truncado, que
    # levaria TODOS os cenarios locais junto.
    tmp = ARQ_LOCAIS.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(dados, ensure_ascii=False, indent=1),
                   encoding="utf-8")
    tmp.replace(ARQ_LOCAIS)
    return True, ""


def remover_local(nome):
    dados = ler_locais()
    if nome not in dados:
        return False, "esse cenário não existe"
    dados.pop(nome)
    tmp = ARQ_LOCAIS.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(dados, ensure_ascii=False, indent=1),
                   encoding="utf-8")
    tmp.replace(ARQ_LOCAIS)
    return True, ""


# -------------------------------------------------------------------- estado
def _rodando(padrao):
    """Ha processo casando com 'padrao'? (sem pgrep -f, que casa com ele mesmo)

    O proprio ararabots.sh documenta a armadilha: 'pgrep -f <padrao>' casa com a
    linha de comando que o executa, e isso ja produziu contagem errada de
    processos e espera infinita.
    """
    try:
        saida = subprocess.run(["ps", "-eo", "pid=,cmd="], capture_output=True,
                               text=True, timeout=5).stdout
    except Exception:
        return False
    meu = str(os.getpid())
    for linha in saida.splitlines():
        pid, _, cmd = linha.strip().partition(" ")
        if pid == meu or padrao not in cmd:
            continue
        if "ararabots_web" in cmd:
            continue
        return True
    return False


def _containers():
    try:
        saida = subprocess.run(["docker", "ps", "--format", "{{.Names}}"],
                               capture_output=True, text=True, timeout=8)
        if saida.returncode != 0:
            return None                     # docker existe mas recusou (permissao)
        return [n for n in saida.stdout.split() if n]
    except FileNotFoundError:
        return None
    except Exception:
        return None


def _arbitro_no_ar():
    """O game-controller responde? E a mesma checagem do portao de medicao."""
    s = socket.socket()
    s.settimeout(1.0)
    try:
        return s.connect_ex(("127.0.0.1", 8081)) == 0
    finally:
        s.close()


def estado_do_ambiente():
    containers = _containers()
    modo = None
    try:
        modo = Path("/tmp/ararabots_modo_grsim").read_text(encoding="utf-8").strip()
    except Exception:
        pass
    bandeiras = {}
    for arq in ("ararabots_ab", "ararabots_papeis_fixos"):
        p = Path("/tmp") / arq
        if p.exists():
            try:
                bandeiras[arq] = p.read_text(encoding="utf-8").strip() or "1"
            except Exception:
                bandeiras[arq] = "1"
    return {
        "docker": None if containers is None else True,
        "containers": containers or [],
        "vice": bool(containers and "vice" in containers),
        "arbitro": _arbitro_no_ar(),
        "grsim": _rodando("grSim"),
        "modo_grsim": modo,
        "bandeiras_tmp": bandeiras,
        "ajuste_pid": _ajuste_ligado(),
        "raiz": str(RAIZ),
    }


def _ajuste_ligado():
    """O ajuste do PID (feedforward desligado) esta ativo na arvore?"""
    alvo = VICE / "src" / "control" / "control" / "pid_controller.py"
    try:
        txt = alvo.read_text(encoding="utf-8")
    except Exception:
        return None
    for linha in txt.splitlines():
        if linha.strip().startswith("#ORIG#"):
            return True                      # a original esta desativada => ajuste ON
    return False


def ler_csv(limite=40):
    if not CSV_VALIDACAO.exists():
        return {"cabecalho": [], "linhas": [], "arquivo": str(CSV_VALIDACAO)}
    with io.open(CSV_VALIDACAO, encoding="utf-8", errors="replace") as fp:
        tudo = list(csv.reader(fp))
    if not tudo:
        return {"cabecalho": [], "linhas": [], "arquivo": str(CSV_VALIDACAO)}
    return {"cabecalho": tudo[0], "linhas": tudo[-limite:][::-1],
            "total": len(tudo) - 1, "arquivo": str(CSV_VALIDACAO)}


# Cache dos metadados de replay, por (nome, mtime, tamanho).
#
# POR QUE PRECISA DE CACHE: cada replay tem ~300 kB e o payload fica embutido no
# HTML. Com 30 replays, reler tudo a cada consulta do painel seriam 9 MB por
# requisicao, a cada poucos segundos. A chave inclui mtime e tamanho, entao um
# replay regravado e relido automaticamente.
_CACHE_REPLAY = {}

# Nome de arquivo:  <cenario>__<rotulo>__<HHMMSS>.html
_RE_NOME = re.compile(r"^(?P<cenario>[^_]+(?:_[^_]+)*?)__(?P<rotulo>.+?)__(?P<hora>\d{6})\.html$")

# Dentro do HTML o payload esta em 'const D = {...}'. Em vez de desserializar o
# JSON inteiro (que carrega milhares de quadros), pescamos so os campos de
# resultado por expressao regular.
_RE_CAMPO = {
    "cenario": re.compile(r'"cenario"\s*:\s*"([^"]*)"'),
    "gol": re.compile(r'"gol"\s*:\s*(?:"([^"]*)"|(null|true|false))'),
    "gol_em": re.compile(r'"gol_em"\s*:\s*(?:"([^"]*)"|([\d.]+|null))'),
    "disparou": re.compile(r'"disparou"\s*:\s*(true|false|null)'),
    "cobrador": re.compile(r'"cobrador"\s*:\s*(\d+|null)'),
    "ajuste_pid": re.compile(r'"ajuste_pid"\s*:\s*(true|false|null)'),
}


def _metadados_do_replay(caminho):
    """Cenario, rotulo, hora e RESULTADO de um replay, com cache."""
    try:
        st = caminho.stat()
    except OSError:
        return None
    chave = (caminho.name, st.st_mtime, st.st_size)
    if chave in _CACHE_REPLAY:
        return _CACHE_REPLAY[chave]

    dados = {
        "nome": caminho.name,
        "ajuste_pid": None,
        "com_adversario": None,
        "kb": round(st.st_size / 1024.0),
        "quando": time.strftime("%d/%m %H:%M", time.localtime(st.st_mtime)),
        "dia": time.strftime("%d/%m/%Y", time.localtime(st.st_mtime)),
        "ordem": st.st_mtime,
        "cenario": None, "rotulo": None, "hora": None,
        "gol": None, "disparou": None, "cobrador": None,
    }
    m = _RE_NOME.match(caminho.name)
    if m:
        dados["cenario"] = m.group("cenario")
        dados["rotulo"] = m.group("rotulo")
        h = m.group("hora")
        dados["hora"] = "%s:%s:%s" % (h[0:2], h[2:4], h[4:6])

    try:
        texto = caminho.read_text(encoding="utf-8", errors="replace")
    except OSError:
        texto = ""
    # ADVERSARIO EM CAMPO, contado no texto bruto.
    #
    # E o atributo que mais decide a leitura de um replay, e nao estava em lugar
    # nenhum: um lote de 21/09 marcou 5 gols em 6 no cenario 'jogo' rodando com
    # ARARABOTS_SO_NOSSOS - zero quadros com amarelo -, e a planilha nao
    # registrava a bandeira. Com adversario, a linha de base e 0 gols em ~40.
    #
    # O payload e JSON compacto, entao cada quadro tem '"y":[[' quando ha
    # adversario detectado e '"y":[]' quando nao ha. Contar as duas formas e
    # exato e nao exige desserializar os milhares de quadros.
    if texto:
        com = texto.count('"y":[[')
        total = texto.count('"y":[')
        if total:
            dados["com_adversario"] = round(100.0 * com / total)

    for campo, rx in _RE_CAMPO.items():
        achou = rx.search(texto)
        if not achou:
            continue
        grupos = [g for g in achou.groups() if g is not None]
        valor = grupos[0] if grupos else None
        if valor in ("null", None):
            valor = None
        elif valor == "true":
            valor = True
        elif valor == "false":
            valor = False
        if campo == "cenario" and valor:
            dados["cenario"] = valor
        elif campo in dados:
            dados[campo] = valor

    # Resultado em uma palavra, para o painel nao precisar interpretar.
    #
    # O VOCABULARIO E DO ararabots.py, nao inventado aqui: ele grava
    # 'gol': "nosso" | "contra" | None (ver o comentario em ararabots.py:1088 e
    # a atribuicao em :1291). Os valores do validacao.csv sao outros
    # ("GOL A FAVOR", "GOL CONTRA"), e 'GOL CONTRA' no log significa gol
    # SOFRIDO - erro de leitura que ja aconteceu e esta registrado no
    # ESTADO_ATUAL.md. Por isso a traducao e explicita.
    gol = dados.get("gol")
    rotulo = (gol or "").strip().lower() if isinstance(gol, str) else ""
    if rotulo in ("nosso",) or "favor" in rotulo or gol is True:
        dados["resultado"] = "gol a favor"
    elif rotulo in ("contra",) or "sofrid" in rotulo:
        dados["resultado"] = "gol sofrido"
    elif rotulo:
        dados["resultado"] = rotulo
    else:
        dados["resultado"] = "sem gol"

    _CACHE_REPLAY[chave] = dados
    # o cache nao cresce sem limite
    if len(_CACHE_REPLAY) > 400:
        for k in list(_CACHE_REPLAY)[:200]:
            _CACHE_REPLAY.pop(k, None)
    return dados


def ler_replays(limite=60):
    if not PASTA_REPLAYS.is_dir():
        return []
    arqs = sorted(PASTA_REPLAYS.glob("*.html"),
                  key=lambda p: p.stat().st_mtime, reverse=True)[:limite]
    saida = []
    for p in arqs:
        d = _metadados_do_replay(p)
        if d:
            saida.append(d)
    return saida


# ------------------------------------------------------------------- trabalho
class Trabalho:
    """UM subcomando do ararabots.sh em execucao, com o log vivo."""

    def __init__(self):
        self.proc = None
        self.linhas = deque(maxlen=MAX_LINHAS)
        self.seq = 0
        self.comando = ""
        self.inicio = 0.0
        self.fim = 0.0
        self.codigo = None
        self.lock = threading.Lock()

    # -- ciclo de vida
    def ativo(self):
        return self.proc is not None and self.proc.poll() is None

    def iniciar(self, argv, env_extra, descricao):
        if self.ativo():
            raise RuntimeError("ja existe um trabalho rodando: %s" % self.comando)
        env = dict(os.environ)
        env.update(env_extra)
        env.setdefault("PYTHONUNBUFFERED", "1")
        with self.lock:
            self.linhas.clear()
            self.seq = 0
            self.comando = descricao
            self.inicio = time.time()
            self.fim = 0.0
            self.codigo = None
        self._escrever("$ %s" % descricao)
        if env_extra:
            self._escrever("  (ambiente: %s)" % " ".join(
                "%s=%s" % (k, v) for k, v in sorted(env_extra.items())))
        self.proc = subprocess.Popen(
            argv, cwd=str(DOCS), env=env, stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, bufsize=1, errors="replace")
        threading.Thread(target=self._ler, daemon=True).start()

    def parar(self):
        if not self.ativo():
            return False
        self.proc.terminate()
        try:
            self.proc.wait(timeout=5)
        except Exception:
            self.proc.kill()
        self._escrever("** interrompido pelo painel **")
        return True

    # -- interno
    def _ler(self):
        for linha in self.proc.stdout:
            self._escrever(linha.rstrip("\n"))
        self.proc.wait()
        with self.lock:
            self.codigo = self.proc.returncode
            self.fim = time.time()
        self._escrever("** fim: codigo=%s em %.0f s **"
                       % (self.codigo, self.fim - self.inicio))

    def _escrever(self, texto):
        with self.lock:
            self.seq += 1
            self.linhas.append((self.seq, texto))

    def desde(self, cursor):
        with self.lock:
            novas = [(s, t) for s, t in self.linhas if s > cursor]
            return novas, self.seq

    def resumo(self):
        with self.lock:
            return {
                "comando": self.comando,
                "ativo": self.ativo(),
                "codigo": self.codigo,
                "segundos": round((self.fim or time.time()) - self.inicio) if self.inicio else 0,
                "seq": self.seq,
            }


TRABALHO = Trabalho()


# ------------------------------------------------------------------ validacao
def montar_argv(pedido):
    """Traduz o pedido do painel em argv do ararabots.sh, validando tudo."""
    acao = pedido.get("acao")
    if acao not in ACOES:
        raise ValueError("acao desconhecida: %r" % acao)
    spec = ACOES[acao]
    argv = [str(SCRIPT), acao]
    nomes = {c["nome"] for c in ler_cenarios()}

    for tipo in spec["args"]:
        if tipo == "cenario":
            nome = (pedido.get("cenario") or "").strip()
            if not nome:
                if acao == "cenario":
                    raise ValueError("escolha um cenario: cmd_cenario exige o nome")
                continue                     # 'validar' sem nome = todos os cenarios
            if nome not in nomes:
                raise ValueError("cenario inexistente: %r" % nome)
            argv.append(nome)
        elif tipo == "n":
            try:
                n = int(pedido.get("n", 6))
            except Exception:
                raise ValueError("n invalido")
            if not 1 <= n <= MAX_N:
                raise ValueError("n fora de 1..%d" % MAX_N)
            argv.append(str(n))
        elif tipo == "seg":
            try:
                s = int(pedido.get("seg", 20))
            except Exception:
                raise ValueError("segundos invalidos")
            if not 5 <= s <= MAX_SEG:
                raise ValueError("segundos fora de 5..%d" % MAX_SEG)
            argv.append(str(s))
        elif tipo == "ajuste_op":
            op = (pedido.get("ajuste_op") or "status").strip()
            if op not in OPCOES_AJUSTE:
                raise ValueError("opcao de ajuste invalida")
            argv.extend(op.split())

    if spec["modo"]:
        modo = pedido.get("modo", "headless")
        if modo not in ("headless", "janela"):
            raise ValueError("modo invalido")
        argv.append("--%s" % modo)

    env = {}
    for nome, valor in (pedido.get("bandeiras") or {}).items():
        if nome in BANDEIRAS and valor:
            env[nome] = BANDEIRAS[nome]
        elif nome in BANDEIRAS_NUM and valor not in (None, "", False):
            lo, hi = BANDEIRAS_NUM[nome]
            try:
                v = float(valor)
            except Exception:
                raise ValueError("valor invalido para %s" % nome)
            if not lo <= v <= hi:
                raise ValueError("%s fora de %s..%s" % (nome, lo, hi))
            env[nome] = ("%g" % v)
        elif nome not in BANDEIRAS and nome not in BANDEIRAS_NUM:
            raise ValueError("bandeira nao permitida: %r" % nome)
    return argv, env, " ".join(shlex.quote(a) for a in
                               ["./ararabots.sh"] + argv[1:])


# --------------------------------------------------------------------- HTTP
class Handler(BaseHTTPRequestHandler):
    server_version = "ararabots-web"

    def log_message(self, formato, *args):       # silencia o log por requisicao
        pass

    # -- utilidades
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _json(self, dados, codigo=200):
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self._cors()
        self.end_headers()
        self.wfile.write(corpo)

    def _texto(self, corpo, tipo="text/html; charset=utf-8", codigo=200):
        if isinstance(corpo, str):
            corpo = corpo.encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self._cors()
        self.end_headers()
        self.wfile.write(corpo)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    # -- GET
    def do_GET(self):
        rota = self.path.split("?")[0]
        if rota == "/":
            return self._texto(ler_painel())
        if rota == "/api/cenarios":
            return self._json({"cenarios": ler_cenarios(), "acoes": ACOES,
                               "tipos": TIPOS_ROTULO,
                               "bandeiras": sorted(BANDEIRAS),
                               "bandeiras_num": BANDEIRAS_NUM,
                               "opcoes_ajuste": OPCOES_AJUSTE})
        if rota == "/api/cenarios-locais":
            return self._json({"cenarios": ler_locais()})
        if rota == "/api/estado":
            return self._json({"ambiente": estado_do_ambiente(),
                               "trabalho": TRABALHO.resumo()})
        if rota == "/api/csv":
            return self._json(ler_csv())
        if rota == "/api/replays":
            return self._json({"replays": ler_replays(),
                               "pasta": str(PASTA_REPLAYS)})
        if rota.startswith("/replay/"):
            nome = os.path.basename(rota[len("/replay/"):])
            alvo = PASTA_REPLAYS / nome
            if not alvo.is_file() or alvo.suffix != ".html":
                return self._texto("replay nao encontrado", codigo=404)
            return self._texto(alvo.read_bytes())
        if rota == "/api/log":
            try:
                cursor = int(self.path.split("cursor=")[1].split("&")[0])
            except Exception:
                cursor = 0
            novas, seq = TRABALHO.desde(cursor)
            return self._json({"linhas": [t for _, t in novas], "cursor": seq,
                               "trabalho": TRABALHO.resumo()})
        if rota == "/api/stream":
            return self._sse()
        return self._texto("rota desconhecida", codigo=404)

    def _sse(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self._cors()
        self.end_headers()
        cursor = 0
        try:
            while True:
                novas, cursor = TRABALHO.desde(cursor)
                for _, texto in novas:
                    self.wfile.write(("data: %s\n\n" % json.dumps(
                        {"linha": texto}, ensure_ascii=False)).encode("utf-8"))
                self.wfile.write(("event: estado\ndata: %s\n\n" % json.dumps(
                    TRABALHO.resumo(), ensure_ascii=False)).encode("utf-8"))
                self.wfile.flush()
                time.sleep(0.4)
        except (BrokenPipeError, ConnectionResetError):
            return

    # -- POST
    def do_POST(self):
        rota = self.path.split("?")[0]
        tamanho = int(self.headers.get("Content-Length") or 0)
        try:
            pedido = json.loads(self.rfile.read(tamanho) or b"{}")
        except Exception:
            return self._json({"erro": "json invalido"}, 400)

        if rota == "/api/parar-trabalho":
            return self._json({"interrompido": TRABALHO.parar()})
        if rota == "/api/cenario-local":
            ok, motivo = gravar_local(str(pedido.get("nome", "")),
                                      pedido.get("cenario") or {})
            if not ok:
                return self._json({"erro": motivo}, 400)
            return self._json({"ok": True})
        if rota == "/api/cenario-local-remover":
            ok, motivo = remover_local(str(pedido.get("nome", "")))
            if not ok:
                return self._json({"erro": motivo}, 400)
            return self._json({"ok": True})
        if rota == "/api/rodar":
            try:
                argv, env, descricao = montar_argv(pedido)
            except ValueError as e:
                return self._json({"erro": str(e)}, 400)
            try:
                TRABALHO.iniciar(argv, env, descricao)
            except RuntimeError as e:
                return self._json({"erro": str(e)}, 409)
            return self._json({"ok": True, "comando": descricao})
        return self._json({"erro": "rota desconhecida"}, 404)


# ------------------------------------------------------------------- painel
#
# O HTML/CSS/JS do painel fica em ararabots_painel.html, ao lado deste arquivo.
# Esta separado de proposito: desenho se edita sem mexer em Python, e a GUI Vue
# mostra ESTE MESMO arquivo (aba Tool) em vez de ter uma segunda interface. Duas
# copias da mesma tela e como elas divergem - a licao esta paga neste projeto.
PAINEL = AQUI / "index.html"


def ler_painel():
    try:
        return PAINEL.read_bytes()
    except FileNotFoundError:
        return ("<h1>index.html do painel nao encontrado</h1>"
                "<p>Esperado em: %s</p>" % PAINEL).encode("utf-8")


# --------------------------------------------------------------------- main
def vigiar_pai(pid, servidor):
    """Encerra a ponte quando o processo que a subiu morrer.

    POR QUE ISTO EXISTE
    -------------------
    Quem sobe a ponte normalmente e o 'npm run dev' (plugin ararabots-ponte do
    vite.config.ts). Se o Vite for morto a frio - Ctrl-C duro, kill -9, terminal
    fechado -, os seus 'on close' nao rodam e a ponte ficaria orfa escutando a
    porta, e o proximo 'npm run dev' encontraria a porta ocupada por um processo
    velho, servindo um painel velho.
    
    A alternativa seria o usuario rodar pkill na mao. Pior: o padrao obvio
    'pkill -f ararabots_web.py' casa com a PROPRIA linha de comando que o
    executa - a armadilha que o PROMPT_IA.md §7 registra e que ja matou o shell
    de quem tentou. Com o vigia, ninguem precisa saber disso.
    
    Tambem encerra qualquer trabalho em andamento: um lote rodando sem ninguem
    olhando o resultado nao serve para nada e disputa o grSim com o proximo.
    """
    while True:
        time.sleep(2.0)
        try:
            os.kill(pid, 0)                  # nao envia sinal, so testa
        except (OSError, ProcessLookupError):
            print("\nquem me subiu (pid %d) morreu - encerrando a ponte" % pid,
                  flush=True)
            TRABALHO.parar()
            servidor.shutdown()
            return


def main():
    p = argparse.ArgumentParser(description="Ponte web do ararabots.sh")
    p.add_argument("--porta", type=int, default=8099)
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--permitir-rede", action="store_true",
                   help="necessario para escutar fora de 127.0.0.1")
    p.add_argument("--pai", type=int, default=None,
                   help="pid que, ao morrer, encerra a ponte (o Vite usa isto)")
    args = p.parse_args()

    if args.host != "127.0.0.1" and not args.permitir_rede:
        raise SystemExit(
            "recusado: escutar em %s expoe execucao de comandos na rede.\n"
            "Se e isso mesmo que voce quer, repita com --permitir-rede."
            % args.host)
    if not SCRIPT.is_file():
        raise SystemExit(
            "ararabots.sh nao encontrado em %s\n"
            "A ponte espera os repositorios irmaos lado a lado:\n"
            "    Arara_Bots/ssl-VICE/docs/ararabots.sh\n"
            "    Arara_Bots/ssl-gui/painel/   (este arquivo)" % SCRIPT)

    servidor = ThreadingHTTPServer((args.host, args.porta), Handler)
    servidor.daemon_threads = True
    if args.pai:
        threading.Thread(target=vigiar_pai, args=(args.pai, servidor),
                         daemon=True).start()
    print("=" * 62)
    print("  painel da ferramenta:  http://%s:%d" % (args.host, args.porta))
    print("  (a GUI Vue mostra este mesmo painel - aba 'Tool')")
    print("  script: %s" % SCRIPT)
    if args.pai:
        print("  encerro junto com o pid %d (quem me subiu)" % args.pai)
    print("  Ctrl-C para encerrar. O script continua sendo o mesmo.")
    print("=" * 62)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nencerrando")
    finally:
        TRABALHO.parar()


if __name__ == "__main__":
    main()
