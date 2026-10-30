'use strict';

const { Router } = require('express');

// RF02 + sessao
function criarAuthRoutes(controller, autenticar, antiBot = []) {
  const router = Router();
  router.post('/login', ...antiBot, controller.login);
  router.get('/me', autenticar, controller.me);
  return router;
}

module.exports = { criarAuthRoutes };
