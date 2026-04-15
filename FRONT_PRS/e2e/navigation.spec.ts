/**
 * Pruebas E2E para navegación y menús
 */

import { test, expect } from '@playwright/test';

test.describe('Navegación', () => {
    test.beforeEach(async ({ page }) => {
        // Hacer login antes de cada test
        await page.goto('/login');
        await page.getByLabel(/usuario/i).fill('daniel');
        await page.getByLabel(/contraseña/i).fill('tu_password_aqui');
        await page.getByRole('button', { name: /ingresar/i }).click();
        await expect(page).toHaveURL('/');
    });

    test('debe mostrar navbar con todas las opciones', async ({ page }) => {
        // Verificar que el navbar tiene todos los links
        await expect(page.getByRole('link', { name: /préstamos/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /histórico/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /admin/i })).toBeVisible();
    });

    test('debe navegar a página de préstamos', async ({ page }) => {
        await page.getByRole('link', { name: /préstamos/i }).first().click();

        await expect(page).toHaveURL('/prestamos');
        await expect(page.getByText(/préstamos y devoluciones/i)).toBeVisible();
    });

    test('debe navegar a página de histórico', async ({ page }) => {
        await page.getByRole('link', { name: /histórico/i }).first().click();

        await expect(page).toHaveURL('/historico');
        await expect(page.getByText(/consultar histórico/i)).toBeVisible();
    });

    test('debe navegar a página de admin', async ({ page }) => {
        await page.getByRole('link', { name: /admin/i }).click();

        await expect(page).toHaveURL('/admin');
    });

    test('debe resaltar el link activo en el navbar', async ({ page }) => {
        // Ir a préstamos
        await page.goto('/prestamos');

        // El link de préstamos debe estar resaltado
        const prestamosLink = page.getByRole('link', { name: /préstamos/i }).first();
        await expect(prestamosLink).toHaveClass(/bg-sky-blue/);
    });

    test('debe tener menú lateral en desktop', async ({ page }) => {
        // Verificar que el menú lateral existe
        await expect(page.getByText('Menú')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Inicio' })).toBeVisible();
    });

    test('debe cambiar tema con ThemeToggle', async ({ page }) => {
        const themeToggle = page.getByTitle(/cambiar tema/i);
        await expect(themeToggle).toBeVisible();

        // Click para cambiar a modo oscuro
        await themeToggle.click();

        // Verificar que el tema cambió (el HTML debe tener clase 'dark')
        const html = page.locator('html');
        await expect(html).toHaveClass(/dark/);

        // Click de nuevo para volver a modo claro
        await themeToggle.click();
        await expect(html).not.toHaveClass(/dark/);
    });

    test('debe volver a home al hacer click en el logo', async ({ page }) => {
        // Navegar a otra página
        await page.goto('/prestamos');

        // Click en el logo
        await page.getByLabel(/ir al inicio/i).click();

        // Debe volver a home
        await expect(page).toHaveURL('/');
    });
});
