'use strict';

/**
 * Integracao — RF02: login via API + repositorio em memoria.
 */
const request = require('supertest');
const { buildTestApp, registrarELogar } = require('../helpers/buildTestApp');

describe('RF02 — POST /api/auth/login', () => {
  let app;

  beforeEach(() => {
    ({ app } = buildTestApp());
  });

  test('credenciais validas retornam 200 com token JWT e dados do usuario', async () => {
    const credenciais = { nome: 'Login Teste', email: 'login.ok@exemplo.com', senha: 'senha123' };
    await request(app).post('/api/usuarios').send(credenciais);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credenciais.email, senha: credenciais.senha });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
    expect(res.body.usuario.email).toBe(credenciais.email);
    expect(res.body.usuario).not.toHaveProperty('senhaHash');
  });

  test('senha incorreta retorna 401 CREDENCIAIS_INVALIDAS', async () => {
    const credenciais = { nome: 'Login Teste', email: 'login.senha-errada@exemplo.com', senha: 'senha123' };
    await request(app).post('/api/usuarios').send(credenciais);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credenciais.email, senha: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('CREDENCIAIS_INVALIDAS');
  });

  test('e-mail inexistente retorna 401 (mesma mensagem, evita enumeracao)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nao-existe@exemplo.com', senha: 'qualquer123' });

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('CREDENCIAIS_INVALIDAS');
  });

  test('GET /api/auth/me sem token retorna 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me com token valido retorna os dados da sessao (HU02)', async () => {
    const { token, usuario } = await registrarELogar(app);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.usuario.id).toBe(usuario.id);
  });

  test('GET /api/auth/me com token invalido retorna 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
  });
});
