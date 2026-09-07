'use strict';

const { asyncHandler } = require('../middlewares/asyncHandler');

function criarAuthController({ authService, usuariosService }) {
  return {
    // RF02 - POST /api/auth/login
    login: asyncHandler(async (req, res) => {
      const { email, senha } = req.body || {};
      const { token, usuario } = await authService.login({ email, senha });
      res.status(200).json({ token, usuario });
    }),

    // GET /api/auth/me - dados do usuario autenticado (mantem sessao - HU02)
    me: asyncHandler(async (req, res) => {
      const usuario = await usuariosService.buscarPorId(req.usuario.id);
      res.status(200).json({ usuario });
    }),
  };
}

module.exports = { criarAuthController };
