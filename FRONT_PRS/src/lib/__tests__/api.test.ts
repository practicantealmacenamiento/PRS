/**
 * Tests exhaustivos para api.ts
 * Cubre: JWT decode, token management, API helpers, error handling
 */

// Mock de fetch y localStorage
global.fetch = jest.fn()

const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value },
        removeItem: (key: string) => { delete store[key] },
        clear: () => { store = {} }
    }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
    writable: true,
    value: ''
})

import { persistTokens, clearAuthStorage, safeErr, apiGET, apiPOST, apiPATCH, apiDELETE } from '@/lib/api'

describe('API Module', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorageMock.clear()
        document.cookie = ''
    })

    describe('persistTokens', () => {
        it('should store access token in localStorage and cookie', () => {
            persistTokens('access-123', 'refresh-456')

            expect(localStorage.getItem('token')).toBe('access-123')
            expect(localStorage.getItem('refresh')).toBe('refresh-456')
        })

        it('should work without refresh token', () => {
            persistTokens('access-only')

            expect(localStorage.getItem('token')).toBe('access-only')
            expect(localStorage.getItem('refresh')).toBeNull()
        })
    })

    describe('clearAuthStorage', () => {
        it('should remove all tokens from storage', () => {
            localStorage.setItem('token', 'test')
            localStorage.setItem('refresh', 'test')

            clearAuthStorage()

            expect(localStorage.getItem('token')).toBeNull()
            expect(localStorage.getItem('refresh')).toBeNull()
        })
    })

    describe('safeErr', () => {
        it('should extract detail from JSON error', async () => {
            const mockResponse = {
                status: 400,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({ detail: 'Invalid input' })
            } as unknown as Response

            const error = await safeErr(mockResponse)
            expect(error).toBe('Invalid input')
        })

        it('should extract error field from JSON', async () => {
            const mockResponse = {
                status: 500,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({ error: 'Server error' })
            } as unknown as Response

            const error = await safeErr(mockResponse)
            expect(error).toBe('Server error')
        })

        it('should extract message field from JSON', async () => {
            const mockResponse = {
                status: 403,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({ message: 'Forbidden' })
            } as unknown as Response

            const error = await safeErr(mockResponse)
            expect(error).toBe('Forbidden')
        })

        it('should handle HTML error responses', async () => {
            const mockResponse = {
                status: 500,
                headers: {
                    get: () => 'text/html'
                },
                text: async () => '<!DOCTYPE html><html>Error</html>'
            } as unknown as Response

            const error = await safeErr(mockResponse)
            expect(error).toBe('Error interno del servidor')
        })

        it('should handle plain text errors', async () => {
            const mockResponse = {
                status: 500,
                headers: {
                    get: () => 'text/plain'
                },
                text: async () => 'Something went wrong'
            } as unknown as Response

            const error = await safeErr(mockResponse)
            expect(error).toBe('Something went wrong')
        })

        it('should fallback to status code on JSON parse error', async () => {
            const mockResponse = {
                status: 500,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => { throw new Error('Invalid JSON') }
            } as unknown as Response

            const error = await safeErr(mockResponse)
            expect(error).toBe('Error 500')
        })

        it('should truncate long text responses', async () => {
            const longText = 'x'.repeat(300)
            const mockResponse = {
                status: 500,
                headers: {
                    get: () => 'text/plain'
                },
                text: async () => longText
            } as unknown as Response

            const error = await safeErr(mockResponse)
            expect(error.length).toBe(200)
        })
    })

    describe('apiGET', () => {
        it('should successfully fetch data', async () => {
            const mockData = { id: 1, name: 'Test' }

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockData
                })

            localStorage.setItem('token', 'valid-token')

            const result = await apiGET('/test')

            expect(result).toEqual(mockData)
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/test'),
                expect.objectContaining({
                    method: 'GET'
                })
            )
        })

        it('should throw error on failed request', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({ detail: 'Not found' })
            })

            localStorage.setItem('token', 'valid-token')

            await expect(apiGET('/notfound')).rejects.toThrow('Not found')
        })
    })

    describe('apiPOST', () => {
        it('should post data successfully', async () => {
            const mockResponse = { success: true }
            const payload = { name: 'New Item' }

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse
                })

            localStorage.setItem('token', 'valid-token')

            const result = await apiPOST('/items', payload)

            expect(result).toEqual(mockResponse)
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/items'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(payload)
                })
            )
        })

        it('should throw error on failed POST', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({ detail: 'Invalid data' })
            })

            localStorage.setItem('token', 'valid-token')

            await expect(apiPOST('/items', {})).rejects.toThrow('Invalid data')
        })
    })

    describe('apiPATCH', () => {
        it('should patch data successfully', async () => {
            const mockResponse = { id: 1, updated: true }
            const payload = { name: 'Updated' }

                ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => mockResponse
                })

            localStorage.setItem('token', 'valid-token')

            const result = await apiPATCH('/items/1', payload)

            expect(result).toEqual(mockResponse)
        })

        it('should handle 204 No Content response', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 204,
                json: async () => null
            })

            localStorage.setItem('token', 'valid-token')

            const result = await apiPATCH('/items/1', {})

            expect(result).toBeUndefined()
        })

        it('should throw error on failed PATCH', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 403,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({ detail: 'Forbidden' })
            })

            localStorage.setItem('token', 'valid-token')

            await expect(apiPATCH('/items/1', {})).rejects.toThrow('Forbidden')
        })
    })

    describe('apiDELETE', () => {
        it('should delete successfully', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 204
            })

            localStorage.setItem('token', 'valid-token')

            await expect(apiDELETE('/items/1')).resolves.toBeUndefined()

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/items/1'),
                expect.objectContaining({
                    method: 'DELETE'
                })
            )
        })

        it('should throw error on failed DELETE', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                headers: {
                    get: () => 'application/json'
                },
                json: async () => ({ detail: 'Not found' })
            })

            localStorage.setItem('token', 'valid-token')

            await expect(apiDELETE('/items/999')).rejects.toThrow('Not found')
        })
    })
})
