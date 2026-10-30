'use strict';

const express = require('express');
const cors = require('cors');

const { env } = require('./config/env');
const { criarRepositorios } = require('./repositories');
const { criarRotas } = require('./routes');
const { notFound } = require('./middlewares/notFound');
const { errorHandler } = require('./middlewares/errorHandler');
const { securityHeaders } = require('./middlewares/securityHeaders');

/**
 * Cria a aplicacao Express SEM iniciar o servidor (sem listen).
 * Isso permite que os testes (supertest) importem o app diretamente e que
 * o mesmo app rode como funcao serverless na Vercel.
 *
 * @param {object} [opcoes]
 * @param {object} [opcoes.repositorios] - injeta repositorios (ex.: memoria nos testes)
 * @param {object} [opcoes.config] - sobrescreve config (ex.: jwtSecret nos testes)
 */
function createApp({ repositorios, config } = {}) {
  const repos = repositorios || criarRepositorios();
  const cfg = {
    jwtSecret: env.jwtSecret,
    jwtExpiresIn: env.jwtExpiresIn,
    rateLimit: env.rateLimit,
    trustProxy: env.trustProxy,
    ...config,
  };

  const app = express();
  app.disable('x-powered-by');
  if (cfg.trustProxy) app.set('trust proxy', 1);
  app.use(securityHeaders);
  app.use(cors({ origin: env.corsOrigin }));
  // Limite de corpo: payloads gigantes (bots / DoS) recebem 413.
  app.use(express.json({ limit: '10kb' }));

  // Raiz informativa (util para checar o deploy no navegador).
  app.get('/', (_req, res) => {
    res.status(200).json({
      nome: 'API - Sistema de Reservas de Salas de Estudo',
      versao: '1.0.0',
      health: '/api/health',
    });
  });

  app.use('/api', criarRotas(repos, cfg));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
