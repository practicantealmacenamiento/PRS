/**
 * Pruebas E2E para el flujo de autenticación
 */

import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
    test('debe mostrar página de login', async ({ page }) => {
        await page.goto('/login');

        // Verificar que estamos en la página de login
        await expect(page).toHaveURL('/login');

        // Verificar elementos del formulario
        await expect(page.getByLabel(/usuario/i)).toBeVisible();
        await expect(page.getByLabel(/contraseña/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible();
    });

    test('debe rechazar credenciales inválidas', async ({ page }) => {
        await page.goto('/login');

        // Intentar login con credenciales incorrectas
        await page.getByLabel(/usuario/i).fill('usuario_invalido');
        await page.getByLabel(/contraseña/i).fill('password_incorrecto');
        await page.getByRole('button', { name: /ingresar/i }).click();

        // Debe mostrar mensaje de error
        await expect(page.getByText(/usuario o contraseña inválidos/i)).toBeVisible();

        // No debe redirigir
        await expect(page).toHaveURL('/login');
    });

    test('debe hacer login exitoso con credenciales válidas', async ({ page }) => {
        await page.goto('/login');

        // Ingresar credenciales (usa el superusuario que creaste)
        await page.getByLabel(/usuario/i).fill('daniel');
        await page.getByLabel(/contraseña/i).fill('tu_password_aqui'); // Cambiar por tu password real
        await page.getByRole('button', { name: /ingresar/i }).click();

        // Debe redirigir a la página principal
        await expect(page).toHaveURL('/');

        // Debe mostrar el nombre del usuario en el navbar
        await expect(page.getByText(/hola.*daniel/i)).toBeVisible();

        // Debe mostrar botón de salir
        await expect(page.getByRole('button', { name: /salir/i })).toBeVisible();
    });

    test('debe hacer logout correctamente', async ({ page }) => {
        // Primero hacer login
        await page.goto('/login');
        await page.getByLabel(/usuario/i).fill('daniel');
        await page.getByLabel(/contraseña/i).fill('tu_password_aqui');
        await page.getByRole('button', { name: /ingresar/i }).click();
        await expect(page).toHaveURL('/');

        // Hacer logout
        await page.getByRole('button', { name: /salir/i }).click();

        // Debe redirigir a login
        await expect(page).toHaveURL('/login');

        // No debe mostrar el nombre del usuario
        await expect(page.getByText(/hola.*daniel/i)).not.toBeVisible();
    });

    test('debe redirigir a login si no está autenticado', async ({ page }) => {
        // Intentar acceder a una ruta protegida sin estar logueado
        await page.goto('/prestamos');

        // Debe redirigir a login
        await expect(page).toHaveURL('/login');
    });

    test('debe persistir sesión después de recargar página', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByLabel(/usuario/i).fill('daniel');
        await page.getByLabel(/contraseña/i).fill('tu_password_aqui');
        await page.getByRole('button', { name: /ingresar/i }).click();
        await expect(page).toHaveURL('/');

        // Recargar la página
        await page.reload();

        // La sesión debe persistir
        await expect(page.getByText(/hola.*daniel/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /salir/i })).toBeVisible();
    });
});
