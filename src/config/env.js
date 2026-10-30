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

  // Atras de proxy (Vercel) o IP real do cliente vem no X-Forwarded-For.
  // Fora de proxy fica desligado: senao o cliente forjaria o proprio IP e
  // driblaria o rate limit.
  trustProxy: process.env.TRUST_PROXY === 'true' || Boolean(process.env.VERCEL),

  // Anti-bot / forca bruta (por IP)
  rateLimit: {
    loginMax: Number(process.env.RATE_LIMIT_LOGIN_MAX || 10),
    loginJanelaMs: 15 * 60 * 1000,
    cadastroMax: Number(process.env.RATE_LIMIT_CADASTRO_MAX || 10),
    cadastroJanelaMs: 60 * 60 * 1000,
  },
};

// Segredos de exemplo/dev publicados no repositorio: nunca validos em producao.
const SEGREDOS_CONHECIDOS = ['troque-este-segredo-em-producao', 'dev-secret-nao-use-em-producao'];
const SEGREDO_TAMANHO_RECOMENDADO = 32;

/**
 * Valida a configuracao minima de acordo com o ambiente.
 * Chamado no boot do servidor (nao nos testes) para falhar cedo e claro.
 */
function validarConfig(config = env) {
  const erros = [];

  if (config.dataSource === 'supabase') {
    if (!config.supabaseUrl) erros.push('SUPABASE_URL e obrigatorio quando DATA_SOURCE=supabase');
    if (!config.supabaseKey) erros.push('SUPABASE_KEY e obrigatorio quando DATA_SOURCE=supabase');
  }

  if (config.isProduction) {
    if (!config.jwtSecret) {
      erros.push('JWT_SECRET e obrigatorio em producao');
    } else if (SEGREDOS_CONHECIDOS.includes(config.jwtSecret)) {
      erros.push('JWT_SECRET de exemplo nao pode ser usado em producao');
    } else if (config.jwtSecret.length < SEGREDO_TAMANHO_RECOMENDADO) {
      console.warn(
        `[seguranca] JWT_SECRET tem menos de ${SEGREDO_TAMANHO_RECOMENDADO} caracteres; ` +
          'gere um mais forte (ex.: openssl rand -hex 32)'
      );
    }
  }

  if (erros.length > 0) {
    throw new Error('Configuracao invalida:\n - ' + erros.join('\n - '));
  }
}

module.exports = { env, validarConfig };
