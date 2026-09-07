'use strict';

/**
 * Smoke test - garante que a aplicacao sobe e responde.
 * Serve para o pipeline de CI ter algo verde desde o inicio.
 * O QA (Ian) deve adicionar os testes de unidade, integracao e sistema
 * a partir da tabela de rastreabilidade (docs/RASTREABILIDADE.md).
 */
const request = require('supertest');
const { buildTestApp } = require('./helpers/buildTestApp');

describe('Smoke', () => {
  const { app } = buildTestApp();

  test('GET /api/health responde 200 e status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET / responde com identificacao da API', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nome');
  });

  test('Rota inexistente responde 404 com corpo de erro padronizado', async () => {
    const res = await request(app).get('/rota/que/nao/existe');
    expect(res.status).toBe(404);
    expect(res.body.erro).toHaveProperty('codigo');
  });
});
