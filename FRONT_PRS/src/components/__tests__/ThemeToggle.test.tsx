/**
 * Tests para ThemeToggle component
 * Cubre: renderizado, toggle functionality, localStorage
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})

describe('ThemeToggle Component', () => {
    beforeEach(() => {
        localStorage.clear()
        document.documentElement.classList.remove('dark')
    })

    it('renders toggle button', () => {
        render(<ThemeToggle />)
        const button = screen.getByTitle('Cambiar tema')
        expect(button).toBeInTheDocument()
    })

    it('starts disabled initially (hydration)', () => {
        render(<ThemeToggle />)
        const button = screen.getByTitle('Cambiar tema')
        expect(button).toBeDisabled()
    })

    it('becomes enabled after mount', async () => {
        render(<ThemeToggle />)

        await waitFor(() => {
            const button = screen.getByTitle('Cambiar tema')
            expect(button).not.toBeDisabled()
        })
    })

    it('shows sun icon in light mode', async () => {
        render(<ThemeToggle />)

        await waitFor(() => {
            const button = screen.getByTitle('Cambiar tema')
            expect(button.textContent).toBe('☀︎')
        })
    })

    it('toggles to dark mode when clicked', async () => {
        render(<ThemeToggle />)

        await waitFor(() => {
            const button = screen.getByTitle('Cambiar tema')
            expect(button).not.toBeDisabled()
        })

        const button = screen.getByTitle('Cambiar tema')
        fireEvent.click(button)

        await waitFor(() => {
            expect(button.textContent).toBe('☾')
            expect(document.documentElement.classList.contains('dark')).toBe(true)
            expect(localStorage.getItem('theme')).toBe('dark')
        })
    })

    it('toggles back to light mode', async () => {
        render(<ThemeToggle />)

        await waitFor(() => {
            const button = screen.getByTitle('Cambiar tema')
            expect(button).not.toBeDisabled()
        })

        const button = screen.getByTitle('Cambiar tema')

        // Toggle to dark
        fireEvent.click(button)
        await waitFor(() => expect(button.textContent).toBe('☾'))

        // Toggle back to light
        fireEvent.click(button)
        await waitFor(() => {
            expect(button.textContent).toBe('☀︎')
            expect(document.documentElement.classList.contains('dark')).toBe(false)
            expect(localStorage.getItem('theme')).toBe('light')
        })
    })

    it('loads dark mode from localStorage', async () => {
        localStorage.setItem('theme', 'dark')

        render(<ThemeToggle />)

        await waitFor(() => {
            const button = screen.getByTitle('Cambiar tema')
            expect(button.textContent).toBe('☾')
            expect(document.documentElement.classList.contains('dark')).toBe(true)
        })
    })

    it('uses system preference when no saved theme', async () => {
        window.matchMedia = jest.fn().mockImplementation(query => ({
            matches: query === '(prefers-color-scheme: dark)',
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }))

        render(<ThemeToggle />)

        await waitFor(() => {
            const button = screen.getByTitle('Cambiar tema')
            expect(button.textContent).toBe('☾')
        })
    })
})
