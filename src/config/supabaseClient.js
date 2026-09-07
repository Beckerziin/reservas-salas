'use strict';

const { createClient } = require('@supabase/supabase-js');
const { env } = require('./env');

let client = null;

/**
 * Retorna um cliente Supabase singleton.
 * So e chamado quando DATA_SOURCE=supabase.
 */
function getSupabaseClient() {
  if (!env.supabaseUrl || !env.supabaseKey) {
    throw new Error(
      'Supabase nao configurado: defina SUPABASE_URL e SUPABASE_KEY no ambiente.'
    );
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

module.exports = { getSupabaseClient };
