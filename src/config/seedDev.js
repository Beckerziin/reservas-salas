'use strict';

const bcrypt = require('bcryptjs');

/**
 * Popula dados de exemplo APENAS no modo memoria/dev, para que o frontend
 * consiga testar a API localmente sem depender do Supabase.
 * Nunca e chamado durante os testes automatizados.
 *
 * Credenciais de exemplo:
 *   admin@fag.local / admin123   (papel: admin)
 *   aluno@fag.local / aluno123   (papel: user)
 */
async function seedDev(repositorios) {
  const { usuarios, salas } = repositorios;

  const senhaAdmin = await bcrypt.hash('admin123', 8);
  const senhaAluno = await bcrypt.hash('aluno123', 8);

  await usuarios.create({
    nome: 'Administrador',
    email: 'admin@fag.local',
    senhaHash: senhaAdmin,
    papel: 'admin',
  });
  await usuarios.create({
    nome: 'Aluno Exemplo',
    email: 'aluno@fag.local',
    senhaHash: senhaAluno,
    papel: 'user',
  });

  await salas.create({ nome: 'Sala de Estudo 1', capacidade: 4 });
  await salas.create({ nome: 'Sala de Estudo 2', capacidade: 6 });
  await salas.create({ nome: 'Sala de Reuniao', capacidade: 10, status: 'disponivel' });

  console.log('[seed] Dados de exemplo criados (modo memoria).');
}

module.exports = { seedDev };
