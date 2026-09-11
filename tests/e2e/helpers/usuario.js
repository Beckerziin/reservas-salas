'use strict';

const { randomUUID } = require('crypto');

/** Formata Date como YYYY-MM-DD (input type="date") no fuso local. */
function paraDataInput(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Dia de hoje + N dias, como string YYYY-MM-DD. Evita duracao/antecedencia invalida por horario do dia. */
function diaFuturo(diasAFrente) {
  const data = new Date();
  data.setDate(data.getDate() + diasAFrente);
  return paraDataInput(data);
}

/** Cadastra e ja autentica um usuario novo (via UI), unico por execucao. */
async function cadastrarUsuario(page, { nome = 'Estudante QA' } = {}) {
  const email = `qa-${randomUUID()}@fag.local`;
  const senha = 'senha123';

  await page.goto('/');
  // No estado inicial (login) só existe UM botão "Criar conta": o de trocar de aba.
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('Nome completo').fill(nome);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: false }).fill(senha);
  // Agora existem dois "Criar conta" (aba ativa + botão de submit): pega o do form.
  await page.locator('.auth-card form button[type="submit"]').click();

  await page.getByRole('heading', { name: 'Visão geral' }).waitFor();

  return { email, senha, nome };
}

module.exports = { cadastrarUsuario, diaFuturo };
