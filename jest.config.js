/**
 * Configuracao do Jest.
 * O QA (Ian) pode ampliar esta configuracao conforme os testes evoluirem.
 */
module.exports = {
  testEnvironment: 'node',
  // Procura arquivos *.test.js dentro de tests/ (e onde mais o QA criar).
  testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],
  // Garante ambiente de teste e fonte de dados em memoria por padrao.
  setupFiles: ['<rootDir>/tests/helpers/setEnv.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/supabaseClient.js',
    '!src/repositories/supabase/**',
  ],
  // Cobertura minima exigida (docs/qualidade/estrategia-de-testes.md):
  // 100% nas regras de negocio puras (src/domain), 70% global. O CI falha
  // se qualquer PR derrubar a cobertura abaixo disso.
  coverageThreshold: {
    global: {
      statements: 70,
      lines: 70,
      functions: 70,
    },
    './src/domain/**/*.js': {
      statements: 100,
      lines: 100,
      functions: 100,
    },
  },
  clearMocks: true,
};
