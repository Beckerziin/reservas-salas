'use strict';

const { randomUUID } = require('crypto');

/**
 * Repositorio de reservas em memoria.
 * Armazena inicio/fim como strings ISO (mesma forma que o Supabase devolve).
 */
function criarReservasRepoMemoria() {
  /** @type {Map<string, object>} */
  const porId = new Map();

  return {
    async create({ usuarioId, salaId, inicio, fim, status = 'ativa' }) {
      const reserva = {
        id: randomUUID(),
        usuarioId,
        salaId,
        inicio: new Date(inicio).toISOString(),
        fim: new Date(fim).toISOString(),
        status,
        createdAt: new Date().toISOString(),
      };
      porId.set(reserva.id, reserva);
      return { ...reserva };
    },

    async findById(id) {
      const r = porId.get(id);
      return r ? { ...r } : null;
    },

    async listByUsuario(usuarioId) {
      return Array.from(porId.values())
        .filter((r) => String(r.usuarioId) === String(usuarioId))
        .map((r) => ({ ...r }));
    },

    // Reservas ATIVAS de uma sala (base para checar conflito - RN02).
    async listAtivasBySala(salaId) {
      return Array.from(porId.values())
        .filter((r) => String(r.salaId) === String(salaId) && r.status === 'ativa')
        .map((r) => ({ ...r }));
    },

    async updateStatus(id, status) {
      const r = porId.get(id);
      if (!r) return null;
      r.status = status;
      return { ...r };
    },

    async _clear() {
      porId.clear();
    },
  };
}

module.exports = { criarReservasRepoMemoria };
