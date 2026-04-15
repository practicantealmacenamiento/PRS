/**
 * Pruebas E2E para gestión de préstamos
 * NOTA: Estos tests requieren que haya empleados y radios en la base de datos
 */

import { test, expect } from '@playwright/test';

test.describe('Préstamos', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByLabel(/usuario/i).fill('daniel');
        await page.getByLabel(/contraseña/i).fill('tu_password_aqui');
        await page.getByRole('button', { name: /ingresar/i }).click();
        await expect(page).toHaveURL('/');

        // Navegar a préstamos
        await page.goto('/prestamos');
    });

    test('debe mostrar página de préstamos', async ({ page }) => {
        await expect(page).toHaveURL('/prestamos');
        await expect(page.getByText(/préstamos y devoluciones/i)).toBeVisible();
    });

    test('debe mostrar formulario de nuevo préstamo', async ({ page }) => {
        // Verificar que hay campos de formulario
        // Los selectores exactos dependen de tu implementación
        await expect(page.locator('form')).toBeVisible();
    });

    test.skip('debe crear un nuevo préstamo', async ({ page }) => {
        // Este test requiere datos en la BD
        // Seleccionar empleado
        await page.selectOption('select[name="empleado"]', { index: 1 });

        // Seleccionar radio
        await page.selectOption('select[name="radio"]', { index: 1 });

        // Enviar formulario
        await page.getByRole('button', { name: /registrar préstamo/i }).click();

        // Verificar éxito
        await expect(page.getByText(/préstamo registrado/i)).toBeVisible();
    });

    test.skip('debe validar campos requeridos', async ({ page }) => {
        // Intentar enviar formulario vacío
        await page.getByRole('button', { name: /registrar préstamo/i }).click();

        // Debe mostrar errores de validación
        await expect(page.getByText(/campo requerido/i).first()).toBeVisible();
    });

    test.skip('debe mostrar lista de préstamos activos', async ({ page }) => {
        // Verificar que hay una tabla o lista de préstamos
        await expect(page.getByRole('table')).toBeVisible();
    });

    test.skip('debe permitir devolver un radio', async ({ page }) => {
        // Click en botón de devolver del primer préstamo
        await page.getByRole('button', { name: /devolver/i }).first().click();

        // Confirmar devolución
        await page.getByRole('button', { name: /confirmar/i }).click();

        // Verificar éxito
        await expect(page.getByText(/devolución registrada/i)).toBeVisible();
    });
});
