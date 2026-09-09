# Estratégia de testes

> Ver rastreabilidade completa (HU → RF → RN → teste) em
> [`rastreabilidade.md`](./rastreabilidade.md).

## Níveis de teste (pastas)

- `tests/unit` — regras puras de `src/domain` (sem HTTP, sem banco). Cobre
  fronteiras (RN01 antecedência, RN02 conflito, RN05 duração) e transições
  válidas/inválidas de status (RN03/RN04, cancelamento).
- `tests/integration` — API + service + repositório em memória, verificando
  **estado final no repositório**, não só o status HTTP.
- `tests/system` — fluxo HTTP completo (Supertest), equivalente ao "E2E" do
  documento de requisitos. Testes de navegador (Playwright) ficam pendentes
  até o Frontend existir — ver a seção de lacunas em `rastreabilidade.md`.

Convenção de nomenclatura: todo `describe` cita o identificador do requisito
(`RNxx — <regra>` em unidade, `RFxx — <ação>` em integração, `HUxx — <fluxo>`
em sistema), para a rastreabilidade ser verificável e não só declarada.

## Por que os testes de integração/sistema não batem no Supabase real

O backend expõe os repositórios (`src/repositories`) atrás da mesma interface
para duas implementações: `memory` (usada em dev/test/CI) e `supabase`
(produção). Os testes de integração e sistema deste projeto usam a
implementação em memória via `tests/helpers/buildTestApp.js` — **não é um
mock**: é uma implementação real da mesma interface (`create`, `findById`,
`list...`, `updateStatus`), apenas com armazenamento em memória em vez de
Postgres. Isso permite:

- rodar a suíte completa no CI sem cadastrar segredos do Supabase;
- isolamento total entre testes (cada `buildTestApp()` cria repositórios com
  estado próprio, sem necessidade de limpar um banco compartilhado).

O que isso **não** cobre: comportamento específico do Postgres/Supabase (SQL,
constraints do schema, RLS). Essa lacuna fica registrada em
`rastreabilidade.md` e pode ser endereçada depois com uma suíte adicional
contra um projeto Supabase de teste, se o grupo decidir provisioná-lo.

## Cobertura

Configurada em `jest.config.js` → `coverageThreshold`, aplicada tanto local
(`npm run test:coverage`) quanto no CI:

- **100%** de statements/lines/functions em `src/domain` (regras de negócio
  puras RN01-RN05) — é a camada mais crítica e mais barata de cobrir 100%.
- **70%** global (statements/lines/functions) no restante do backend
  (controllers, services, repositories, routes, middlewares).

Um PR que derrubar a cobertura abaixo desses limites falha no job `test` da
CI (`.github/workflows/ci.yml`), não apenas no relatório.

## CI (GitHub Actions)

`.github/workflows/ci.yml` roda em todo push/PR para `main`:

- job `lint` — `npm run lint` (ESLint);
- job `test` — matrix Node 18/20, `npm run test:coverage` com
  `DATA_SOURCE=memory` (sem segredos), cobertura publicada como artifact
  (`coverage-report`, gerado no run com Node 20).

Ambos os jobs precisam terminar em verde para o PR ficar mergeable — nenhum
step usa `continue-on-error` nem `|| true`.

## Proteção da branch `main`

A configurar em **Settings → Branches → Branch protection rules** (ou
*Rulesets*) para `main`, por alguém com permissão de admin no repositório
(o QA não tem essa permissão neste repo — confirmado via API em 2026-09-09):

1. Require a pull request before merging
2. Require approvals: **1**
3. Require status checks to pass before merging → selecionar os checks
   `Lint` e `Testes (Node 18)` / `Testes (Node 20)` (nomes dos jobs de
   `ci.yml`) — só aparecem na lista depois que o workflow rodar pelo menos
   uma vez em um PR
4. Require branches to be up to date before merging
5. Block force pushes
6. Require conversation resolution before merging

Depois de aplicar: validar tentando `git push` direto na `main` (deve ser
recusado) e guardar um print como evidência para a apresentação.

**Status atual: pendente de aplicação** (ver `rastreabilidade.md` /
`README.md` → "Para o próximo colaborador").
