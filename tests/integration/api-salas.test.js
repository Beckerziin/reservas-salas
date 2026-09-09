'use strict';

/**
 * Integracao — RF03 (listar salas) e RF08 (cadastrar sala - admin).
 */
const request = require('supertest');
const { buildTestApp, criarSala, registrarELogar, registrarAdminELogar } = require('../helpers/buildTestApp');

describe('RF03 — GET /api/salas', () => {
  test('lista as salas cadastradas (rota publica)', async () => {
    const { app, repositorios } = buildTestApp();
    await criarSala(repositorios, { nome: 'Sala A' });
    await criarSala(repositorios, { nome: 'Sala B' });

    const res = await request(app).get('/api/salas');

    expect(res.status).toBe(200);
    expect(res.body.salas).toHaveLength(2);
    expect(res.body.salas.map((s) => s.nome).sort()).toEqual(['Sala A', 'Sala B']);
  });

  test('retorna lista vazia quando nao ha salas', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/salas');
    expect(res.status).toBe(200);
    expect(res.body.salas).toEqual([]);
  });
});

describe('RF08 — POST /api/salas (admin)', () => {
  test('admin cadastra sala com sucesso e ela e persistida', async () => {
    const { app, repositorios } = buildTestApp();
    const { token } = await registrarAdminELogar(app, repositorios);

    const res = await request(app)
      .post('/api/salas')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Sala Nova', capacidade: 6, status: 'disponivel' });

    expect(res.status).toBe(201);
    expect(res.body.sala).toMatchObject({ nome: 'Sala Nova', capacidade: 6, status: 'disponivel' });

    const persistida = await repositorios.salas.findById(res.body.sala.id);
    expect(persistida).not.toBeNull();
    expect(persistida.nome).toBe('Sala Nova');
  });

  test('usuario nao-admin recebe 403 e a sala nao e criada', async () => {
    const { app, repositorios } = buildTestApp();
    const { token } = await registrarELogar(app);

    const res = await request(app)
      .post('/api/salas')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Sala Proibida', capacidade: 4, status: 'disponivel' });

    expect(res.status).toBe(403);
    expect(res.body.erro.codigo).toBe('ACESSO_NEGADO');
    expect(await repositorios.salas.list()).toHaveLength(0);
  });

  test('sem token retorna 401 e nao cria a sala', async () => {
    const { app, repositorios } = buildTestApp();

    const res = await request(app)
      .post('/api/salas')
      .send({ nome: 'Sala Sem Auth', capacidade: 4, status: 'disponivel' });

    expect(res.status).toBe(401);
    expect(await repositorios.salas.list()).toHaveLength(0);
  });

  test('capacidade invalida (zero) retorna 400 e nao persiste', async () => {
    const { app, repositorios } = buildTestApp();
    const { token } = await registrarAdminELogar(app, repositorios);

    const res = await request(app)
      .post('/api/salas')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Sala Invalida', capacidade: 0, status: 'disponivel' });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('CAPACIDADE_INVALIDA');
    expect(await repositorios.salas.list()).toHaveLength(0);
  });

  test('status invalido retorna 400', async () => {
    const { app, repositorios } = buildTestApp();
    const { token } = await registrarAdminELogar(app, repositorios);

    const res = await request(app)
      .post('/api/salas')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Sala Status Ruim', capacidade: 4, status: 'nao-existe' });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('STATUS_INVALIDO');
  });
});
