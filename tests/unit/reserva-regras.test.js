'use strict';

/**
 * EXEMPLO / MODELO de teste de UNIDADE (nivel 1).
 * Demonstra como testar as regras de negocio puras, que sao a base da
 * tabela de rastreabilidade. O QA (Ian) pode manter, ampliar ou substituir.
 *
 * Cobre: RN01 (antecedencia), RN05 (duracao), RN02 (sobreposicao),
 *        RN03/RN04 (cancelamento).
 */
const rules = require('../../src/domain/reservaRules');

const MIN = 60 * 1000;
const HORA = 60 * MIN;

describe('reservaRules (unidade)', () => {
  describe('RN01 - antecedencia minima de 30 min', () => {
    test('reprova reserva daqui a 10 minutos', () => {
      const inicio = new Date(Date.now() + 10 * MIN);
      expect(rules.temAntecedenciaMinima(inicio)).toBe(false);
    });
    test('aprova reserva daqui a 45 minutos', () => {
      const inicio = new Date(Date.now() + 45 * MIN);
      expect(rules.temAntecedenciaMinima(inicio)).toBe(true);
    });
  });

  describe('RN05 - duracao maxima de 2 horas', () => {
    const base = new Date('2026-09-10T10:00:00Z');
    test('aprova 2 horas exatas', () => {
      expect(rules.duracaoValida(base, new Date(base.getTime() + 2 * HORA))).toBe(true);
    });
    test('reprova 3 horas', () => {
      expect(rules.duracaoValida(base, new Date(base.getTime() + 3 * HORA))).toBe(false);
    });
    test('reprova duracao negativa/zero', () => {
      expect(rules.duracaoValida(base, base)).toBe(false);
    });
  });

  describe('RN02 - sobreposicao de horario', () => {
    const ativas = [{ inicio: '2026-09-10T10:00:00Z', fim: '2026-09-10T11:00:00Z' }];
    test('detecta conflito quando ha sobreposicao', () => {
      const nova = { inicio: '2026-09-10T10:30:00Z', fim: '2026-09-10T11:30:00Z' };
      expect(rules.conflitaComReservas(nova, ativas)).toBe(true);
    });
    test('nao conflita quando horarios apenas se encostam', () => {
      const nova = { inicio: '2026-09-10T11:00:00Z', fim: '2026-09-10T12:00:00Z' };
      expect(rules.conflitaComReservas(nova, ativas)).toBe(false);
    });
  });

  describe('RN03/RN04 - cancelamento', () => {
    const futura = { usuarioId: 'u1', status: 'ativa', inicio: new Date(Date.now() + 2 * HORA) };
    test('dono pode cancelar reserva futura', () => {
      expect(rules.podeCancelar(futura, 'u1').ok).toBe(true);
    });
    test('RN03 - outro usuario nao pode cancelar', () => {
      expect(rules.podeCancelar(futura, 'u2')).toEqual({ ok: false, motivo: 'NAO_E_DONO' });
    });
    test('RN04 - reserva passada nao pode ser cancelada', () => {
      const passada = { usuarioId: 'u1', status: 'ativa', inicio: new Date(Date.now() - HORA) };
      expect(rules.podeCancelar(passada, 'u1')).toEqual({ ok: false, motivo: 'RESERVA_PASSADA' });
    });
  });
});
