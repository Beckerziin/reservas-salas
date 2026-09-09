'use strict';

/**
 * Unidade — `paraData`, usada internamente por todas as regras de RN01/RN02/
 * RN05 para normalizar Date|string em Date. Cobre o caso de horario invalido
 * (RF04/RF05 -> erro HORARIO_INVALIDO no service).
 */
const { paraData } = require('../../src/domain/reservaRules');

describe('paraData — normalizacao de datas', () => {
  test('aceita instancia de Date e retorna a mesma data', () => {
    const d = new Date('2026-09-10T10:00:00Z');
    expect(paraData(d)).toBe(d);
  });

  test('aceita string ISO valida e converte para Date', () => {
    const resultado = paraData('2026-09-10T10:00:00Z');
    expect(resultado).toBeInstanceOf(Date);
    expect(resultado.toISOString()).toBe('2026-09-10T10:00:00.000Z');
  });

  test('lanca RangeError para string invalida', () => {
    expect(() => paraData('nao-e-uma-data')).toThrow(RangeError);
  });

  test('lanca RangeError para valores vazios/indefinidos', () => {
    expect(() => paraData('')).toThrow(RangeError);
    expect(() => paraData(undefined)).toThrow(RangeError);
  });
});
