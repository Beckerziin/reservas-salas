'use strict';

/**
 * Sistema — HU03 (caminho de erro): tentar reservar um horario ja ocupado
 * deve devolver uma mensagem de erro clara, sem afetar a reserva existente,
 * e o usuario deve conseguir tentar de novo com outro horario imediatamente
 * (sem precisar re-autenticar ou refazer nada anterior).
 */
const request = require('supertest');
const { buildTestApp, criarSala, registrarELogar, daquiAMinutos } = require('../helpers/buildTestApp');

describe('HU03 — tentar reservar horario ja ocupado', () => {
  test('recebe 409 com mensagem clara e consegue reservar outro horario a seguir', async () => {
    const { app, repositorios } = buildTestApp();
    const sala = await criarSala(repositorios, { nome: 'Sala Concorrida' });
    const { token: tokenPrimeiro } = await registrarELogar(app);
    const { token: tokenSegundo } = await registrarELogar(app);

    const inicio = daquiAMinutos(60);
    const fim = daquiAMinutos(90);

    const primeira = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenPrimeiro}`)
      .send({ salaId: sala.id, inicio, fim });
    expect(primeira.status).toBe(201);

    // Segundo usuario tenta o mesmo horario, na mesma sala.
    const conflito = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenSegundo}`)
      .send({ salaId: sala.id, inicio, fim });

    expect(conflito.status).toBe(409);
    expect(conflito.body.erro.codigo).toBe('CONFLITO_HORARIO');
    expect(conflito.body.erro.mensagem).toBeTruthy();

    // A reserva original continua intacta.
    const minhasDoPrimeiro = await request(app)
      .get('/api/reservas/minhas')
      .set('Authorization', `Bearer ${tokenPrimeiro}`);
    expect(minhasDoPrimeiro.body.reservas).toHaveLength(1);
    expect(minhasDoPrimeiro.body.reservas[0].status).toBe('ativa');

    // O segundo usuario tenta de novo, agora com outro horario, e funciona.
    const outroHorario = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenSegundo}`)
      .send({ salaId: sala.id, inicio: daquiAMinutos(150), fim: daquiAMinutos(180) });

    expect(outroHorario.status).toBe(201);
  });
});
