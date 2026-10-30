'use strict';

/**
 * Seguranca — IDOR (Insecure Direct Object Reference) e controle de acesso.
 *
 * Um usuario autenticado tenta acessar/alterar recursos de OUTRO usuario
 * trocando o identificador na requisicao (id na URL, usuarioId no corpo,
 * claims do token). Cada teste confere o estado final no repositorio: nao
 * basta o status HTTP estar certo, o dado da vitima tem que continuar intacto.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const {
  buildTestApp,
  criarSala,
  registrarELogar,
  daquiAMinutos,
} = require('../helpers/buildTestApp');

async function cenarioDuasContas() {
  const { app, repositorios } = buildTestApp();
  const sala = await criarSala(repositorios);
  const vitima = await registrarELogar(app, { nome: 'Vitima' });
  const atacante = await registrarELogar(app, { nome: 'Atacante' });

  const criada = await request(app)
    .post('/api/reservas')
    .set('Authorization', `Bearer ${vitima.token}`)
    .send({ salaId: sala.id, inicio: daquiAMinutos(60), fim: daquiAMinutos(90) });

  return { app, repositorios, sala, vitima, atacante, reservaVitima: criada.body.reserva };
}

describe('IDOR — cancelar reserva de outro usuario', () => {
  test('atacante usa o id da reserva da vitima: 403 e a reserva continua ativa', async () => {
    const { app, repositorios, atacante, reservaVitima } = await cenarioDuasContas();

    const res = await request(app)
      .patch(`/api/reservas/${reservaVitima.id}/cancelar`)
      .set('Authorization', `Bearer ${atacante.token}`);

    expect(res.status).toBe(403);
    expect(res.body.erro.codigo).toBe('NAO_E_DONO');
    const depois = await repositorios.reservas.findById(reservaVitima.id);
    expect(depois.status).toBe('ativa');
  });

  test('enviar usuarioId da vitima no corpo nao muda o dono da operacao', async () => {
    const { app, repositorios, vitima, atacante, reservaVitima } = await cenarioDuasContas();

    const res = await request(app)
      .patch(`/api/reservas/${reservaVitima.id}/cancelar`)
      .set('Authorization', `Bearer ${atacante.token}`)
      .send({ usuarioId: vitima.usuario.id });

    expect(res.status).toBe(403);
    expect((await repositorios.reservas.findById(reservaVitima.id)).status).toBe('ativa');
  });

  test('sem token nao e possivel cancelar nenhuma reserva (401)', async () => {
    const { app, repositorios, reservaVitima } = await cenarioDuasContas();

    const res = await request(app).patch(`/api/reservas/${reservaVitima.id}/cancelar`);

    expect(res.status).toBe(401);
    expect((await repositorios.reservas.findById(reservaVitima.id)).status).toBe('ativa');
  });

  test('o dono continua conseguindo cancelar (controle nao bloqueia o uso legitimo)', async () => {
    const { app, repositorios, vitima, reservaVitima } = await cenarioDuasContas();

    const res = await request(app)
      .patch(`/api/reservas/${reservaVitima.id}/cancelar`)
      .set('Authorization', `Bearer ${vitima.token}`);

    expect(res.status).toBe(200);
    expect((await repositorios.reservas.findById(reservaVitima.id)).status).toBe('cancelada');
  });
});

describe('IDOR — listar e criar em nome de outro usuario', () => {
  test('GET /reservas/minhas devolve apenas as reservas do dono do token', async () => {
    const { app, atacante, reservaVitima } = await cenarioDuasContas();

    const res = await request(app)
      .get('/api/reservas/minhas')
      .set('Authorization', `Bearer ${atacante.token}`);

    expect(res.status).toBe(200);
    expect(res.body.reservas).toEqual([]);
    expect(JSON.stringify(res.body)).not.toContain(reservaVitima.id);
  });

  test('usuarioId no corpo do POST e ignorado: a reserva fica com o dono do token', async () => {
    const { app, repositorios, sala, vitima, atacante } = await cenarioDuasContas();

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${atacante.token}`)
      .send({
        salaId: sala.id,
        usuarioId: vitima.usuario.id,
        inicio: daquiAMinutos(180),
        fim: daquiAMinutos(210),
      });

    expect(res.status).toBe(201);
    expect(res.body.reserva.usuarioId).toBe(atacante.usuario.id);
    const daVitima = await repositorios.reservas.listByUsuario(vitima.usuario.id);
    expect(daVitima).toHaveLength(1); // so a reserva original dela
  });

  test('GET /auth/me devolve so o proprio usuario, mesmo com ?id= de outro', async () => {
    const { app, vitima, atacante } = await cenarioDuasContas();

    const res = await request(app)
      .get(`/api/auth/me?id=${vitima.usuario.id}`)
      .set('Authorization', `Bearer ${atacante.token}`);

    expect(res.status).toBe(200);
    expect(res.body.usuario.id).toBe(atacante.usuario.id);
  });
});

describe('IDOR — escalada de privilegio (acoes de admin)', () => {
  test('usuario comum nao cadastra sala (403) e nada e criado', async () => {
    const { app, repositorios, atacante } = await cenarioDuasContas();
    const antes = (await repositorios.salas.list()).length;

    const res = await request(app)
      .post('/api/salas')
      .set('Authorization', `Bearer ${atacante.token}`)
      .send({ nome: 'Sala Pirata', capacidade: 4 });

    expect(res.status).toBe(403);
    expect(await repositorios.salas.list()).toHaveLength(antes);
  });

  test('enviar papel=admin no cadastro nao cria administrador (mass assignment)', async () => {
    const { app, repositorios } = buildTestApp();

    const res = await request(app)
      .post('/api/usuarios')
      .send({ nome: 'Espertinho', email: 'esperto@exemplo.com', senha: 'senha123', papel: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.usuario.papel).toBe('user');
    expect((await repositorios.usuarios.findByEmail('esperto@exemplo.com')).papel).toBe('user');
  });

  test('token forjado com papel=admin (assinado com outro segredo) e recusado', async () => {
    const { app, repositorios, atacante } = await cenarioDuasContas();
    const forjado = jwt.sign(
      { sub: atacante.usuario.id, email: atacante.usuario.email, papel: 'admin' },
      'segredo-adivinhado'
    );

    const res = await request(app)
      .post('/api/salas')
      .set('Authorization', `Bearer ${forjado}`)
      .send({ nome: 'Sala Pirata', capacidade: 4 });

    expect(res.status).toBe(401);
    expect((await repositorios.salas.list()).map((s) => s.nome)).not.toContain('Sala Pirata');
  });

  test('token com payload adulterado (papel trocado, assinatura original) e recusado', async () => {
    const { app, atacante } = await cenarioDuasContas();
    const [cabecalho, , assinatura] = atacante.token.split('.');
    const payload = jwt.decode(atacante.token);
    const adulterado = Buffer.from(JSON.stringify({ ...payload, papel: 'admin' })).toString(
      'base64url'
    );

    const res = await request(app)
      .post('/api/salas')
      .set('Authorization', `Bearer ${cabecalho}.${adulterado}.${assinatura}`)
      .send({ nome: 'Sala Pirata', capacidade: 4 });

    expect(res.status).toBe(401);
  });
});
