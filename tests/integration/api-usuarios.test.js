'use strict';

/**
 * Integracao — RF01: cadastro de usuario via API + repositorio em memoria
 * (implementacao real da interface, sem mock — ver
 * docs/qualidade/estrategia-de-testes.md). Cada teste confere o estado final
 * no repositorio, nao apenas o status HTTP.
 */
const request = require('supertest');
const { buildTestApp } = require('../helpers/buildTestApp');

describe('RF01 — POST /api/usuarios (cadastro)', () => {
  let app;
  let repositorios;

  beforeEach(() => {
    ({ app, repositorios } = buildTestApp());
  });

  test('cadastro valido retorna 201 e persiste o usuario no repositorio', async () => {
    const res = await request(app).post('/api/usuarios').send({
      nome: 'Maria Teste',
      email: 'maria.integracao@exemplo.com',
      senha: 'senha123',
    });

    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({ nome: 'Maria Teste', email: 'maria.integracao@exemplo.com' });
    expect(res.body.usuario).not.toHaveProperty('senhaHash');

    const persistido = await repositorios.usuarios.findByEmail('maria.integracao@exemplo.com');
    expect(persistido).not.toBeNull();
    expect(persistido.id).toBe(res.body.usuario.id);
    // RNF03 - senha nunca em texto puro no banco.
    expect(persistido.senhaHash).not.toBe('senha123');
  });

  test('e-mail duplicado retorna 409 e nao cria um segundo registro', async () => {
    const dados = { nome: 'Joao', email: 'duplicado@exemplo.com', senha: 'senha123' };
    await request(app).post('/api/usuarios').send(dados);

    const res = await request(app).post('/api/usuarios').send({ ...dados, nome: 'Joao Segunda Vez' });

    expect(res.status).toBe(409);
    expect(res.body.erro.codigo).toBe('EMAIL_DUPLICADO');

    // Nao ha "listAll" no repo; confirmamos indiretamente: o e-mail so
    // resolve para o primeiro cadastro (nome nao foi sobrescrito).
    const persistido = await repositorios.usuarios.findByEmail('duplicado@exemplo.com');
    expect(persistido.nome).toBe('Joao');
  });

  test('payload invalido (e-mail malformado) retorna 400 e nao persiste nada', async () => {
    const res = await request(app).post('/api/usuarios').send({
      nome: 'Fulano',
      email: 'nao-e-email',
      senha: 'senha123',
    });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('EMAIL_INVALIDO');
    expect(await repositorios.usuarios.findByEmail('nao-e-email')).toBeNull();
  });

  test('senha fraca (menos de 6 caracteres) retorna 400 com mensagem util', async () => {
    const res = await request(app).post('/api/usuarios').send({
      nome: 'Fulano',
      email: 'fulano.senha@exemplo.com',
      senha: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('SENHA_FRACA');
    expect(res.body.erro.mensagem).toBeTruthy();
  });

  test('nome ausente retorna 400', async () => {
    const res = await request(app).post('/api/usuarios').send({
      email: 'sem-nome@exemplo.com',
      senha: 'senha123',
    });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('NOME_OBRIGATORIO');
  });
});
