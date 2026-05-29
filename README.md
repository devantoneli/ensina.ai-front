# ensina.ai-front

Frontend do projeto ensina.ai, desenvolvido com Next.js.

## Pre-requisitos

- Node.js 20.9 ou superior
- npm 10 ou superior (ou outro gerenciador compativel)
- Backend da API acessivel (padrao: http://localhost:8000)

Para validar as versoes instaladas:

```bash
node -v
npm -v
```

## Configuracao (opcional)

Por padrao, a aplicacao consome a API em http://localhost:8000.
Para trocar o backend, defina a variavel:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Voce pode criar um arquivo .env.local na raiz do projeto e adicionar a variavel acima.

## Instalacao das dependencias

No diretorio raiz do projeto, execute:

```bash
npm install
```

Esse comando instala todas as dependencias listadas em package.json.

## Execucao em ambiente de desenvolvimento

Com as dependencias instaladas, inicie o servidor local:

```bash
npm run dev
```

Depois, acesse no navegador:

```text
http://localhost:3000
```

## Build e execucao em producao

Para gerar a build de producao:

```bash
npm run build
```

Para executar a aplicacao com a build gerada:

```bash
npm run start
```

## Lint

Para verificar padrao de codigo e possiveis problemas:

```bash
npm run lint
```

## Scripts disponiveis

- npm run dev: inicia o projeto em modo desenvolvimento.
- npm run build: gera a build de producao.
- npm run start: inicia o servidor com a build de producao.
- npm run lint: executa o lint do projeto.
