'use strict';

const { test, expect } = require('@playwright/test');
const { cadastrarUsuario, diaFuturo } = require('./helpers/usuario');

// HU03 - Reservar uma sala: caminho de erro (RN02 - conflito de horário)
test.describe('HU03 — erro ao reservar horário já ocupado', () => {
  test('mostra mensagem clara e mantém os dados digitados na tela', async ({ page }) => {
    await cadastrarUsuario(page);
    const dia = diaFuturo(2);

    await page.getByRole('button', { name: 'Reservar sala' }).click();
    await page.getByLabel('Data').fill(dia);
    await page.getByLabel('Início').fill('10:00');
    await page.getByLabel('Fim').fill('11:00');
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(page.locator('.notice.success')).toBeVisible();

    // Mesma sala (pré-selecionada), mesmo dia, horário sobreposto (10:30-11:30 vs 10:00-11:00).
    await page.getByRole('button', { name: 'Reservar sala' }).click();
    await page.getByLabel('Data').fill(dia);
    await page.getByLabel('Início').fill('10:30');
    await page.getByLabel('Fim').fill('11:30');
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();

    await expect(page.locator('.notice.error')).toHaveText(/horario ja reservado para esta sala/i);
    // Continua na tela de reserva, sem perder o que foi digitado.
    await expect(page.getByRole('heading', { name: 'Nova reserva' })).toBeVisible();
    await expect(page.getByLabel('Data')).toHaveValue(dia);
    await expect(page.getByLabel('Início')).toHaveValue('10:30');
    await expect(page.getByLabel('Fim')).toHaveValue('11:30');
  });
});
