'use strict';

const { test, expect } = require('@playwright/test');
const { cadastrarUsuario, diaFuturo } = require('./helpers/usuario');

// HU03 - Reservar uma sala (RF04/RF05, RN01/RN02/RN05) + HU04 - Consultar (RF06)
test.describe('HU03 — reservar uma sala de estudo', () => {
  test('cadastra, escolhe sala e horário, confirma e vê a reserva em "Minhas reservas"', async ({
    page,
  }) => {
    await cadastrarUsuario(page);

    await page.getByRole('button', { name: 'Reservar sala' }).click();
    await expect(page.getByRole('heading', { name: 'Nova reserva' })).toBeVisible();

    // Sala já vem pré-selecionada (primeira disponível). Amanhã, 14h-15h: dentro
    // da antecedência mínima (RN01) e da duração máxima (RN05).
    await page.getByLabel('Data').fill(diaFuturo(1));
    await page.getByLabel('Início').fill('14:00');
    await page.getByLabel('Fim').fill('15:00');
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();

    await expect(page.locator('.notice.success')).toHaveText(/reserva confirmada com sucesso/i);

    // A confirmação leva automaticamente para "Minhas reservas" (HU04).
    await expect(page.getByRole('heading', { name: 'Minhas reservas' })).toBeVisible();
    const item = page.locator('.reservation-item');
    await expect(item).toHaveCount(1);
    await expect(item).toContainText('14:00');
    await expect(item.locator('.status')).toHaveText('ativa');
    await expect(item.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });
});
