'use strict';

const { getSupabaseClient } = require('../../config/supabaseClient');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    salaId: row.sala_id,
    inicio: row.inicio,
    fim: row.fim,
    status: row.status,
    createdAt: row.created_at,
  };
}

function criarReservasRepoSupabase() {
  const db = () => getSupabaseClient().from('reservas');

  return {
    async create({ usuarioId, salaId, inicio, fim, status = 'ativa' }) {
      const { data, error } = await db()
        .insert({
          usuario_id: usuarioId,
          sala_id: salaId,
          inicio: new Date(inicio).toISOString(),
          fim: new Date(fim).toISOString(),
          status,
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    },

    async findById(id) {
      const { data, error } = await db().select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return mapRow(data);
    },

    async listByUsuario(usuarioId) {
      const { data, error } = await db()
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('inicio', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapRow);
    },

    async listAtivasBySala(salaId) {
      const { data, error } = await db()
        .select('*')
        .eq('sala_id', salaId)
        .eq('status', 'ativa');
      if (error) throw error;
      return (data || []).map(mapRow);
    },

    async updateStatus(id, status) {
      const { data, error } = await db()
        .update({ status })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return mapRow(data);
    },
  };
}

module.exports = { criarReservasRepoSupabase };
