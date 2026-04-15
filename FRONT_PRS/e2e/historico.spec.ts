/**
 * Pruebas E2E para consulta de histórico y exportación
 */

import { test, expect } from '@playwright/test';

test.describe('Histórico', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByLabel(/usuario/i).fill('daniel');
        await page.getByLabel(/contraseña/i).fill('tu_password_aqui');
        await page.getByRole('button', { name: /ingresar/i }).click();
        await expect(page).toHaveURL('/');

        // Navegar a histórico
        await page.goto('/historico');
    });

    test('debe mostrar página de histórico', async ({ page }) => {
        await expect(page).toHaveURL('/historico');
        await expect(page.getByText(/consultar histórico/i)).toBeVisible();
    });

    test('debe tener filtros de búsqueda', async ({ page }) => {
        // Verificar que hay campos de filtro
        // Los selectores exactos dependen de tu implementación
        await expect(page.locator('form')).toBeVisible();
    });

    test.skip('debe filtrar por rango de fechas', async ({ page }) => {
        // Seleccionar fecha inicial
        await page.fill('input[type="date"]', '2024-01-01');

        // Click en buscar
        await page.getByRole('button', { name: /buscar/i }).click();

        // Verificar que se muestran resultados
        await expect(page.getByRole('table')).toBeVisible();
    });

    test.skip('debe filtrar por empleado', async ({ page }) => {
        // Buscar por nombre de empleado
        await page.fill('input[name="empleado"]', 'Juan');
        await page.getByRole('button', { name: /buscar/i }).click();

        // Verificar resultados
        await expect(page.getByText(/juan/i)).toBeVisible();
    });

    test.skip('debe exportar a CSV', async ({ page }) => {
        // Setup para capturar la descarga
        const downloadPromise = page.waitForEvent('download');

        // Click en exportar CSV
        await page.getByRole('button', { name: /exportar.*csv/i }).click();

        // Esperar descarga
        const download = await downloadPromise;

        // Verificar que el archivo se descargó
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });

    test.skip('debe exportar a Excel', async ({ page }) => {
        // Setup para capturar la descarga
        const downloadPromise = page.waitForEvent('download');

        // Click en exportar Excel
        await page.getByRole('button', { name: /exportar.*excel/i }).click();

        // Esperar descarga
        const download = await downloadPromise;

        // Verificar que el archivo se descargó
        expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    });

    test.skip('debe mostrar detalles de un préstamo', async ({ page }) => {
        // Click en el primer préstamo de la tabla
        await page.getByRole('row').nth(1).click();

        // Debe mostrar un modal o expandir detalles
        await expect(page.getByText(/detalles del préstamo/i)).toBeVisible();
    });

    test.skip('debe paginar resultados', async ({ page }) => {
        // Verificar que hay controles de paginación
        await expect(page.getByLabel(/página siguiente/i)).toBeVisible();

        // Click en siguiente página
        await page.getByLabel(/página siguiente/i).click();

        // URL debe cambiar o tabla debe actualizarse
        await expect(page).toHaveURL(/page=2/);
    });
});
