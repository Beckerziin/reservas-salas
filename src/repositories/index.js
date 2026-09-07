'use strict';

const { env } = require('../config/env');

const { criarUsuariosRepoMemoria } = require('./memory/usuariosRepo');
const { criarSalasRepoMemoria } = require('./memory/salasRepo');
const { criarReservasRepoMemoria } = require('./memory/reservasRepo');

const { criarUsuariosRepoSupabase } = require('./supabase/usuariosRepo');
const { criarSalasRepoSupabase } = require('./supabase/salasRepo');
const { criarReservasRepoSupabase } = require('./supabase/reservasRepo');

/**
 * Constroi o conjunto de repositorios em memoria (estado proprio).
 * Usado em dev/testes e como default.
 */
function criarRepositoriosMemoria() {
  return {
    tipo: 'memory',
    usuarios: criarUsuariosRepoMemoria(),
    salas: criarSalasRepoMemoria(),
    reservas: criarReservasRepoMemoria(),
  };
}

/**
 * Constroi o conjunto de repositorios apoiado no Supabase.
 */
function criarRepositoriosSupabase() {
  return {
    tipo: 'supabase',
    usuarios: criarUsuariosRepoSupabase(),
    salas: criarSalasRepoSupabase(),
    reservas: criarReservasRepoSupabase(),
  };
}

/**
 * Escolhe a implementacao conforme DATA_SOURCE.
 */
function criarRepositorios() {
  if (env.dataSource === 'supabase') {
    return criarRepositoriosSupabase();
  }
  return criarRepositoriosMemoria();
}

module.exports = {
  criarRepositorios,
  criarRepositoriosMemoria,
  criarRepositoriosSupabase,
};
