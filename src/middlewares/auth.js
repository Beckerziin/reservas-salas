'use strict';

const { UnauthorizedError, ForbiddenError } = require('../domain/errors');

/**
 * Cria o middleware de autenticacao JWT.
 * Le o header "Authorization: Bearer <token>", valida e popula req.usuario.
 */
function criarAuthMiddleware({ tokenService }) {
  return function autenticar(req, _res, next) {
    const header = req.headers.authorization || '';
    const [tipo, token] = header.split(' ');

    if (tipo !== 'Bearer' || !token) {
      return next(new UnauthorizedError('Token de autenticacao ausente'));
    }

    try {
      const payload = tokenService.verificar(token);
      req.usuario = {
        id: payload.sub,
        email: payload.email,
        papel: payload.papel,
      };
      return next();
    } catch {
      return next(new UnauthorizedError('Token invalido ou expirado'));
    }
  };
}

/**
 * Restringe a rota a usuarios com papel "admin" (usar apos autenticar).
 */
function apenasAdmin(req, _res, next) {
  if (!req.usuario || req.usuario.papel !== 'admin') {
    return next(new ForbiddenError('Requer privilegios de administrador'));
  }
  return next();
}

module.exports = { criarAuthMiddleware, apenasAdmin };
