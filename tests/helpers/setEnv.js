'use strict';

// Executado pelo Jest ANTES de qualquer teste (ver jest.config.js > setupFiles).
// Garante um ambiente de teste isolado e sem dependencia de banco externo.
process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'memory';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.SEED_DEV = 'false';
process.env.CORS_ORIGIN = '*';
