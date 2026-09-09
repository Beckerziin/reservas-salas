'use strict';

/**
 * Unidade — validacoes puras usadas por RF01 (cadastro) e RF08 (cadastro de
 * sala): formato de e-mail e campos obrigatorios preenchidos.
 */
const {
  emailValido,
  textoPreenchido,
  STATUS_SALA,
  STATUS_RESERVA,
  PAPEIS,
} = require('../../src/domain/validacoes');

describe('RF01 — validacao de e-mail', () => {
  test.each([
    ['maria@exemplo.com', true],
    ['maria.silva@exemplo.com.br', true],
    ['sem-arroba.com', false],
    ['sem-dominio@', false],
    ['@sem-usuario.com', false],
    ['com espaco@exemplo.com', false],
    ['', false],
  ])('emailValido(%j) => %s', (entrada, esperado) => {
    expect(emailValido(entrada)).toBe(esperado);
  });

  test('rejeita valores que nao sao string (ex.: undefined, numero)', () => {
    expect(emailValido(undefined)).toBe(false);
    expect(emailValido(123)).toBe(false);
  });

  test('tolera espacos nas bordas (trim antes de validar)', () => {
    expect(emailValido('  maria@exemplo.com  ')).toBe(true);
  });
});

describe('Validacao de texto obrigatorio (nome de usuario, nome de sala)', () => {
  test('rejeita string vazia', () => {
    expect(textoPreenchido('')).toBe(false);
  });

  test('rejeita string somente com espacos', () => {
    expect(textoPreenchido('   ')).toBe(false);
  });

  test('aceita texto valido', () => {
    expect(textoPreenchido('Sala 1')).toBe(true);
  });

  test('rejeita campo ausente (undefined/null)', () => {
    expect(textoPreenchido(undefined)).toBe(false);
    expect(textoPreenchido(null)).toBe(false);
  });
});

describe('Enumeracoes de dominio', () => {
  test('STATUS_SALA cobre os status esperados', () => {
    expect(STATUS_SALA).toEqual(['disponivel', 'indisponivel', 'manutencao']);
  });

  test('STATUS_RESERVA cobre apenas ativa/cancelada (sem reativacao)', () => {
    expect(STATUS_RESERVA).toEqual(['ativa', 'cancelada']);
  });

  test('PAPEIS cobre user/admin', () => {
    expect(PAPEIS).toEqual(['user', 'admin']);
  });
});
