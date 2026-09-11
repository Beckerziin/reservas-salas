# Estratégia de testes

> Ver rastreabilidade completa (HU → RF → RN → teste) em
> [`rastreabilidade.md`](./rastreabilidade.md).

## Níveis de teste (pastas)

- `tests/unit` — regras puras de `src/domain` (sem HTTP, sem banco). Cobre
  fronteiras (RN01 antecedência, RN02 conflito, RN05 duração) e transições
  válidas/inválidas de status (RN03/RN04, cancelamento).
- `tests/integration` — API + service + repositório em memória, verificando
  **estado final no repositório**, não só o status HTTP.
- `tests/system` — fluxo HTTP completo (Supertest), sem navegador.
- `tests/e2e` — Playwright/Chromium contra a aplicação real: backend Express
  (memória + seed) e frontend React/Vite (dev server) sobem juntos via
  `playwright.config.js` (`webServer`), o navegador conversa com o front pelo
  proxy `/api` (igual em produção). Cobre os 3 fluxos principais escolhidos
  (ver seção seguinte) — poucos e não-frágeis, seletores por `getByRole`/
  `getByLabel` (o front não tem `data-testid`, mas usa `<label>`/`<button>`
  semânticos, então não precisou pedir mudança ao Frontend).

Convenção de nomenclatura: todo `describe` cita o identificador do requisito
(`RNxx — <regra>` em unidade, `RFxx — <ação>` em integração, `HUxx — <fluxo>`
em sistema/E2E), para a rastreabilidade ser verificável e não só declarada.

## Os 3 fluxos E2E escolhidos (e por quê só 3)

"Três E2E bem escolhidos valem mais que quinze frágeis": cada um dos 3 specs
usa um dia distinto (amanhã / +2 / +3 dias) porque compartilham o mesmo
processo de backend em memória dentro de uma mesma execução — sem isso,
reservas de specs diferentes na mesma sala/horário dariam falso-conflito
(RN02). A suíte roda com `workers: 1` por segurança.

1. `fluxo-criar-reserva.spec.js` — caminho feliz: cadastro → escolhe sala →
   define data/horário → confirma → mensagem de sucesso → reserva aparece em
   "Minhas reservas" (HU03 + HU04).
2. `fluxo-erro-conflito-horario.spec.js` — caminho de erro: reserva um
   horário já ocupado na mesma sala → mensagem de erro clara → tela e dados
   digitados preservados (RN02).
3. `fluxo-cancelar-reserva.spec.js` — cancelamento: localiza a própria
   reserva, cancela, vê o status mudar na tela (HU05).

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

- job `lint` — `npm run lint` (ESLint na raiz; `frontend/` fica de fora via
  `.eslintignore` porque tem seu próprio linter, `oxlint` — o ESLint do
  backend, em CommonJS, não entende o ESM/JSX do front);
- job `test` — matrix Node 18/20, `npm run test:coverage` com
  `DATA_SOURCE=memory` (sem segredos), cobertura publicada como artifact
  (`coverage-report`, gerado no run com Node 20);
- job `e2e` — Node 20 (Vite exige `^20.19` ou `>=22.12`, por isso não entra
  na matrix 18/20 do job `test`), instala backend e frontend, `npx playwright
  install --with-deps chromium`, `npm run test:e2e`, publica
  `playwright-report/` como artifact.

Todos os jobs precisam terminar em verde para o PR ficar mergeable — nenhum
step usa `continue-on-error` nem `|| true`.

## Proteção da branch `main`

**Status atual: já existe uma Ruleset ativa** (`Settings → Rules → Rulesets`,
"Deafault Ruleset", criada em 2026-09-09 pelo dono do repo) cobrindo a
`main` (`~DEFAULT_BRANCH`), confirmada via API em 2026-09-10:

- bloqueia deleção da branch e force-push (`non_fast_forward`) — **funciona**
  (validado: PRs #3/#4 só entraram via merge normal, nenhum push direto foi
  tentado, e a regra recusaria);
- exige PR + **1 aprovação**, com resolução de conversas obrigatória — **sem
  bypass para ninguém** (`current_user_can_bypass: never`, nem admin escapa),
  confirmado na prática: o próprio QA não conseguiu mergear PR próprio sem
  aprovação de outro colaborador (PR #3, 2026-09-10);
- exige status checks `test` e `CI` antes de mergear.

**Bug encontrado (pendente, precisa de admin para corrigir):** os nomes de
check exigidos (`test`, `CI`) **não existem** — os jobs reais do
`ci.yml` se chamam `Lint`, `Testes (Node 18)`, `Testes (Node 20)` e
`E2E (Playwright)`. Isso não travou os merges feitos até aqui porque a régua
antiga tolerou checks inexistentes, mas deixa a proteção de status check
efetivamente **inativa** — um PR quebrado no CI ainda passaria pela Ruleset.
Ação necessária (admin do repo, `Settings → Rules → Rulesets → Deafault
Ruleset → Required status checks`): remover `test`/`CI` e adicionar `Lint`,
`Testes (Node 18)`, `Testes (Node 20)` e `E2E (Playwright)` (só aparecem na
lista depois de rodar pelo menos uma vez em um PR — já rodaram, ver PR #6).

Evidência para a apresentação: prints da Ruleset (`gh api
repos/Beckerziin/reservas-salas/rulesets/<id>`) e do merge de PR bloqueado
por falta de aprovação (PR #3).
