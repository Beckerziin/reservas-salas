'use strict';

const { Router } = require('express');

// RF04, RF06, RF07 (todas exigem autenticacao)
function criarReservasRoutes(controller, autenticar) {
  const router = Router();
  router.post('/', autenticar, controller.criar);
  router.get('/minhas', autenticar, controller.listarMinhas);
  router.patch('/:id/cancelar', autenticar, controller.cancelar);
  return router;
}

module.exports = { criarReservasRoutes };
