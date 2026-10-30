'use strict';

/**
 * Seguranca — Criptografia e senhas (RNF03).
 *
 * Verifica que a senha nunca e guardada nem devolvida em texto puro, que o
 * hash e bcrypt com salt e custo adequado, que o JWT nao aceita algoritmo
 * trocado/"none" nem token expirado, e que o servidor recusa subir em
 * producao com segredo fraco.
 */
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { buildTestApp } = require('../helpers/buildTestApp');
const { validarConfig } = require('../../src/config/env');

const SENHA = 'MinhaSenha#2026';

async function cadastrar(app, email = 'cripto@exemplo.com', senha = SENHA) {
  return request(app).post('/api/usuarios').send({ nome: 'Cripto', email, senha });
}

describe('Senhas — armazenamento com hash', () => {
  test('a senha e guardada como hash bcrypt, nunca em texto puro', async () => {
    const { app, repositorios } = buildTestApp();
    await cadastrar(app);

    const salvo = await repositorios.usuarios.findByEmail('cripto@exemplo.com');
    expect(salvo.senhaHash).not.toBe(SENHA);
    expect(salvo.senhaHash).not.toContain(SENHA);
    expect(salvo.senhaHash).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
    expect(await bcrypt.compare(SENHA, salvo.senhaHash)).toBe(true);
    expect(Object.values(salvo)).not.toContain(SENHA);
  });

  test('custo do bcrypt e de pelo menos 10 rounds', async () => {
    const { app, repositorios } = buildTestApp();
    await cadastrar(app);

    const { senhaHash } = await repositorios.usuarios.findByEmail('cripto@exemplo.com');
    expect(bcrypt.getRounds(senhaHash)).toBeGreaterThanOrEqual(10);
  });

  test('mesma senha em duas contas gera hashes diferentes (salt unico)', async () => {
    const { app, repositorios } = buildTestApp();
    await cadastrar(app, 'a@exemplo.com');
    await cadastrar(app, 'b@exemplo.com');

    const a = await repositorios.usuarios.findByEmail('a@exemplo.com');
    const b = await repositorios.usuarios.findByEmail('b@exemplo.com');
    expect(a.senhaHash).not.toBe(b.senhaHash);
  });

  test('senha curta demais e recusada (SENHA_FRACA) e nada e salvo', async () => {
    const { app, repositorios } = buildTestApp();
    const res = await cadastrar(app, 'fraca@exemplo.com', '123');

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('SENHA_FRACA');
    expect(await repositorios.usuarios.findByEmail('fraca@exemplo.com')).toBeNull();
  });

  test('senha acima de 72 bytes e recusada (bcrypt truncaria em silencio)', async () => {
    const { app, repositorios } = buildTestApp();
    const res = await cadastrar(app, 'longa@exemplo.com', 'a'.repeat(73));

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('SENHA_MUITO_LONGA');
    expect(await repositorios.usuarios.findByEmail('longa@exemplo.com')).toBeNull();
  });
});

describe('Senhas — nada sensivel sai pela API', () => {
  test('cadastro, login e /me nunca devolvem senha nem senhaHash', async () => {
    const { app } = buildTestApp();
    const cadastro = await cadastrar(app);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cripto@exemplo.com', senha: SENHA });
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    for (const res of [cadastro, login, me]) {
      const corpo = JSON.stringify(res.body);
      expect(corpo).not.toContain('senhaHash');
      expect(corpo).not.toContain(SENHA);
      expect(corpo).not.toMatch(/\$2[aby]\$/);
    }
  });

  test('o token JWT nao carrega a senha nem o hash no payload', async () => {
    const { app } = buildTestApp();
    await cadastrar(app);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cripto@exemplo.com', senha: SENHA });

    const payload = jwt.decode(login.body.token);
    expect(Object.keys(payload).sort()).toEqual(['email', 'exp', 'iat', 'papel', 'sub']);
    expect(JSON.stringify(payload)).not.toContain(SENHA);
  });

  test('login errado tem a mesma resposta para e-mail inexistente e senha errada', async () => {
    const { app } = buildTestApp();
    await cadastrar(app);

    const senhaErrada = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cripto@exemplo.com', senha: 'errada123' });
    const emailInexistente = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ninguem@exemplo.com', senha: 'errada123' });

    expect(senhaErrada.status).toBe(401);
    expect(emailInexistente.status).toBe(401);
    expect(senhaErrada.body).toEqual(emailInexistente.body);
  });
});

describe('JWT — assinatura e algoritmo', () => {
  async function tokenValido(app) {
    await cadastrar(app);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cripto@exemplo.com', senha: SENHA });
    return login.body.token;
  }

  test('token e assinado com HS256', async () => {
    const { app } = buildTestApp();
    const token = await tokenValido(app);
    expect(jwt.decode(token, { complete: true }).header.alg).toBe('HS256');
  });

  test('token com "alg": "none" (sem assinatura) e recusado', async () => {
    const { app } = buildTestApp();
    const payload = jwt.decode(await tokenValido(app));
    const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const semAssinatura = `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.`;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${semAssinatura}`);
    expect(res.status).toBe(401);
  });

  test('token assinado com o segredo certo mas outro algoritmo (HS512) e recusado', async () => {
    const { app } = buildTestApp();
    const payload = jwt.decode(await tokenValido(app));
    const claims = { sub: payload.sub, email: payload.email, papel: payload.papel };
    const outroAlg = jwt.sign(claims, 'test-secret', { algorithm: 'HS512' });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${outroAlg}`);
    expect(res.status).toBe(401);
  });

  test('token expirado e recusado', async () => {
    const { app } = buildTestApp();
    const payload = jwt.decode(await tokenValido(app));
    const expirado = jwt.sign(
      { sub: payload.sub, email: payload.email, papel: payload.papel, exp: Math.floor(Date.now() / 1000) - 60 },
      'test-secret'
    );

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expirado}`);
    expect(res.status).toBe(401);
  });
});

describe('Configuracao — segredo do JWT em producao', () => {
  const base = { isProduction: true, dataSource: 'memory' };

  test('sem JWT_SECRET o servidor nao sobe em producao', () => {
    expect(() => validarConfig({ ...base, jwtSecret: '' })).toThrow(/JWT_SECRET e obrigatorio/);
  });

  test.each(['troque-este-segredo-em-producao', 'dev-secret-nao-use-em-producao'])(
    'segredo de exemplo publicado no repo (%s) e recusado em producao',
    (segredo) => {
      expect(() => validarConfig({ ...base, jwtSecret: segredo })).toThrow(/exemplo/);
    }
  );

  test('segredo forte e aceito', () => {
    expect(() => validarConfig({ ...base, jwtSecret: 'x'.repeat(64) })).not.toThrow();
  });

  test('segredo curto e aceito mas gera aviso', () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => validarConfig({ ...base, jwtSecret: 'curto-mas-unico' })).not.toThrow();
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET'));
    aviso.mockRestore();
  });
});
