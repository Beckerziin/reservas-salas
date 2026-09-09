# Guia de Contribuição e Operação

Este guia cobre o **fluxo de trabalho no Git**, a **proteção da branch principal**,
a **CI** (a ser inserida pelo QA) e o **deploy** (Vercel + Supabase), conforme os
critérios do Projeto Integrador.

## 1. Fluxo de desenvolvimento (obrigatório)

Ninguém programa direto na `main`. O fluxo é:

```
issue/tarefa → branch de trabalho → commits → Pull Request → revisão → merge
```

```bash
git checkout -b feat/nome-da-tarefa      # ou fix/, chore/, test/, docs/
# ...alterações...
npm test && npm run lint                 # verifique localmente antes de subir
git commit -m "feat: descricao curta"
git push -u origin feat/nome-da-tarefa
# abra o Pull Request no GitHub
```

Convenção de branches: `feat/`, `fix/`, `test/`, `docs/`, `chore/`.

## 2. Proteção da branch `main` (configurar no GitHub)

Em **Settings → Branches → Add branch ruleset** (ou *Branch protection rules*) para `main`:

- [x] Require a pull request before merging
- [x] Require approvals (mínimo **1**)
- [x] Require status checks to pass before merging → selecionar o check da CI
      (ex.: `test`) **depois** que o workflow rodar ao menos uma vez
- [x] Require conversation resolution before merging
- [x] Block force pushes / não permitir push direto na `main`

## 3. CI — a ser inserida pelo QA (Ian)

O projeto já roda `npm test` verde. Falta **criar o workflow** em
`.github/workflows/ci.yml`. Sugestão pronta para colar (roda os testes em cada PR):

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
    env:
      DATA_SOURCE: memory
      JWT_SECRET: ci-secret
```

> Os testes rodam em `DATA_SOURCE=memory`, então a CI **não** precisa de credenciais
> do Supabase. Depois do primeiro run, marque o check `test` como *required* na
> proteção da branch (passo 2).

Níveis de teste a cobrir (ver [`docs/qualidade/rastreabilidade.md`](qualidade/rastreabilidade.md)):
unidade (`tests/unit`), integração (`tests/integration`, service + repositório /
API + repositório) e sistema (`tests/system`, fluxo HTTP com
`tests/helpers/buildTestApp.js`).

## 4. Deploy do banco (Supabase)

1. Crie um projeto em <https://supabase.com>.
2. **SQL Editor** → cole e rode [`db/schema.sql`](../db/schema.sql).
3. Rode [`db/seed.sql`](../db/seed.sql) para ter salas de exemplo.
4. Em **Project Settings → API**, copie `Project URL` e a chave para as variáveis
   `SUPABASE_URL` e `SUPABASE_KEY`.

### Bônus "banco como código" (migrations versionadas)

O esquema também está versionado como migration em `supabase/migrations/`. Para
aplicar no projeto remoto via CLI (sem cliques no painel):

```bash
npx supabase login
npx supabase link --project-ref vdzgwtdwpcqadqxxmtxi
npx supabase db push
```

- `login` abre o navegador para gerar um token de acesso (fica na sua máquina).
- `link` conecta ao projeto remoto (pode pedir a **senha do banco** — a mesma
  definida ao criar o projeto; **não** a coloque no Git).
- `db push` aplica as migrations de `supabase/migrations/` ao Supabase remoto.

Novas mudanças de esquema: crie um novo arquivo em `supabase/migrations/` (ex.:
`npx supabase migration new nome_da_mudanca`) e rode `db push` de novo.

## 5. Deploy da aplicação (Vercel)

1. Importe o repositório do GitHub em <https://vercel.com>.
2. Framework preset: **Other** (o `vercel.json` cuida do roteamento p/ `api/index.js`).
3. Em **Settings → Environment Variables**, defina:
   - `DATA_SOURCE = supabase`
   - `SUPABASE_URL`, `SUPABASE_KEY`
   - `JWT_SECRET` (gere um forte, ex.: `openssl rand -hex 32`)
   - `CORS_ORIGIN` (URL do frontend)
4. Deploy. Valide em `https://<seu-app>.vercel.app/api/health`.

## 6. Frontend (Jorge) — entra neste mesmo repositório

O backend vive na raiz. Ao adicionar o frontend, prefira uma pasta `frontend/`
(ou um projeto Vercel separado apontando para ela), consumindo a API por
`Authorization: Bearer <token>`. A referência dos endpoints está em
[`docs/API.md`](API.md).
