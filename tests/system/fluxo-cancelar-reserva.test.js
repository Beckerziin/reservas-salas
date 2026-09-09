'use strict';

/**
 * Sistema — HU05: localizar a propria reserva e cancela-la; a reserva deve
 * sumir da lista de reservas ativas (ou aparecer com status "cancelada") e
 * o horario deve ficar livre de novo.
 */
const request = require('supertest');
const { buildTestApp, criarSala, registrarELogar, daquiAMinutos } = require('../helpers/buildTestApp');

describe('HU05 — cancelar a propria reserva', () => {
  test('usuario localiza a reserva, cancela e ela aparece cancelada na listagem', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token } = await registrarELogar(app);

    const criada = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(60), fim: daquiAMinutos(90) });
    expect(criada.status).toBe(201);

    // Localiza a propria reserva na listagem (como o usuario faria antes de cancelar).
    const antes = await request(app).get('/api/reservas/minhas').set('Authorization', `Bearer ${token}`);
    const reservaEncontrada = antes.body.reservas.find((r) => r.id === criada.body.reserva.id);
    expect(reservaEncontrada.status).toBe('ativa');

    const cancelamento = await request(app)
      .patch(`/api/reservas/${reservaEncontrada.id}/cancelar`)
      .set('Authorization', `Bearer ${token}`);
    expect(cancelamento.status).toBe(200);
    expect(cancelamento.body.mensagem).toMatch(/cancelad/i);

    const depois = await request(app).get('/api/reservas/minhas').set('Authorization', `Bearer ${token}`);
    const reservaAtualizada = depois.body.reservas.find((r) => r.id === criada.body.reserva.id);
    expect(reservaAtualizada.status).toBe('cancelada');
  });

  test('apos cancelar, o horario fica livre para outro usuario reservar a mesma sala', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios);
    const { token: tokenDono } = await registrarELogar(app);
    const { token: tokenOutro } = await registrarELogar(app);
    const inicio = daquiAMinutos(60);
    const fim = daquiAMinutos(90);

    const criada = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ salaId: sala.id, inicio, fim });

    await request(app)
      .patch(`/api/reservas/${criada.body.reserva.id}/cancelar`)
      .set('Authorization', `Bearer ${tokenDono}`);

    const novaReserva = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenOutro}`)
      .send({ salaId: sala.id, inicio, fim });

    expect(novaReserva.status).toBe(201);
  });
});
