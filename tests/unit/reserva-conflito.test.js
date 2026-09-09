'use strict';

/**
 * Unidade — RN02: sem sobreposicao de horario na mesma sala (reservas ativas).
 * `conflitaComReservas` recebe apenas as reservas ATIVAS da sala em questao —
 * "sala diferente" e coberto pelo caso "lista vazia" (o service filtra por
 * sala antes de chamar esta funcao; ver tests/integration).
 */
const { haSobreposicao, conflitaComReservas } = require('../../src/domain/reservaRules');

describe('RN02 — deteccao de sobreposicao (haSobreposicao)', () => {
  const existente = { inicio: '2026-09-10T10:00:00Z', fim: '2026-09-10T11:00:00Z' };

  test('sobreposicao total (nova reserva contida na existente)', () => {
    expect(
      haSobreposicao('2026-09-10T10:15:00Z', '2026-09-10T10:45:00Z', existente.inicio, existente.fim)
    ).toBe(true);
  });

  test('sobreposicao parcial no inicio (nova comeca antes e termina dentro)', () => {
    expect(
      haSobreposicao('2026-09-10T09:30:00Z', '2026-09-10T10:30:00Z', existente.inicio, existente.fim)
    ).toBe(true);
  });

  test('sobreposicao parcial no fim (nova comeca dentro e termina depois)', () => {
    expect(
      haSobreposicao('2026-09-10T10:30:00Z', '2026-09-10T11:30:00Z', existente.inicio, existente.fim)
    ).toBe(true);
  });

  test('horarios apenas se encostam no inicio (fim da nova == inicio da existente) nao conflita', () => {
    expect(
      haSobreposicao('2026-09-10T09:00:00Z', '2026-09-10T10:00:00Z', existente.inicio, existente.fim)
    ).toBe(false);
  });

  test('horarios apenas se encostam no fim (inicio da nova == fim da existente) nao conflita', () => {
    expect(
      haSobreposicao('2026-09-10T11:00:00Z', '2026-09-10T12:00:00Z', existente.inicio, existente.fim)
    ).toBe(false);
  });

  test('intervalos completamente distantes nao conflitam', () => {
    expect(
      haSobreposicao('2026-09-10T14:00:00Z', '2026-09-10T15:00:00Z', existente.inicio, existente.fim)
    ).toBe(false);
  });
});

describe('RN02 — conflitaComReservas (contra a lista de reservas ativas da sala)', () => {
  const ativasDaSala = [
    { id: 'r1', inicio: '2026-09-10T10:00:00Z', fim: '2026-09-10T11:00:00Z' },
    { id: 'r2', inicio: '2026-09-10T13:00:00Z', fim: '2026-09-10T14:00:00Z' },
  ];

  test('detecta conflito quando sobrepoe uma das reservas ativas', () => {
    const nova = { inicio: '2026-09-10T10:30:00Z', fim: '2026-09-10T10:45:00Z' };
    expect(conflitaComReservas(nova, ativasDaSala)).toBe(true);
  });

  test('nao conflita quando o horario esta livre entre as reservas ativas', () => {
    const nova = { inicio: '2026-09-10T11:00:00Z', fim: '2026-09-10T13:00:00Z' };
    expect(conflitaComReservas(nova, ativasDaSala)).toBe(false);
  });

  test('sala sem nenhuma reserva ativa (lista vazia) nunca conflita', () => {
    const nova = { inicio: '2026-09-10T10:30:00Z', fim: '2026-09-10T10:45:00Z' };
    expect(conflitaComReservas(nova, [])).toBe(false);
  });

  test('reserva cancelada da mesma sala nao deve chegar na lista (contrato da funcao)', () => {
    // conflitaComReservas confia que o caller (service) so passa ATIVAS.
    // Se uma cancelada for passada por engano, ela ainda "conflita" no nivel
    // desta funcao pura — a responsabilidade de filtrar e do repositorio
    // (listAtivasBySala), testado em integracao.
    const canceladaMasPassadaComoAtiva = [
      { id: 'r1', inicio: '2026-09-10T10:00:00Z', fim: '2026-09-10T11:00:00Z', status: 'cancelada' },
    ];
    const nova = { inicio: '2026-09-10T10:30:00Z', fim: '2026-09-10T10:45:00Z' };
    expect(conflitaComReservas(nova, canceladaMasPassadaComoAtiva)).toBe(true);
  });
});
