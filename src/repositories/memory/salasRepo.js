'use strict';

const { randomUUID } = require('crypto');

/**
 * Repositorio de salas em memoria.
 */
function criarSalasRepoMemoria() {
  /** @type {Map<string, object>} */
  const porId = new Map();

  return {
    async create({ nome, capacidade, status = 'disponivel' }) {
      const sala = {
        id: randomUUID(),
        nome,
        capacidade,
        status,
        createdAt: new Date().toISOString(),
      };
      porId.set(sala.id, sala);
      return { ...sala };
    },

    async list() {
      return Array.from(porId.values()).map((s) => ({ ...s }));
    },

    async findById(id) {
      const s = porId.get(id);
      return s ? { ...s } : null;
    },

    async _clear() {
      porId.clear();
    },
  };
}

module.exports = { criarSalasRepoMemoria };
