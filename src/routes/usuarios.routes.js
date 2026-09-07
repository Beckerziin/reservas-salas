'use strict';

const { Router } = require('express');

// RF01
function criarUsuariosRoutes(controller) {
  const router = Router();
  router.post('/', controller.cadastrar);
  return router;
}

module.exports = { criarUsuariosRoutes };
