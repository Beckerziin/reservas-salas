'use strict';

/**
 * Unidade — RN05: duracao da reserva deve ser positiva e no maximo 2 horas.
 */
const { duracaoValida } = require('../../src/domain/reservaRules');

const HORA = 60 * 60 * 1000;
const BASE = new Date('2026-09-10T10:00:00.000Z');

describe('RN05 — duracao maxima de 2 horas', () => {
  test('aprova duracao de 2 horas exatas (fronteira)', () => {
    expect(duracaoValida(BASE, new Date(BASE.getTime() + 2 * HORA))).toBe(true);
  });

  test('reprova duracao 1ms acima de 2 horas', () => {
    expect(duracaoValida(BASE, new Date(BASE.getTime() + 2 * HORA + 1))).toBe(false);
  });

  test('aprova duracao minima positiva (1 minuto)', () => {
    expect(duracaoValida(BASE, new Date(BASE.getTime() + 60 * 1000))).toBe(true);
  });

  test('reprova duracao zero (fim igual ao inicio)', () => {
    expect(duracaoValida(BASE, BASE)).toBe(false);
  });

  test('reprova duracao negativa (fim antes do inicio)', () => {
    expect(duracaoValida(BASE, new Date(BASE.getTime() - HORA))).toBe(false);
  });

  test('reprova duracao de 3 horas', () => {
    expect(duracaoValida(BASE, new Date(BASE.getTime() + 3 * HORA))).toBe(false);
  });
});
