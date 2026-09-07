'use strict';

const { asyncHandler } = require('../middlewares/asyncHandler');

function criarUsuariosController({ usuariosService }) {
  return {
    // RF01 - POST /api/usuarios
    cadastrar: asyncHandler(async (req, res) => {
      const { nome, email, senha } = req.body || {};
      const usuario = await usuariosService.cadastrar({ nome, email, senha });
      res.status(201).json({ usuario, mensagem: 'Usuario cadastrado com sucesso' });
    }),
  };
}

module.exports = { criarUsuariosController };
