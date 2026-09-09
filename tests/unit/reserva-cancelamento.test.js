'use strict';

/**
 * Unidade — RN03 (so o autor cancela) e RN04 (reserva passada nao cancela).
 * `podeCancelar` e a unica porta de saida de status "ativa" -> "cancelada"
 * neste dominio: nao existe funcao de reativacao, entao nao ha transicao
 * "cancelada -> ativa" para testar (ver docs/qualidade/rastreabilidade.md,
 * secao de lacunas).
 */
const { podeCancelar } = require('../../src/domain/reservaRules');

const AGORA = new Date('2026-09-10T12:00:00.000Z');
const HORA = 60 * 60 * 1000;

function reservaAtiva(overrides = {}) {
  return {
    usuarioId: 'dono-1',
    status: 'ativa',
    inicio: new Date(AGORA.getTime() + 2 * HORA),
    ...overrides,
  };
}

describe('RN03 — apenas o autor da reserva pode cancelar', () => {
  test('dono cancela reserva futura com sucesso', () => {
    expect(podeCancelar(reservaAtiva(), 'dono-1', AGORA)).toEqual({ ok: true });
  });

  test('terceiro (nao dono) nao pode cancelar', () => {
    expect(podeCancelar(reservaAtiva(), 'outro-usuario', AGORA)).toEqual({
      ok: false,
      motivo: 'NAO_E_DONO',
    });
  });

  test('comparacao de dono e por string (funciona com ids numericos/uuid misturados)', () => {
    expect(podeCancelar(reservaAtiva({ usuarioId: 42 }), '42', AGORA)).toEqual({ ok: true });
  });
});

describe('RN04 — reserva passada ou em curso nao pode ser cancelada', () => {
  test('reserva cujo inicio ja passou nao pode ser cancelada pelo dono', () => {
    const passada = reservaAtiva({ inicio: new Date(AGORA.getTime() - HORA) });
    expect(podeCancelar(passada, 'dono-1', AGORA)).toEqual({
      ok: false,
      motivo: 'RESERVA_PASSADA',
    });
  });

  test('reserva cujo inicio e exatamente "agora" (fronteira) e tratada como passada', () => {
    const noLimite = reservaAtiva({ inicio: AGORA });
    expect(podeCancelar(noLimite, 'dono-1', AGORA)).toEqual({
      ok: false,
      motivo: 'RESERVA_PASSADA',
    });
  });

  test('reserva 1ms no futuro ainda pode ser cancelada', () => {
    const quaseAgora = reservaAtiva({ inicio: new Date(AGORA.getTime() + 1) });
    expect(podeCancelar(quaseAgora, 'dono-1', AGORA)).toEqual({ ok: true });
  });
});

describe('cancelamento de reserva ja cancelada', () => {
  test('reserva ja cancelada nao pode ser cancelada de novo, mesmo pelo dono', () => {
    const cancelada = reservaAtiva({ status: 'cancelada' });
    expect(podeCancelar(cancelada, 'dono-1', AGORA)).toEqual({
      ok: false,
      motivo: 'JA_CANCELADA',
    });
  });

  test('status "ja cancelada" prevalece mesmo quando quem tenta nao e o dono', () => {
    const cancelada = reservaAtiva({ status: 'cancelada' });
    expect(podeCancelar(cancelada, 'outro-usuario', AGORA)).toEqual({
      ok: false,
      motivo: 'JA_CANCELADA',
    });
  });
});
