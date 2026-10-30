'use strict';

const { Router } = require('express');

const { criarTokenService } = require('../services/tokenService');
const { criarUsuariosService } = require('../services/usuariosService');
const { criarAuthService } = require('../services/authService');
const { criarSalasService } = require('../services/salasService');
const { criarReservasService } = require('../services/reservasService');

const { criarUsuariosController } = require('../controllers/usuariosController');
const { criarAuthController } = require('../controllers/authController');
const { criarSalasController } = require('../controllers/salasController');
const { criarReservasController } = require('../controllers/reservasController');

const { criarAuthMiddleware, apenasAdmin } = require('../middlewares/auth');
const { criarRateLimiter } = require('../middlewares/rateLimit');
const { honeypot } = require('../middlewares/antiBot');

const { criarUsuariosRoutes } = require('./usuarios.routes');
const { criarAuthRoutes } = require('./auth.routes');
const { criarSalasRoutes } = require('./salas.routes');
const { criarReservasRoutes } = require('./reservas.routes');

/**
 * Monta o Router principal da API, ligando repositorios -> services ->
 * controllers -> rotas. Recebe os repositorios e a config por injecao,
 * o que permite ao QA montar a aplicacao com dados em memoria nos testes.
 *
 * @param {object} repositorios - { usuarios, salas, reservas }
 * @param {{ jwtSecret:string, jwtExpiresIn?:string }} config
 */
function criarRotas(repositorios, config) {
  const tokenService = criarTokenService({
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn,
  });

  // Services
  const usuariosService = criarUsuariosService(repositorios);
  const authService = criarAuthService(repositorios, { tokenService });
  const salasService = criarSalasService(repositorios);
  const reservasService = criarReservasService(repositorios);

  // Controllers
  const usuariosController = criarUsuariosController({ usuariosService });
  const authController = criarAuthController({ authService, usuariosService });
  const salasController = criarSalasController({ salasService });
  const reservasController = criarReservasController({ reservasService });

  // Middleware de autenticacao
  const autenticar = criarAuthMiddleware({ tokenService });

  // Anti-bot: forca bruta no login (so tentativas que falham contam) e
  // cadastro em massa.
  const limites = config.rateLimit;
  const limitarLogin = criarRateLimiter({
    janelaMs: limites.loginJanelaMs,
    max: limites.loginMax,
    contarApenasFalhas: true,
    mensagem: 'Muitas tentativas de login. Tente novamente mais tarde.',
  });
  const limitarCadastro = criarRateLimiter({
    janelaMs: limites.cadastroJanelaMs,
    max: limites.cadastroMax,
    mensagem: 'Muitos cadastros a partir deste endereco. Tente novamente mais tarde.',
  });

  // Router raiz da API
  const api = Router();

  // Health check (usado pela CI e por monitoramento)
  api.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', dataSource: repositorios.tipo || 'desconhecido' });
  });

  api.use('/usuarios', criarUsuariosRoutes(usuariosController, [limitarCadastro, honeypot]));
  api.use('/auth', criarAuthRoutes(authController, autenticar, [limitarLogin]));
  api.use('/salas', criarSalasRoutes(salasController, autenticar, apenasAdmin));
  api.use('/reservas', criarReservasRoutes(reservasController, autenticar));

  return api;
}

module.exports = { criarRotas };
