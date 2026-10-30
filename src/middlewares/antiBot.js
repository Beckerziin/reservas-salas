'use strict';

const { ValidationError } = require('../domain/errors');

// Campo invisivel no formulario de cadastro. Pessoas nao o veem nem
// preenchem; bots que preenchem todos os inputs do HTML caem aqui.
const CAMPO_HONEYPOT = 'website';

/**
 * Rejeita a requisicao se o campo honeypot vier preenchido.
 * Resposta generica de proposito: nao dizer ao bot o que o denunciou.
 */
function honeypot(req, _res, next) {
  const valor = req.body && req.body[CAMPO_HONEYPOT];
  if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
    return next(new ValidationError('Requisicao rejeitada', 'REQUISICAO_SUSPEITA'));
  }
  return next();
}

module.exports = { honeypot, CAMPO_HONEYPOT };
