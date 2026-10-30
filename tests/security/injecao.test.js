'use strict';

/**
 * Seguranca — Injecao de codigo.
 *
 * Envia payloads classicos de SQL injection, injecao de operador
 * (NoSQL/PostgREST), XSS e prototype pollution. A API precisa tratar tudo
 * como DADO: recusar com 4xx ou guardar literalmente, nunca executar,
 * nunca autenticar e nunca responder 500 vazando detalhes internos.
 */
const request = require('supertest');
const {
  buildTestApp,
  criarSala,
  registrarELogar,
  daquiAMinutos,
} = require('../helpers/buildTestApp');

const SQL_PAYLOADS = [
  "' OR '1'='1",
  "' OR 1=1 --",
  "admin@fag.local' --",
  "'; DROP TABLE usuarios; --",
  "\" OR \"\"=\"",
];

describe('SQL injection', () => {
  test.each(SQL_PAYLOADS)('login com e-mail "%s" nao autentica', async (payload) => {
    const { app } = buildTestApp();
    await registrarELogar(app, { email: 'alvo@exemplo.com', senha: 'senha123' });

    const res = await request(app).post('/api/auth/login').send({ email: payload, senha: payload });

    expect([400, 401]).toContain(res.status);
    expect(res.body.token).toBeUndefined();
  });

  test.each(SQL_PAYLOADS)('login com senha "%s" no e-mail real nao autentica', async (payload) => {
    const { app } = buildTestApp();
    await registrarELogar(app, { email: 'alvo@exemplo.com', senha: 'senha123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alvo@exemplo.com', senha: payload });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('payload SQL no id da URL nao derruba nem afeta outras reservas', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token, usuario } = await registrarELogar(app);
    await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(60), fim: daquiAMinutos(90) });

    const res = await request(app)
      .patch(`/api/reservas/${encodeURIComponent("1' OR '1'='1")}/cancelar`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    const minhas = await repositorios.reservas.listByUsuario(usuario.id);
    expect(minhas.every((r) => r.status === 'ativa')).toBe(true);
  });

  test('nome com SQL e guardado literalmente, como texto', async () => {
    const { app, repositorios } = buildTestApp();
    const nome = "Robert'); DROP TABLE usuarios; --";

    const res = await request(app)
      .post('/api/usuarios')
      .send({ nome, email: 'bobby@exemplo.com', senha: 'senha123' });

    expect(res.status).toBe(201);
    expect((await repositorios.usuarios.findByEmail('bobby@exemplo.com')).nome).toBe(nome);
  });
});

describe('Injecao de operador (NoSQL / objetos no lugar de texto)', () => {
  test.each([
    { $ne: null },
    { $gt: '' },
    { $regex: '.*' },
    ['admin@fag.local'],
  ])('login com email=%p e recusado sem autenticar', async (email) => {
    const { app } = buildTestApp();
    await registrarELogar(app, { email: 'alvo@exemplo.com', senha: 'senha123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, senha: { $ne: null } });

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  test('salaId como objeto de operador e recusado (400) e nada e reservado', async () => {
    const { app, repositorios } = buildTestApp();
    await criarSala(repositorios);
    const { token, usuario } = await registrarELogar(app);

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ salaId: { $ne: null }, inicio: daquiAMinutos(60), fim: daquiAMinutos(90) });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('SALA_INVALIDA');
    expect(await repositorios.reservas.listByUsuario(usuario.id)).toEqual([]);
  });

  test('senha como objeto no cadastro e recusada', async () => {
    const { app, repositorios } = buildTestApp();
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nome: 'X', email: 'obj@exemplo.com', senha: { length: 99 } });

    expect(res.status).toBe(400);
    expect(await repositorios.usuarios.findByEmail('obj@exemplo.com')).toBeNull();
  });
});

describe('XSS (injecao de script)', () => {
  const XSS = ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '"><svg onload=alert(1)>'];

  test.each(XSS)('cadastro com nome "%s" e recusado e nao e salvo', async (nome) => {
    const { app, repositorios } = buildTestApp();
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nome, email: 'xss@exemplo.com', senha: 'senha123' });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('NOME_INVALIDO');
    expect(await repositorios.usuarios.findByEmail('xss@exemplo.com')).toBeNull();
  });

  test('admin nao consegue cadastrar sala com script no nome', async () => {
    const { app, repositorios } = buildTestApp();
    const { registrarAdminELogar } = require('../helpers/buildTestApp');
    const admin = await registrarAdminELogar(app, repositorios);

    const res = await request(app)
      .post('/api/salas')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ nome: '<script>alert(1)</script>', capacidade: 4 });

    expect(res.status).toBe(400);
    expect(await repositorios.salas.list()).toEqual([]);
  });

  test('respostas sao JSON com nosniff: o navegador nao interpreta como HTML', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/rota-<script>alert(1)</script>');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
  });
});

describe('Prototype pollution e corpo malicioso', () => {
  test('__proto__ no corpo nao promove o usuario a admin nem polui objetos', async () => {
    const { app, repositorios } = buildTestApp();
    const corpo = '{"nome":"Poluidor","email":"proto@exemplo.com","senha":"senha123","__proto__":{"papel":"admin"}}';

    const res = await request(app)
      .post('/api/usuarios')
      .set('Content-Type', 'application/json')
      .send(corpo);

    expect(res.status).toBe(201);
    expect((await repositorios.usuarios.findByEmail('proto@exemplo.com')).papel).toBe('user');
    expect({}.papel).toBeUndefined();
  });

  test('JSON malformado responde 400 sem stack trace', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "x", "senha": ');

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('JSON_INVALIDO');
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js/);
  });

  test('corpo acima de 10kb e recusado com 413', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nome: 'A'.repeat(20 * 1024), email: 'grande@exemplo.com', senha: 'senha123' });

    expect(res.status).toBe(413);
    expect(res.body.erro.codigo).toBe('CORPO_MUITO_GRANDE');
  });
});
