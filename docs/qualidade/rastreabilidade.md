# Tabela de Rastreabilidade

Liga **história de usuário → requisito funcional → regra de negócio → nível de
teste → arquivo que prova aquilo**. Baseada no documento de requisitos (v1.0).

## Regras de negócio (implementação)

| Regra | Descrição | Implementação | Erro na API |
|-------|-----------|---------------|-------------|
| RN01 | reserva com ≥ 30 min de antecedência | `reservaRules.temAntecedenciaMinima` | `400 ANTECEDENCIA_INSUFICIENTE` |
| RN02 | sem sobreposição na mesma sala (ativas) | `reservaRules.conflitaComReservas` | `409 CONFLITO_HORARIO` |
| RN03 | só o autor cancela | `reservaRules.podeCancelar` (`NAO_E_DONO`) | `403 NAO_E_DONO` |
| RN04 | reserva passada não cancela | `reservaRules.podeCancelar` (`RESERVA_PASSADA`) | `400 RESERVA_PASSADA` |
| RN05 | duração máx. 2 h | `reservaRules.duracaoValida` | `400 DURACAO_INVALIDA` |

## HU → RF → RN → teste

| História | Requisito | Regra | Nível | Arquivo do teste |
|----------|-----------|-------|-------|-------------------|
| HU01 Cadastro | RF01 | validação de e-mail/campos obrigatórios | unidade | `tests/unit/validacoes.test.js` |
| HU01 Cadastro | RF01 | e-mail único, cadastro válido | integração | `tests/integration/api-usuarios.test.js` |
| HU01-HU04 Cadastro → login → reservar → consultar | RF01, RF02, RF04-RF06 | RN01, RN02, RN05 | sistema | `tests/system/fluxo-criar-reserva.test.js` |
| HU02 Login | RF02 | credenciais válidas/inválidas, sessão (`/auth/me`) | integração | `tests/integration/api-auth.test.js` |
| HU03 Reservar | RF04, RF05 | RN01 (antecedência) | unidade | `tests/unit/reserva-antecedencia.test.js` |
| HU03 Reservar | RF04, RF05 | RN02 (conflito de horário) | unidade | `tests/unit/reserva-conflito.test.js` |
| HU03 Reservar | RF04, RF05 | RN05 (duração máxima) | unidade | `tests/unit/reserva-duracao.test.js` |
| HU03 Reservar | RF04, RF05 | RN01, RN02, RN05, parsing de datas | integração | `tests/integration/api-reservas.test.js` |
| HU03 Reservar | RF04, RF05 | RN02 — tentar reservar horário ocupado | sistema | `tests/system/fluxo-erro-conflito-horario.test.js` |
| HU04 Consultar | RF06 | listar só as reservas do próprio usuário | integração | `tests/integration/api-reservas.test.js` |
| HU05 Cancelar | RF07 | RN03 (só o dono cancela) | unidade | `tests/unit/reserva-cancelamento.test.js` |
| HU05 Cancelar | RF07 | RN04 (reserva passada não cancela) | unidade | `tests/unit/reserva-cancelamento.test.js` |
| HU05 Cancelar | RF07 | RN03, RN04, libera horário após cancelar | integração | `tests/integration/api-reservas.test.js` |
| HU05 Cancelar | RF07 | RN03 — cancelar e ver refletido na listagem | sistema | `tests/system/fluxo-cancelar-reserva.test.js` |
| HU-admin Salas | RF08 | cadastro de sala restrito a admin | integração | `tests/integration/api-salas.test.js` |
| — | RF03 | listar salas (rota pública) | integração | `tests/integration/api-salas.test.js` |
| — | — | health check / rota 404 padronizada | sistema | `tests/system/smoke.test.js` |
| — | — | normalização/validação de datas (`paraData`) | unidade | `tests/unit/reserva-parsing-data.test.js` |
| HU03 Reservar, HU04 Consultar | RF01, RF04-RF06 | RN01, RN02, RN05 | E2E (navegador) | `tests/e2e/fluxo-criar-reserva.spec.js` |
| HU03 Reservar | RF04, RF05 | RN02 — horário já ocupado, erro sem perder o formulário | E2E (navegador) | `tests/e2e/fluxo-erro-conflito-horario.spec.js` |
| HU05 Cancelar | RF07 | RN03/RN04 — cancelar e ver status mudar na tela | E2E (navegador) | `tests/e2e/fluxo-cancelar-reserva.spec.js` |

Toda regra RN01-RN05 aparece em pelo menos um nível de teste (unidade +
integração), conforme exigido.

## Lacunas conhecidas (não escondidas)

| Lacuna | Por quê | Mitigação atual | Quando resolver |
|--------|---------|------------------|------------------|
| Integração/sistema não batem em um Supabase de teste real (usam a implementação `memory`, mesma interface do repositório) | Não há projeto Supabase de teste provisionado para o grupo; rodar CI sem segredos era prioridade (ver [`estrategia-de-testes.md`](./estrategia-de-testes.md)) | A interface `memory`/`supabase` é idêntica e testada; o risco fica restrito a comportamento específico do Postgres (constraints de schema, SQL, RLS) | Se o grupo provisionar um Supabase de teste, adicionar uma suíte extra (`tests/integration-supabase/` ou similar) contra ele, sem remover a suíte em memória |
| ~~Testes de "sistema" são HTTP, não E2E de navegador~~ — **resolvido**: com o Frontend mergeado, `tests/e2e/` (Playwright/Chromium) cobre os 3 fluxos principais (criar, erro de conflito, cancelar) pela UI real | — | — | — |
| E2E (Playwright) roda com `workers: 1` e datas fixas por spec (amanhã/+2/+3 dias) | Os specs compartilham o mesmo processo de backend em memória (`playwright.config.js` sobe um único servidor); rodar em paralelo ou reusar o mesmo dia entre specs causaria falso conflito de horário (RN02) | Cada spec usa um dia diferente; suíte roda em série | Se a suíte crescer muito, isolar por sala em vez de por dia permitiria paralelismo |
| Sem teste dedicado de transição de status inválida (ex.: tentar reativar reserva `cancelada` diretamente) | Não há endpoint que permita essa transição hoje (só criar e cancelar) | N/A — superfície de ataque não existe no código atual | Reavaliar se o RF de edição/reagendamento de reserva for implementado |
