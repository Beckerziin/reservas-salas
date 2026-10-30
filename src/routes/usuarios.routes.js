'use strict';

const { Router } = require('express');

// RF01
function criarUsuariosRoutes(controller, antiBot = []) {
  const router = Router();
  router.post('/', ...antiBot, controller.cadastrar);
  return router;
}

module.exports = { criarUsuariosRoutes };
