'use strict';

// Carrega o .env (se existir) para process.env. Em producao (Vercel) as
// variaveis vem do painel, entao a ausencia de .env nao e problema.
require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';
const isProduction = nodeEnv === 'production';

const env = {
  nodeEnv,
  isTest,
  isProduction,
  port: Number(process.env.PORT || 3000),

  // "memory" | "supabase"
  dataSource: process.env.DATA_SOURCE || 'memory',

  // JWT
  jwtSecret: process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret-nao-use-em-producao'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Popular dados de exemplo em memoria (nunca durante testes)
  seedDev: process.env.SEED_DEV !== 'false' && !isTest,
};

/**
 * Valida a configuracao minima de acordo com o ambiente.
 * Chamado no boot do servidor (nao nos testes) para falhar cedo e claro.
 */
function validarConfig() {
  const erros = [];

  if (env.dataSource === 'supabase') {
    if (!env.supabaseUrl) erros.push('SUPABASE_URL e obrigatorio quando DATA_SOURCE=supabase');
    if (!env.supabaseKey) erros.push('SUPABASE_KEY e obrigatorio quando DATA_SOURCE=supabase');
  }

  if (env.isProduction && !env.jwtSecret) {
    erros.push('JWT_SECRET e obrigatorio em producao');
  }

  if (erros.length > 0) {
    throw new Error('Configuracao invalida:\n - ' + erros.join('\n - '));
  }
}

module.exports = { env, validarConfig };
