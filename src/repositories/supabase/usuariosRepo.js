'use strict';

const { getSupabaseClient } = require('../../config/supabaseClient');

// Converte linha do banco (snake_case) para objeto de dominio (camelCase).
function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    senhaHash: row.senha_hash,
    papel: row.papel,
    createdAt: row.created_at,
  };
}

function criarUsuariosRepoSupabase() {
  const db = () => getSupabaseClient().from('usuarios');

  return {
    async create({ nome, email, senhaHash, papel = 'user' }) {
      const { data, error } = await db()
        .insert({ nome, email: email.toLowerCase(), senha_hash: senhaHash, papel })
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

    async findByEmail(email) {
      const { data, error } = await db()
        .select('*')
        .eq('email', String(email).toLowerCase())
        .maybeSingle();
      if (error) throw error;
      return mapRow(data);
    },
  };
}

module.exports = { criarUsuariosRepoSupabase };
