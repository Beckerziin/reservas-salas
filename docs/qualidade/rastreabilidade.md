# Tabela de Rastreabilidade

Liga **história de usuário → requisito funcional → regra de negócio → teste**.
Baseada no documento de requisitos (v1.0). Serve de guia para o QA escolher
**o que** testar (evita "testar qualquer coisa").

| História | Requisito | Regra | Onde vive no código | Teste sugerido |
|----------|-----------|-------|---------------------|----------------|
| HU01 Cadastro | RF01 | e-mail único/válido | `services/usuariosService.js` | Sistema: cadastro (201) + e-mail duplicado (409) |
| HU02 Login | RF02 | credenciais válidas | `services/authService.js` | Integração: login válido/inválido (200/401) |
| HU03 Reservar | RF04, RF05 | RN01, RN02, RN05 | `domain/reservaRules.js`, `services/reservasService.js` | Unidade: regras puras · Integração: criar reserva válida · Sistema: impedir conflito (409) |
| HU04 Consultar | RF06 | — | `services/reservasService.js` | Sistema: listar só as reservas do próprio usuário |
| HU05 Cancelar | RF07 | RN03, RN04 | `domain/reservaRules.js` (`podeCancelar`) | Unidade: validar regra de cancelamento · Sistema: cancelar libera horário |

## Regras de negócio (implementação)

| Regra | Descrição | Implementação | Erro na API |
|-------|-----------|---------------|-------------|
| RN01 | reserva com ≥ 30 min de antecedência | `reservaRules.temAntecedenciaMinima` | `400 ANTECEDENCIA_INSUFICIENTE` |
| RN02 | sem sobreposição na mesma sala (ativas) | `reservaRules.conflitaComReservas` | `409 CONFLITO_HORARIO` |
| RN03 | só o autor cancela | `reservaRules.podeCancelar` (`NAO_E_DONO`) | `403 NAO_E_DONO` |
| RN04 | reserva passada não cancela | `reservaRules.podeCancelar` (`RESERVA_PASSADA`) | `400 RESERVA_PASSADA` |
| RN05 | duração máx. 2 h | `reservaRules.duracaoValida` | `400 DURACAO_INVALIDA` |

## Sugestão de cobertura mínima (3 níveis)

1. **Unidade** (`src/domain`): RN01, RN02, RN03/RN04, RN05 — já há um exemplo em
   `tests/exemplo-unidade.reservaRules.test.js`.
2. **Integração** (service + repositório em memória): criar reserva válida;
   bloquear conflito; login válido/inválido.
3. **Sistema** (HTTP com Supertest, via `tests/helpers/buildTestApp.js`): fluxo
   cadastro → login → reservar → consultar → cancelar.
