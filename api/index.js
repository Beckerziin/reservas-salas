'use strict';

// Entrypoint da Vercel (Serverless Function).
// A Vercel encaminha todas as requisicoes para este arquivo (ver vercel.json)
// e usa o app Express exportado como handler (req, res).
//
// Em producao, defina no painel da Vercel:
//   DATA_SOURCE=supabase, SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, CORS_ORIGIN

const { validarConfig } = require('../src/config/env');
const { createApp } = require('../src/app');

validarConfig();

module.exports = createApp();
