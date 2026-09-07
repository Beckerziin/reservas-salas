'use strict';

const { Router } = require('express');

// RF03 (publico) + RF08 (admin)
function criarSalasRoutes(controller, autenticar, apenasAdmin) {
  const router = Router();
  router.get('/', controller.listar);
  router.post('/', autenticar, apenasAdmin, controller.cadastrar);
  return router;
}

module.exports = { criarSalasRoutes };
