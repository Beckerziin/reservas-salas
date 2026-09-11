/**
 * Configuracao do Jest.
 * O QA (Ian) pode ampliar esta configuracao conforme os testes evoluirem.
 */
module.exports = {
  testEnvironment: 'node',
  // Procura arquivos *.test.js dentro de tests/ (e onde mais o QA criar).
  // tests/e2e fica de fora: sao specs do Playwright, rodados via `npm run test:e2e`.
  testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/e2e/'],
  // Garante ambiente de teste e fonte de dados em memoria por padrao.
  setupFiles: ['<rootDir>/tests/helpers/setEnv.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/supabaseClient.js',
    '!src/repositories/supabase/**',
  ],
  clearMocks: true,
};
