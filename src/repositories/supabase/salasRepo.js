'use strict';

const { getSupabaseClient } = require('../../config/supabaseClient');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    capacidade: row.capacidade,
    status: row.status,
    createdAt: row.created_at,
  };
}

function criarSalasRepoSupabase() {
  const db = () => getSupabaseClient().from('salas');

  return {
    async create({ nome, capacidade, status = 'disponivel' }) {
      const { data, error } = await db()
        .insert({ nome, capacidade, status })
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    },

    async list() {
      const { data, error } = await db().select('*').order('nome', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapRow);
    },

    async findById(id) {
      const { data, error } = await db().select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return mapRow(data);
    },
  };
}

module.exports = { criarSalasRepoSupabase };
