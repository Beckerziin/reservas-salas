'use strict';

const jwt = require('jsonwebtoken');

/**
 * Encapsula a geracao/verificacao de JWT.
 * Recebe a config por injecao (facilita testes com segredo proprio).
 */
function criarTokenService({ jwtSecret, jwtExpiresIn = '1d' }) {
  if (!jwtSecret) {
    throw new Error('tokenService: jwtSecret e obrigatorio');
  }
  return {
    assinar(payload) {
      return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
    },
    verificar(token) {
      return jwt.verify(token, jwtSecret);
    },
  };
}

module.exports = { criarTokenService };
