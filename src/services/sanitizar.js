'use strict';

/**
 * Remove campos sensiveis do usuario antes de devolve-lo pela API.
 * NUNCA expor senhaHash (RNF03).
 */
function sanitizarUsuario(usuario) {
  if (!usuario) return usuario;
  // eslint-disable-next-line no-unused-vars
  const { senhaHash, ...publico } = usuario;
  return publico;
}

module.exports = { sanitizarUsuario };
