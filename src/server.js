'use strict';

const { env, validarConfig } = require('./config/env');
const { createApp } = require('./app');
const { criarRepositorios } = require('./repositories');
const { seedDev } = require('./config/seedDev');

async function main() {
  validarConfig();

  const repositorios = criarRepositorios();

  // Popular dados de exemplo apenas em memoria/dev.
  if (repositorios.tipo === 'memory' && env.seedDev) {
    await seedDev(repositorios);
  }

  const app = createApp({ repositorios });

  app.listen(env.port, () => {
    console.log(
      `API de Reservas rodando em http://localhost:${env.port} ` +
        `(ambiente=${env.nodeEnv}, dataSource=${repositorios.tipo})`
    );
  });
}

main().catch((err) => {
  console.error('Falha ao iniciar o servidor:\n', err.message);
  process.exit(1);
});
