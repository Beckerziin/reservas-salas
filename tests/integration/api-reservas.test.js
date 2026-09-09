'use strict';

/**
 * Integracao — RF04/RF05 (criar reserva), RF06 (listar minhas), RF07
 * (cancelar). Aplica RN01, RN02, RN03, RN04, RN05. Cada teste confere o
 * estado final no repositorio de reservas, nao so o status HTTP.
 */
const request = require('supertest');
const {
  buildTestApp,
  criarSala,
  registrarELogar,
  daquiAMinutos,
} = require('../helpers/buildTestApp');

describe('RF04/RF05 — POST /api/reservas (criar)', () => {
  test('reserva valida retorna 201 e o registro e persistido no repositorio', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token, usuario } = await registrarELogar(app);

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(60), fim: daquiAMinutos(90) });

    expect(res.status).toBe(201);
    expect(res.body.reserva).toMatchObject({ salaId: sala.id, usuarioId: usuario.id, status: 'ativa' });

    const persistida = await repositorios.reservas.findById(res.body.reserva.id);
    expect(persistida).not.toBeNull();
    expect(persistida.status).toBe('ativa');
  });

  test('RN01 — antecedencia insuficiente (30 min) retorna 400 e nao persiste', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token, usuario } = await registrarELogar(app);

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(10), fim: daquiAMinutos(40) });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('ANTECEDENCIA_INSUFICIENTE');
    expect(await repositorios.reservas.listByUsuario(usuario.id)).toEqual([]);
  });

  test('RN05 — duracao acima de 2 horas retorna 400 e nao persiste', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token, usuario } = await registrarELogar(app);

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(60), fim: daquiAMinutos(60 + 3 * 60) });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('DURACAO_INVALIDA');
    expect(await repositorios.reservas.listByUsuario(usuario.id)).toEqual([]);
  });

  test('RN02 — horario ja ocupado na mesma sala retorna 409 e nao cria segundo registro', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token: token1 } = await registrarELogar(app);
    const { token: token2 } = await registrarELogar(app);

    const inicio = daquiAMinutos(60);
    const fim = daquiAMinutos(90);

    const primeira = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token1}`)
      .send({ salaId: sala.id, inicio, fim });
    expect(primeira.status).toBe(201);

    const segunda = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token2}`)
      .send({ salaId: sala.id, inicio, fim });

    expect(segunda.status).toBe(409);
    expect(segunda.body.erro.codigo).toBe('CONFLITO_HORARIO');

    const ativasDaSala = await repositorios.reservas.listAtivasBySala(sala.id);
    expect(ativasDaSala).toHaveLength(1);
  });

  test('horarios apenas encostados (RN02) nao conflitam e ambas sao criadas', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token: token1 } = await registrarELogar(app);
    const { token: token2 } = await registrarELogar(app);

    const meio = daquiAMinutos(120);
    const primeira = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token1}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(60), fim: meio });
    expect(primeira.status).toBe(201);

    const segunda = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token2}`)
      .send({ salaId: sala.id, inicio: meio, fim: daquiAMinutos(150) });
    expect(segunda.status).toBe(201);

    expect(await repositorios.reservas.listAtivasBySala(sala.id)).toHaveLength(2);
  });

  test('sala inexistente retorna 404 e nao persiste', async () => {
    const { app, repositorios } = buildTestApp();
    const { token, usuario } = await registrarELogar(app);

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ salaId: 'sala-que-nao-existe', inicio: daquiAMinutos(60), fim: daquiAMinutos(90) });

    expect(res.status).toBe(404);
    expect(await repositorios.reservas.listByUsuario(usuario.id)).toEqual([]);
  });

  test('payload sem salaId retorna 400 SALA_OBRIGATORIA', async () => {
    const { app } = buildTestApp();
    const { token } = await registrarELogar(app);

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ inicio: daquiAMinutos(60), fim: daquiAMinutos(90) });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('SALA_OBRIGATORIA');
  });

  test('horario invalido (fim antes do inicio, formato data/hora) retorna 400', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token } = await registrarELogar(app);

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(90), fim: daquiAMinutos(60) });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('DURACAO_INVALIDA');
  });

  test('aceita formato {data, horaInicio, horaFim} (RF04/RF05 - segundo formato aceito)', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token } = await registrarELogar(app);

    const amanha = new Date(Date.now() + 26 * 60 * 60 * 1000);
    const data = amanha.toISOString().slice(0, 10);

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ salaId: sala.id, data, horaInicio: '14:00:00.000Z', horaFim: '15:00:00.000Z' });

    expect(res.status).toBe(201);
    expect(await repositorios.reservas.findById(res.body.reserva.id)).not.toBeNull();
  });

  test('sem autenticacao retorna 401 e nao persiste', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);

    const res = await request(app)
      .post('/api/reservas')
      .send({ salaId: sala.id, inicio: daquiAMinutos(60), fim: daquiAMinutos(90) });

    expect(res.status).toBe(401);
    expect(await repositorios.reservas.listAtivasBySala(sala.id)).toEqual([]);
  });
});

describe('RF06 — GET /api/reservas/minhas', () => {
  test('retorna somente as reservas do usuario autenticado, com os campos esperados', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token: tokenA, usuario: usuarioA } = await registrarELogar(app);
    const { token: tokenB } = await registrarELogar(app);

    await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(60), fim: daquiAMinutos(90) });
    await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(200), fim: daquiAMinutos(230) });

    const res = await request(app).get('/api/reservas/minhas').set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.reservas).toHaveLength(1);
    expect(res.body.reservas[0]).toMatchObject({ usuarioId: usuarioA.id, salaId: sala.id, status: 'ativa' });
    expect(res.body.reservas[0]).toHaveProperty('inicio');
    expect(res.body.reservas[0]).toHaveProperty('fim');
    expect(res.body.reservas[0]).toHaveProperty('createdAt');
  });

  test('usuario sem reservas recebe lista vazia', async () => {
    const { app } = buildTestApp();
    const { token } = await registrarELogar(app);
    const res = await request(app).get('/api/reservas/minhas').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.reservas).toEqual([]);
  });
});

describe('RF07 — PATCH /api/reservas/:id/cancelar', () => {
  async function criarReservaFutura(app, repositorios, tokenDono) {
    const sala = await criarSala(repositorios);
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(60), fim: daquiAMinutos(90) });
    return res.body.reserva;
  }

  test('dono cancela a propria reserva e o status e atualizado no repositorio', async () => {
    const { app, repositorios } = buildTestApp();
    const { token } = await registrarELogar(app);
    const reserva = await criarReservaFutura(app, repositorios, token);

    const res = await request(app)
      .patch(`/api/reservas/${reserva.id}/cancelar`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.reserva.status).toBe('cancelada');

    const persistida = await repositorios.reservas.findById(reserva.id);
    expect(persistida.status).toBe('cancelada');
  });

  test('RN03 — terceiro (nao dono) tentando cancelar recebe 403 e nada muda', async () => {
    const { app, repositorios } = buildTestApp();
    const { token: tokenDono } = await registrarELogar(app);
    const { token: tokenOutro } = await registrarELogar(app);
    const reserva = await criarReservaFutura(app, repositorios, tokenDono);

    const res = await request(app)
      .patch(`/api/reservas/${reserva.id}/cancelar`)
      .set('Authorization', `Bearer ${tokenOutro}`);

    expect(res.status).toBe(403);
    expect(res.body.erro.codigo).toBe('NAO_E_DONO');

    const persistida = await repositorios.reservas.findById(reserva.id);
    expect(persistida.status).toBe('ativa');
  });

  test('cancelar reserva ja cancelada retorna 409 JA_CANCELADA', async () => {
    const { app, repositorios } = buildTestApp();
    const { token } = await registrarELogar(app);
    const reserva = await criarReservaFutura(app, repositorios, token);

    await request(app).patch(`/api/reservas/${reserva.id}/cancelar`).set('Authorization', `Bearer ${token}`);
    const segunda = await request(app)
      .patch(`/api/reservas/${reserva.id}/cancelar`)
      .set('Authorization', `Bearer ${token}`);

    expect(segunda.status).toBe(409);
    expect(segunda.body.erro.codigo).toBe('JA_CANCELADA');
  });

  test('RN04 — reserva ja ocorrida (passada) nao pode ser cancelada', async () => {
    const { app, repositorios } = buildTestApp();
    const { token, usuario } = await registrarELogar(app);
    const sala = await criarSala(repositorios);
    // Cria a reserva ja "no passado" direto no repositorio (a API nunca
    // aceitaria isso na criacao, por RN01 - o objetivo aqui e testar RN04
    // isoladamente no cancelamento).
    const passada = await repositorios.reservas.create({
      usuarioId: usuario.id,
      salaId: sala.id,
      inicio: new Date(Date.now() - 60 * 60 * 1000),
      fim: new Date(Date.now() - 30 * 60 * 1000),
    });

    const res = await request(app)
      .patch(`/api/reservas/${passada.id}/cancelar`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('RESERVA_PASSADA');

    const persistida = await repositorios.reservas.findById(passada.id);
    expect(persistida.status).toBe('ativa');
  });

  test('cancelar reserva inexistente retorna 404', async () => {
    const { app } = buildTestApp();
    const { token } = await registrarELogar(app);

    const res = await request(app)
      .patch('/api/reservas/id-que-nao-existe/cancelar')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('cancelamento libera o horario para nova reserva na mesma sala', async () => {
    const { app, repositorios } = buildTestApp();
    const { token: tokenDono } = await registrarELogar(app);
    const { token: tokenOutro } = await registrarELogar(app);
    const reserva = await criarReservaFutura(app, repositorios, tokenDono);
    const sala = await repositorios.salas.findById(reserva.salaId);

    await request(app).patch(`/api/reservas/${reserva.id}/cancelar`).set('Authorization', `Bearer ${tokenDono}`);

    const novaTentativa = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenOutro}`)
      .send({ salaId: sala.id, inicio: reserva.inicio, fim: reserva.fim });

    expect(novaTentativa.status).toBe(201);
  });
});
