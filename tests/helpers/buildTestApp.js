'use strict';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../../src/app');
const { criarRepositoriosMemoria } = require('../../src/repositories');

/**
 * Cria uma instancia limpa da aplicacao com repositorios EM MEMORIA.
 * Cada chamada e isolada (estado proprio), ideal para testes de
 * integracao e de sistema sem depender do Supabase.
 *
 * @returns {{ app: import('express').Express, repositorios: object }}
 */
function buildTestApp() {
  const repositorios = criarRepositoriosMemoria();
  const app = createApp({
    repositorios,
    config: { jwtSecret: 'test-secret', jwtExpiresIn: '1h' },
  });
  return { app, repositorios };
}

/**
 * Cria uma sala diretamente no repositorio (atalho para os testes).
 */
async function criarSala(repositorios, dados = {}) {
  return repositorios.salas.create({
    nome: 'Sala Teste',
    capacidade: 4,
    status: 'disponivel',
    ...dados,
  });
}

/**
 * Registra um usuario e faz login, retornando o token JWT.
 * Facilita testes de rotas autenticadas (RF04, RF06, RF07).
 *
 * @returns {Promise<{ token:string, usuario:object, credenciais:object }>}
 */
async function registrarELogar(app, dados = {}) {
  const credenciais = {
    nome: 'Usuario Teste',
    email: `user_${Date.now()}_${Math.random().toString(16).slice(2)}@exemplo.com`,
    senha: 'senha123',
    ...dados,
  };

  await request(app).post('/api/usuarios').send(credenciais);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: credenciais.email, senha: credenciais.senha });

  return { token: res.body.token, usuario: res.body.usuario, credenciais };
}

/**
 * Gera um horario ISO daqui a X minutos (util para respeitar a RN01 nos testes).
 */
function daquiAMinutos(minutos) {
  return new Date(Date.now() + minutos * 60 * 1000).toISOString();
}

/**
 * Cria um usuario com papel "admin" direto no repositorio (nao ha rota
 * publica para se autopromover a admin - RF08 exige isso) e faz login pela
 * API de verdade para obter o token. Util para testar RF08/403 nao-admin.
 *
 * @returns {Promise<{ token:string, usuario:object, credenciais:object }>}
 */
async function registrarAdminELogar(app, repositorios, dados = {}) {
  const credenciais = {
    nome: 'Admin Teste',
    email: `admin_${Date.now()}_${Math.random().toString(16).slice(2)}@exemplo.com`,
    senha: 'senha123',
    ...dados,
  };
  const senhaHash = await bcrypt.hash(credenciais.senha, 4);
  await repositorios.usuarios.create({
    nome: credenciais.nome,
    email: credenciais.email,
    senhaHash,
    papel: 'admin',
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: credenciais.email, senha: credenciais.senha });

  return { token: res.body.token, usuario: res.body.usuario, credenciais };
}

module.exports = {
  buildTestApp,
  criarSala,
  registrarELogar,
  registrarAdminELogar,
  daquiAMinutos,
};
