# Estrategia de testes

> Preenchido pelo QA. Ver rastreabilidade em [`rastreabilidade.md`](./rastreabilidade.md).

Este documento sera detalhado no PR `docs/qualidade` (ultima etapa da sequencia de
QA). Por ora, contem apenas a decisao de arquitetura ja tomada:

## Por que os testes de integracao/sistema nao batem no Supabase real

O backend expoe os repositorios (`src/repositories`) atras da mesma interface para
duas implementacoes: `memory` (usada em dev/test/CI) e `supabase` (producao). Os
testes de integracao e sistema deste projeto usam a implementacao em memoria via
`tests/helpers/buildTestApp.js` — **nao e um mock**: e uma implementacao real da
mesma interface (`create`, `findById`, `list...`, `updateStatus`), apenas com
armazenamento em memoria em vez de Postgres. Isso permite:

- rodar a suite completa no CI sem cadastrar segredos do Supabase;
- isolamento total entre testes (cada `buildTestApp()` cria repositorios com estado
  proprio, sem necessidade de limpar um banco compartilhado).

O que isso **nao** cobre: comportamento especifico do Postgres/Supabase (SQL,
constraints do schema, RLS). Essa lacuna fica registrada em
`rastreabilidade.md` e pode ser endereçada depois com uma suite adicional contra um
projeto Supabase de teste, se o grupo decidir provisiona-lo.

## Niveis de teste (pastas)

- `tests/unit` — regras puras de `src/domain` (sem HTTP, sem banco).
- `tests/integration` — API + service + repositorio em memoria, verificando
  estado final via repositorio, nao so o status HTTP.
- `tests/system` — fluxo HTTP completo (Supertest), equivalente ao "E2E" do
  documento de requisitos. Testes de navegador (Playwright) ficam pendentes até
  o Frontend existir — ver observacao na secao de lacunas de `rastreabilidade.md`.

Detalhamento completo (proteção de branch, passo a passo de validação) sera
adicionado no PR `docs/qualidade`.
