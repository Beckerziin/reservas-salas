'use strict';

const { ValidationError } = require('../domain/errors');
const { textoPreenchido, STATUS_SALA } = require('../domain/validacoes');

/**
 * Service de salas. RF03 (listar) e RF08 (cadastrar - admin).
 * @param {{ salas: object }} repos
 */
function criarSalasService({ salas }) {
  return {
    // RF03 - Listar salas disponiveis (nome, capacidade, status).
    async listar() {
      return salas.list();
    },

    async buscarPorId(id) {
      return salas.findById(id);
    },

    // RF08 - Cadastrar sala (uso administrativo).
    async cadastrar({ nome, capacidade, status = 'disponivel' }) {
      if (!textoPreenchido(nome)) {
        throw new ValidationError('Nome da sala e obrigatorio', 'NOME_OBRIGATORIO');
      }
      const cap = Number(capacidade);
      if (!Number.isInteger(cap) || cap <= 0) {
        throw new ValidationError('Capacidade deve ser inteiro positivo', 'CAPACIDADE_INVALIDA');
      }
      if (!STATUS_SALA.includes(status)) {
        throw new ValidationError(
          `Status deve ser um de: ${STATUS_SALA.join(', ')}`,
          'STATUS_INVALIDO'
        );
      }
      return salas.create({ nome: nome.trim(), capacidade: cap, status });
    },
  };
}

module.exports = { criarSalasService };
