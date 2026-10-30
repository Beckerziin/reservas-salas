'use strict';

const { AppError } = require('../domain/errors');

// 429 - excesso de requisicoes (protecao contra bots / forca bruta)
class TooManyRequestsError extends AppError {
  constructor(message, codigo = 'MUITAS_TENTATIVAS') {
    super(message, 429, codigo);
  }
}

/**
 * Limitador de requisicoes por janela fixa, guardado em memoria.
 * Cada instancia tem o proprio contador (createApp cria uma por app, entao
 * os testes ficam isolados).
 *
 * Em serverless (Vercel) o contador vale por instancia: e uma barreira
 * contra bots e forca bruta, nao uma cota exata.
 *
 * @param {object} opcoes
 * @param {number} opcoes.janelaMs - tamanho da janela em ms
 * @param {number} opcoes.max - requisicoes permitidas por janela
 * @param {boolean} [opcoes.contarApenasFalhas] - so conta respostas >= 400
 *   (ex.: login: usuario legitimo que acerta a senha nao gasta tentativas)
 * @param {string} [opcoes.mensagem]
 */
function criarRateLimiter({
  janelaMs,
  max,
  contarApenasFalhas = false,
  mensagem = 'Muitas tentativas. Tente novamente mais tarde.',
}) {
  /** @type {Map<string, { total:number, expiraEm:number }>} */
  const contadores = new Map();

  function registroAtual(chave, agora) {
    const registro = contadores.get(chave);
    if (registro && registro.expiraEm > agora) return registro;
    const novo = { total: 0, expiraEm: agora + janelaMs };
    contadores.set(chave, novo);
    return novo;
  }

  return function limitar(req, res, next) {
    const agora = Date.now();
    const chave = req.ip || 'desconhecido';
    const registro = registroAtual(chave, agora);

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - registro.total)));

    if (registro.total >= max) {
      res.setHeader('Retry-After', String(Math.ceil((registro.expiraEm - agora) / 1000)));
      return next(new TooManyRequestsError(mensagem));
    }

    if (contarApenasFalhas) {
      res.on('finish', () => {
        if (res.statusCode >= 400) registro.total += 1;
      });
    } else {
      registro.total += 1;
    }
    return next();
  };
}

module.exports = { criarRateLimiter, TooManyRequestsError };
