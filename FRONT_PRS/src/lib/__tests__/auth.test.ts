import { login, logout } from '@/lib/auth'

// Mock del módulo api para evitar dependencias
jest.mock('@/lib/api', () => ({
    API_BASE: 'http://localhost:8000/api',
    persistTokens: jest.fn(),
    clearAuthStorage: jest.fn()
}))

import { persistTokens, clearAuthStorage } from '@/lib/api'

// Mock de fetch global
global.fetch = jest.fn()

// Mock de localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString()
        },
        removeItem: (key: string) => {
            delete store[key]
        },
        clear: () => {
            store = {}
        }
    }
})()

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

describe('Auth Module', () => {
    beforeEach(() => {
        // Limpiar mocks antes de cada test
        jest.clearAllMocks()
        localStorageMock.clear()
    })

    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            const mockResponse = {
                access: 'mock-access-token',
                refresh: 'mock-refresh-token'
            }

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse
                })

            const result = await login('testuser', 'password123')

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/token/'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'testuser', password: 'password123' })
                })
            )

            expect(result).toEqual(mockResponse)
            expect(localStorage.getItem('username')).toBe('testuser')
            expect(persistTokens).toHaveBeenCalledWith('mock-access-token', 'mock-refresh-token')
        })

        it('should trim username before login', async () => {
            const mockResponse = {
                access: 'mock-access-token',
                refresh: 'mock-refresh-token'
            }

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse
                })

            await login('  testuser  ', 'password123')

            expect(fetch).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    body: JSON.stringify({ username: 'testuser', password: 'password123' })
                })
            )

            expect(localStorage.getItem('username')).toBe('testuser')
        })

        it('should handle login without refresh token', async () => {
            const mockResponse = {
                access: 'mock-access-token'
                // No refresh token
            }

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse
                })

            const result = await login('testuser', 'password123')

            expect(result).toEqual(mockResponse)
            expect(persistTokens).toHaveBeenCalledWith('mock-access-token', undefined)
        })

        it('should throw error on 401 Unauthorized', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Invalid credentials' })
            })

            await expect(login('wrong', 'credentials'))
                .rejects
                .toThrow('Usuario o contraseña inválidos')
        })

        it('should throw error on 400 Bad Request', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({})
            })

            await expect(login('testuser', 'password'))
                .rejects
                .toThrow('Usuario o contraseña inválidos')
        })

        it('should throw error on 403 Forbidden', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: async () => ({})
            })

            await expect(login('testuser', 'password'))
                .rejects
                .toThrow('Acceso denegado')
        })

        it('should handle "no active account" error message', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'No active account found with the given credentials' })
            })

            await expect(login('testuser', 'password'))
                .rejects
                .toThrow('No existe una cuenta activa con esas credenciales')
        })

        it('should handle "credentials were not provided" error', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Credentials were not provided' })
            })

            await expect(login('', ''))
                .rejects
                .toThrow('Debes ingresar usuario y contraseña')
        })

        it('should throw error if response has no access token', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ invalid: 'response' })
            })

            await expect(login('testuser', 'password'))
                .rejects
                .toThrow('Respuesta de autenticación inválida')
        })

        it('should handle generic server errors', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => { throw new Error('Invalid JSON') }
            })

            await expect(login('testuser', 'password'))
                .rejects
                .toThrow('Error 500')
        })
    })

    describe('logout', () => {
        it('should clear all auth data from localStorage', () => {
            localStorage.setItem('username', 'testuser')

            logout()

            expect(clearAuthStorage).toHaveBeenCalled()
            expect(localStorage.getItem('username')).toBeNull()
        })

        it('should work even if localStorage is empty', () => {
            expect(() => logout()).not.toThrow()
            expect(clearAuthStorage).toHaveBeenCalled()
        })
    })
})
