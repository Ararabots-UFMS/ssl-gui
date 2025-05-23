<div align="center">
<a href="https://quackfy.vercel.app/">
<img height="100" src="https://ararabots-ufms.github.io/img/arara_no_bg.png" alt="Arara">
</a>
</div>

<div align="center">
<img src="https://img.shields.io/badge/build-latest-blue">
<img src="https://img.shields.io/github/issues/Ararabots-UFMS/ssl-gui">
</div>

# ssl-GUI

Este projeto é a interface gráfica (GUI) do sistema ssl-VICE, desenvolvido com Vue 3 e Vite.

## Configuração do Ambiente de Desenvolvimento

Recomendado utilizar:

- [VSCode](https://code.visualstudio.com/)

## Execução com Docker

**Importante:** É necessário clonas o repositório do `ssl-VICE` e seguir os passos do README de lá. Fazendo isso não é necessário rodar mais nada do `ssl-GUI`

Para rodar o projeto com Docker, **entre na pasta do `ssl-VICE`** (onde está o `docker-compose.yml`) e execute:

```bash
docker-compose up --build
```

Isso criará dois serviços:
- `ssl-vice`
- `ssl-gui`

A interface estará disponível em: [http://localhost:5173](http://localhost:5173)

---
#### Execução sem o Docker (não recomendado)

```bash
npm install
npm run dev
```

### Build para Produção

```bash
npm run build
```
