'use strict';

// Validacoes puras e reutilizaveis (tambem faceis de testar em unidade).

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailValido(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function textoPreenchido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

const STATUS_SALA = ['disponivel', 'indisponivel', 'manutencao'];
const STATUS_RESERVA = ['ativa', 'cancelada'];
const PAPEIS = ['user', 'admin'];

module.exports = {
  EMAIL_REGEX,
  emailValido,
  textoPreenchido,
  STATUS_SALA,
  STATUS_RESERVA,
  PAPEIS,
};
