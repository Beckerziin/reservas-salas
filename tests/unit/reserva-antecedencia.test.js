'use strict';

/**
 * Unidade — RN01: reserva exige >= 30 minutos de antecedencia em relacao a
 * "agora". Todas as datas sao injetadas (nunca `new Date()` solto), para o
 * teste ser deterministico independente de quando/onde rodar.
 */
const { temAntecedenciaMinima } = require('../../src/domain/reservaRules');

const MIN = 60 * 1000;
const AGORA = new Date('2026-09-10T12:00:00.000Z');

describe('RN01 — reserva exige 30 min de antecedencia', () => {
  test('rejeita reserva para daqui a 10 minutos (abaixo do limite)', () => {
    const inicio = new Date(AGORA.getTime() + 10 * MIN);
    expect(temAntecedenciaMinima(inicio, AGORA)).toBe(false);
  });

  test('rejeita reserva para 1ms abaixo do limite exato (29min59s999ms)', () => {
    const inicio = new Date(AGORA.getTime() + 30 * MIN - 1);
    expect(temAntecedenciaMinima(inicio, AGORA)).toBe(false);
  });

  test('aceita reserva exatamente na fronteira dos 30 minutos', () => {
    const inicio = new Date(AGORA.getTime() + 30 * MIN);
    expect(temAntecedenciaMinima(inicio, AGORA)).toBe(true);
  });

  test('aceita reserva para daqui a 3 horas (acima do limite)', () => {
    const inicio = new Date(AGORA.getTime() + 3 * 60 * MIN);
    expect(temAntecedenciaMinima(inicio, AGORA)).toBe(true);
  });

  test('rejeita reserva com horario no passado', () => {
    const inicio = new Date(AGORA.getTime() - MIN);
    expect(temAntecedenciaMinima(inicio, AGORA)).toBe(false);
  });

  test('rejeita reserva com horario igual a agora', () => {
    expect(temAntecedenciaMinima(AGORA, AGORA)).toBe(false);
  });

  test('aceita datas em formato string ISO (nao apenas objetos Date)', () => {
    expect(
      temAntecedenciaMinima('2026-09-10T12:45:00.000Z', '2026-09-10T12:00:00.000Z')
    ).toBe(true);
  });
});
