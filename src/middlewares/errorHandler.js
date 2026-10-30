'use strict';

const { AppError } = require('../domain/errors');
const { env } = require('../config/env');

/**
 * Tratador central de erros. Traduz erros de dominio (AppError) em respostas
 * JSON consistentes e evita vazar detalhes internos ao cliente.
 *
 * Formato de erro:
 *   { "erro": { "codigo": "...", "mensagem": "..." } }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Corpo JSON malformado (lancado por express.json()).
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({
      erro: { codigo: 'JSON_INVALIDO', mensagem: 'Corpo da requisicao nao e um JSON valido' },
    });
  }

  // Corpo acima do limite de express.json().
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      erro: { codigo: 'CORPO_MUITO_GRANDE', mensagem: 'Corpo da requisicao excede o limite' },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      erro: { codigo: err.codigo, mensagem: err.message },
    });
  }

  // Erro inesperado: loga no servidor, responde generico.
  console.error('[erro-inesperado]', err);
  return res.status(500).json({
    erro: {
      codigo: 'ERRO_INTERNO',
      mensagem: 'Erro interno no servidor',
      ...(env.isProduction ? {} : { detalhe: String(err.message || err) }),
    },
  });
}

module.exports = { errorHandler };
