# Sistema de Reservas de Salas de Estudo — Backend (API)

Backend do Projeto Integrador de **DevOps (FAG)**. API REST em **Node.js + Express**,
com persistência em **memória** (dev/testes) ou **Supabase/PostgreSQL** (produção),
autenticação **JWT** e pronto para deploy na **Vercel**.

> Papel: **Backend — João Becker**. Este repositório entrega a API pronta para o
> **QA (Ian)** escrever os testes e ligar a **CI**, e para o **Frontend (Jorge)**
> consumir a API. Ver [rastreabilidade](docs/qualidade/rastreabilidade.md) para a
> rastreabilidade dos requisitos.

## Sumário rápido

```bash
# 1. instalar dependências
npm install

# 2. configurar ambiente
cp .env.example .env        # (no Windows/PowerShell: copy .env.example .env)

# 3. rodar em desenvolvimento (modo memória, com dados de exemplo)
npm run dev

# 4. rodar os testes
npm test
```

A API sobe em `http://localhost:3000`. Teste rápido: `GET http://localhost:3000/api/health`.

## Stack e decisões

| Item | Escolha | Porquê |
|------|---------|--------|
| Runtime | Node.js ≥ 18 | LTS, suportado pela Vercel |
| Framework | Express | simples e amplamente conhecido |
| Auth | JWT + bcrypt | stateless (ideal p/ serverless), senha com hash (RNF03) |
| Banco | Supabase (PostgreSQL) | persistência remota exigida (RNF05) |
| Deploy | Vercel (serverless) | exigido (RNF04) |
| Testes | Jest + Supertest | 3 níveis: unidade, integração, sistema |

### `DATA_SOURCE`: memória x Supabase

O backend abstrai a persistência atrás de *repositories* com a mesma interface:

- `DATA_SOURCE=memory` (padrão) — sem banco. Ideal para **dev**, **testes** e **CI**
  (não precisa de credenciais). Os dados reiniciam a cada restart.
- `DATA_SOURCE=supabase` — usa o banco remoto de verdade (RNF05). Requer
  `SUPABASE_URL` e `SUPABASE_KEY`.

Isso permite que a CI rode os testes **sem** segredos e que a produção use o
Supabase real, sem mudar o código.

## Variáveis de ambiente

Ver [`.env.example`](.env.example). Resumo:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NODE_ENV` | não | `development` / `production` / `test` |
| `PORT` | não | porta local (padrão 3000) |
| `DATA_SOURCE` | não | `memory` (padrão) ou `supabase` |
| `JWT_SECRET` | **sim em produção** | segredo para assinar o JWT |
| `JWT_EXPIRES_IN` | não | validade do token (padrão `1d`) |
| `SUPABASE_URL` | sim se `supabase` | URL do projeto Supabase |
| `SUPABASE_KEY` | sim se `supabase` | chave da API Supabase |
| `CORS_ORIGIN` | não | origem do frontend (padrão `*`) |
| `SEED_DEV` | não | popular dados de exemplo em memória |

## Estrutura do projeto

```
api/index.js            # entrypoint da Vercel (exporta o app Express)
src/
  app.js                # cria o app (sem listen) — usado por testes e Vercel
  server.js             # sobe o servidor local (listen)
  config/               # env, cliente Supabase, seed de dev
  domain/               # regras de negócio PURAS (RN01..RN05), validações, erros
  repositories/         # memory/ e supabase/ (mesma interface) + fábrica
  services/             # casos de uso (RF01..RF08) + JWT + sanitização
  controllers/          # adaptam HTTP <-> services
  routes/               # definição das rotas da API
  middlewares/          # auth (JWT), erros, 404, asyncHandler
db/
  schema.sql            # tabelas do Supabase
  seed.sql              # salas de exemplo
tests/
  unit/                 # regras puras de src/domain (RN01..RN05)
  integration/          # API + service + repositório em memória
  system/               # fluxo HTTP completo (Supertest)
  helpers/              # buildTestApp.js e utilitários compartilhados
docs/
  API.md                # referência da API
  qualidade/            # rastreabilidade, estratégia de testes, roteiro de UX
```

Arquitetura em camadas: **routes → controllers → services → repositories**, com as
regras de negócio isoladas em `src/domain` (funções puras, fáceis de testar).

## Endpoints (resumo)

Referência completa em [`docs/API.md`](docs/API.md).

| Método | Rota | Auth | Requisito |
|--------|------|------|-----------|
| POST | `/api/usuarios` | — | RF01 cadastro |
| POST | `/api/auth/login` | — | RF02 login |
| GET | `/api/auth/me` | JWT | sessão (HU02) |
| GET | `/api/salas` | — | RF03 listar salas |
| POST | `/api/salas` | JWT admin | RF08 cadastrar sala |
| POST | `/api/reservas` | JWT | RF04/RF05 criar (RN01,RN02,RN05) |
| GET | `/api/reservas/minhas` | JWT | RF06 minhas reservas |
| PATCH | `/api/reservas/:id/cancelar` | JWT | RF07 cancelar (RN03,RN04) |
| GET | `/api/health` | — | health check (CI) |

## Como rodar os testes

```bash
npm test               # roda tudo (unidade + integração + sistema), modo memória, sem banco
npm run test:unit       # só regras de negócio puras (src/domain)
npm run test:integration # só API + service + repositório em memória
npm run test:system     # só fluxo HTTP completo (equivalente a "E2E" sem navegador)
npm run test:coverage   # roda tudo com relatório de cobertura (coverage/lcov-report/index.html)
```

Os três níveis previstos no projeto (ver rastreabilidade completa em
[`docs/qualidade/rastreabilidade.md`](docs/qualidade/rastreabilidade.md)):

- **Unidade** (`tests/unit`) — regras puras em `src/domain/reservaRules.js` e
  `src/domain/validacoes.js`, sem HTTP e sem banco.
- **Integração** (`tests/integration`) — API + service + repositório em memória
  (implementação real da mesma interface do Supabase, não um mock — ver
  [`docs/qualidade/estrategia-de-testes.md`](docs/qualidade/estrategia-de-testes.md)
  para o porquê). Cada teste verifica o estado final no repositório, não só o
  status HTTP.
- **Sistema** (`tests/system`) — fluxo HTTP completo via Supertest, usando
  `tests/helpers/buildTestApp.js`. Testes de navegador (Playwright) ficam
  pendentes até o Frontend existir.

## Docker (ambiente reproduzível)

```bash
docker compose up --build      # sobe a API em container (modo memória por padrão)
```

## Deploy

- **Vercel:** o repositório já tem `api/index.js` + `vercel.json`. Basta importar o
  repositório na Vercel e definir as variáveis (`DATA_SOURCE=supabase`,
  `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `CORS_ORIGIN`).
- **Supabase:** rode [`db/schema.sql`](db/schema.sql) e depois
  [`db/seed.sql`](db/seed.sql) no SQL Editor do projeto.

Passo a passo detalhado em [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Para o próximo colaborador

- **QA (Ian):** o framework de testes já está configurado e `npm test` passa. Falta
  **escrever os testes** dos 3 níveis e **inserir o workflow de CI** em
  `.github/workflows/`. Ver a seção "CI" em [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Frontend (Jorge):** consuma a API acima. Em dev, rode `npm run dev` com
  `DATA_SOURCE=memory` e `SEED_DEV=true` para ter salas e usuários de exemplo
  (admin@fag.local / admin123).
