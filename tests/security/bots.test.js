'use strict';

/**
 * Seguranca — Bots (forca bruta, cadastro em massa, formularios automaticos).
 *
 * Defesas testadas:
 *  - rate limit no login: depois de N tentativas ERRADAS o IP e bloqueado
 *    (429), inclusive para a senha certa, ate a janela expirar;
 *  - rate limit no cadastro: impede criar contas em massa;
 *  - honeypot: campo invisivel "website" que so bots preenchem.
 */
const request = require('supertest');
const { createApp } = require('../../src/app');
const { criarRepositoriosMemoria } = require('../../src/repositories');

const LIMITES = {
  loginMax: 5,
  loginJanelaMs: 60 * 1000,
  cadastroMax: 3,
  cadastroJanelaMs: 60 * 1000,
};

function appComLimites(extra = {}) {
  const repositorios = criarRepositoriosMemoria();
  const app = createApp({
    repositorios,
    config: { jwtSecret: 'test-secret', rateLimit: LIMITES, ...extra },
  });
  return { app, repositorios };
}

async function cadastrar(app, email, extra = {}) {
  return request(app)
    .post('/api/usuarios')
    .send({ nome: 'Pessoa', email, senha: 'senha123', ...extra });
}

describe('Bots — forca bruta no login', () => {
  test(`apos ${LIMITES.loginMax} senhas erradas o IP recebe 429 com Retry-After`, async () => {
    const { app } = appComLimites();
    await cadastrar(app, 'alvo@exemplo.com');

    for (let i = 0; i < LIMITES.loginMax; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alvo@exemplo.com', senha: `chute-${i}` });
      expect(res.status).toBe(401);
    }

    const bloqueado = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alvo@exemplo.com', senha: 'chute-final' });
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.erro.codigo).toBe('MUITAS_TENTATIVAS');
    expect(Number(bloqueado.headers['retry-after'])).toBeGreaterThan(0);
  });

  test('depois do bloqueio nem a senha certa entra (o bot nao descobre que acertou)', async () => {
    const { app } = appComLimites();
    await cadastrar(app, 'alvo@exemplo.com');
    for (let i = 0; i < LIMITES.loginMax; i += 1) {
      await request(app).post('/api/auth/login').send({ email: 'alvo@exemplo.com', senha: 'errada' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alvo@exemplo.com', senha: 'senha123' });
    expect(res.status).toBe(429);
    expect(res.body.token).toBeUndefined();
  });

  test('credential stuffing (varios e-mails) tambem e bloqueado por IP', async () => {
    const { app } = appComLimites();
    for (let i = 0; i < LIMITES.loginMax; i += 1) {
      await request(app).post('/api/auth/login').send({ email: `vazado${i}@exemplo.com`, senha: 'senha123' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'outro@exemplo.com', senha: 'senha123' });
    expect(res.status).toBe(429);
  });

  test('logins corretos nao gastam tentativas (usuario legitimo nao e bloqueado)', async () => {
    const { app } = appComLimites();
    await cadastrar(app, 'legitimo@exemplo.com');

    for (let i = 0; i < LIMITES.loginMax + 3; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'legitimo@exemplo.com', senha: 'senha123' });
      expect(res.status).toBe(200);
    }
  });

  test('o bloqueio expira ao fim da janela', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval'] });
    try {
      const { app } = appComLimites();
      await cadastrar(app, 'alvo@exemplo.com');
      for (let i = 0; i < LIMITES.loginMax; i += 1) {
        await request(app).post('/api/auth/login').send({ email: 'alvo@exemplo.com', senha: 'errada' });
      }
      const bloqueado = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alvo@exemplo.com', senha: 'senha123' });
      expect(bloqueado.status).toBe(429);

      jest.setSystemTime(Date.now() + LIMITES.loginJanelaMs + 1000);

      const liberado = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alvo@exemplo.com', senha: 'senha123' });
      expect(liberado.status).toBe(200);
    } finally {
      jest.useRealTimers();
    }
  });

  test('X-Forwarded-For forjado nao dribla o limite quando nao ha proxy confiavel', async () => {
    const { app } = appComLimites();
    for (let i = 0; i < LIMITES.loginMax; i += 1) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', `10.0.0.${i}`)
        .send({ email: 'a@exemplo.com', senha: 'errada' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '10.0.0.250')
      .send({ email: 'a@exemplo.com', senha: 'errada' });
    expect(res.status).toBe(429);
  });

  test('atras de proxy confiavel (Vercel) o limite e por IP real do cliente', async () => {
    const { app } = appComLimites({ trustProxy: true });
    for (let i = 0; i < LIMITES.loginMax; i += 1) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '203.0.113.7')
        .send({ email: 'a@exemplo.com', senha: 'errada' });
    }

    const atacante = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '203.0.113.7')
      .send({ email: 'a@exemplo.com', senha: 'errada' });
    const outroCliente = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '198.51.100.9')
      .send({ email: 'a@exemplo.com', senha: 'errada' });

    expect(atacante.status).toBe(429);
    expect(outroCliente.status).toBe(401);
  });
});

describe('Bots — cadastro em massa', () => {
  test(`a partir do cadastro ${LIMITES.cadastroMax + 1} o IP recebe 429 e a conta nao e criada`, async () => {
    const { app, repositorios } = appComLimites();

    for (let i = 0; i < LIMITES.cadastroMax; i += 1) {
      expect((await cadastrar(app, `bot${i}@exemplo.com`)).status).toBe(201);
    }
    const excedente = await cadastrar(app, 'bot-extra@exemplo.com');

    expect(excedente.status).toBe(429);
    expect(await repositorios.usuarios.findByEmail('bot-extra@exemplo.com')).toBeNull();
  });
});

describe('Bots — honeypot no formulario de cadastro', () => {
  test('campo invisivel "website" preenchido: cadastro recusado e nada salvo', async () => {
    const { app, repositorios } = appComLimites();
    const res = await cadastrar(app, 'robo@exemplo.com', { website: 'http://spam.example' });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('REQUISICAO_SUSPEITA');
    expect(await repositorios.usuarios.findByEmail('robo@exemplo.com')).toBeNull();
  });

  test('campo "website" vazio (como o navegador de uma pessoa envia) passa normalmente', async () => {
    const { app } = appComLimites();
    const res = await cadastrar(app, 'pessoa@exemplo.com', { website: '' });
    expect(res.status).toBe(201);
  });

  test('a resposta nao revela que o honeypot denunciou o bot', async () => {
    const { app } = appComLimites();
    const res = await cadastrar(app, 'robo@exemplo.com', { website: 'x' });
    expect(JSON.stringify(res.body).toLowerCase()).not.toMatch(/honeypot|website|bot/);
  });
});
