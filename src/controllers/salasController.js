'use strict';

const { asyncHandler } = require('../middlewares/asyncHandler');

function criarSalasController({ salasService }) {
  return {
    // RF03 - GET /api/salas
    listar: asyncHandler(async (_req, res) => {
      const salas = await salasService.listar();
      res.status(200).json({ salas });
    }),

    // RF08 - POST /api/salas (admin)
    cadastrar: asyncHandler(async (req, res) => {
      const { nome, capacidade, status } = req.body || {};
      const sala = await salasService.cadastrar({ nome, capacidade, status });
      res.status(201).json({ sala, mensagem: 'Sala cadastrada com sucesso' });
    }),
  };
}

module.exports = { criarSalasController };
