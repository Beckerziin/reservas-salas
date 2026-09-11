'use strict';

const { test, expect } = require('@playwright/test');
const { cadastrarUsuario, diaFuturo } = require('./helpers/usuario');

// HU05 - Cancelar reserva (RF07, RN03/RN04)
test.describe('HU05 — cancelar uma reserva', () => {
  test('localiza a própria reserva, cancela e vê o status atualizado', async ({ page }) => {
    await cadastrarUsuario(page);

    await page.getByRole('button', { name: 'Reservar sala' }).click();
    await page.getByLabel('Data').fill(diaFuturo(3));
    await page.getByLabel('Início').fill('16:00');
    await page.getByLabel('Fim').fill('17:00');
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();
    await expect(page.getByRole('heading', { name: 'Minhas reservas' })).toBeVisible();

    const item = page.locator('.reservation-item');
    await expect(item.locator('.status')).toHaveText('ativa');

    await item.getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.locator('.notice.success')).toHaveText(/reserva cancelada/i);
    await expect(item.locator('.status')).toHaveText('cancelada');
    await expect(item.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
