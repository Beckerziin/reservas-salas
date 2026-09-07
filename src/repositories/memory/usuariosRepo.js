'use strict';

const { randomUUID } = require('crypto');

/**
 * Repositorio de usuarios em memoria.
 * Cada chamada cria um estado proprio e isolado (bom para testes).
 */
function criarUsuariosRepoMemoria() {
  /** @type {Map<string, object>} */
  const porId = new Map();

  return {
    async create({ nome, email, senhaHash, papel = 'user' }) {
      const usuario = {
        id: randomUUID(),
        nome,
        email: email.toLowerCase(),
        senhaHash,
        papel,
        createdAt: new Date().toISOString(),
      };
      porId.set(usuario.id, usuario);
      return { ...usuario };
    },

    async findById(id) {
      const u = porId.get(id);
      return u ? { ...u } : null;
    },

    async findByEmail(email) {
      const alvo = String(email).toLowerCase();
      for (const u of porId.values()) {
        if (u.email === alvo) return { ...u };
      }
      return null;
    },

    // Utilitario de teste/seed
    async _clear() {
      porId.clear();
    },
  };
}

module.exports = { criarUsuariosRepoMemoria };
