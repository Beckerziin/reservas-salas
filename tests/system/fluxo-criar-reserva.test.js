'use strict';

/**
 * Sistema — HU01/HU02/HU03/HU04: caminho feliz completo do MVP, do ponto de
 * vista do cliente HTTP (equivalente a um E2E de navegador, mas sem UI —
 * ainda nao ha Frontend neste repositorio; ver docs/qualidade/rastreabilidade.md).
 *
 * Fluxo: cadastro -> login -> listar salas -> criar reserva -> encontrar a
 * reserva na listagem "minhas reservas".
 */
const request = require('supertest');
const { buildTestApp, criarSala, daquiAMinutos } = require('../helpers/buildTestApp');

describe('HU01-HU04 — cadastro, login, reservar e consultar (caminho feliz)', () => {
  test('usuario cadastra, loga, escolhe sala, reserva e ve a reserva na listagem', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios, { nome: 'Sala de Estudos 1', capacidade: 4 });

    // HU01 - cadastro
    const cadastro = await request(app).post('/api/usuarios').send({
      nome: 'Cliente Final',
      email: 'cliente.final@exemplo.com',
      senha: 'senha123',
    });
    expect(cadastro.status).toBe(201);
    expect(cadastro.body.mensagem).toMatch(/sucesso/i);

    // HU02 - login
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente.final@exemplo.com', senha: 'senha123' });
    expect(login.status).toBe(200);
    const { token } = login.body;

    // escolher sala (RF03)
    const salas = await request(app).get('/api/salas');
    expect(salas.status).toBe(200);
    const salaEscolhida = salas.body.salas.find((s) => s.id === sala.id);
    expect(salaEscolhida).toBeDefined();

    // HU03 - reservar horario
    const inicio = daquiAMinutos(120);
    const fim = daquiAMinutos(150);
    const reserva = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ salaId: salaEscolhida.id, inicio, fim });

    expect(reserva.status).toBe(201);
    expect(reserva.body.mensagem).toBe('Reserva confirmada');

    // HU04 - encontrar a reserva na listagem
    const minhas = await request(app)
      .get('/api/reservas/minhas')
      .set('Authorization', `Bearer ${token}`);

    expect(minhas.status).toBe(200);
    expect(minhas.body.reservas.map((r) => r.id)).toContain(reserva.body.reserva.id);
    expect(minhas.body.reservas[0].status).toBe('ativa');
  });
});
