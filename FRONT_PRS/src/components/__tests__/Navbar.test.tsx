/**
 * Tests para Navbar component
 * Cubre: renderizado, auth state, logout, navigation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Navbar from '@/components/Navbar'

// Mock de next/navigation
jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
    useRouter: jest.fn()
}))

// Mock de componentes
jest.mock('@/components/logo', () => {
    return function Logo() {
        return <div data-testid="logo">Logo</div>
    }
})

jest.mock('@/components/ThemeToggle', () => {
    return function ThemeToggle() {
        return <button data-testid="theme-toggle">Toggle</button>
    }
})

// Mock auth
jest.mock('@/lib/auth', () => ({
    logout: jest.fn()
}))

import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'

describe('Navbar Component', () => {
    const mockPush = jest.fn()
    const mockReplace = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()

            ; (usePathname as jest.Mock).mockReturnValue('/')
            ; (useRouter as jest.Mock).mockReturnValue({
                push: mockPush,
                replace: mockReplace
            })
    })

    it('renders navbar with logo', () => {
        render(<Navbar />)
        expect(screen.getByTestId('logo')).toBeInTheDocument()
    })

    it('renders theme toggle', () => {
        render(<Navbar />)
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })

    it('renders navigation links', () => {
        render(<Navbar />)

        expect(screen.getByText('Préstamos')).toBeInTheDocument()
        expect(screen.getByText('Histórico')).toBeInTheDocument()
        expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('shows "Ingresar" button when not logged in', () => {
        render(<Navbar />)

        expect(screen.getByText('Ingresar')).toBeInTheDocument()
        expect(screen.queryByText('Salir')).not.toBeInTheDocument()
    })

    it('shows username and "Salir" when logged in', async () => {
        localStorage.setItem('username', 'testuser')

        render(<Navbar />)

        await waitFor(() => {
            expect(screen.getByText('testuser')).toBeInTheDocument()
            expect(screen.getByText('Salir')).toBeInTheDocument()
        })
    })

    it('highlights active navigation link', () => {
        ; (usePathname as jest.Mock).mockReturnValue('/prestamos')

        render(<Navbar />)

        const prestamosLink = screen.getByText('Préstamos')
        expect(prestamosLink.className).toContain('bg-sky-blue')
        expect(prestamosLink.className).toContain('text-white')
    })

    it('does not highlight inactive links', () => {
        ; (usePathname as jest.Mock).mockReturnValue('/prestamos')

        render(<Navbar />)

        const historicoLink = screen.getByText('Histórico')
        expect(historicoLink.className).not.toContain('bg-sky-blue')
        expect(historicoLink.className).toContain('hover:bg-cloud')
    })

    it('handles logout correctly', async () => {
        localStorage.setItem('username', 'testuser')

        render(<Navbar />)

        await waitFor(() => {
            expect(screen.getByText('Salir')).toBeInTheDocument()
        })

        const logoutButton = screen.getByText('Salir')
        fireEvent.click(logoutButton)

        expect(logout).toHaveBeenCalled()
        expect(mockReplace).toHaveBeenCalledWith('/login')
    })

    it('updates user state when pathname changes', async () => {
        const { rerender } = render(<Navbar />)

        // Initially no user
        expect(screen.queryByText('Hola,')).not.toBeInTheDocument()

        // Add username to localStorage
        localStorage.setItem('username', 'newuser')

            // Change pathname to trigger useEffect
            ; (usePathname as jest.Mock).mockReturnValue('/admin')
        rerender(<Navbar />)

        await waitFor(() => {
            expect(screen.getByText('newuser')).toBeInTheDocument()
        })
    })

    it('renders logo link to home', () => {
        render(<Navbar />)

        const logoLink = screen.getByLabelText('Ir al inicio')
        expect(logoLink).toHaveAttribute('href', '/')
    })

    it('renders Ingresar link when not authenticated', () => {
        render(<Navbar />)

        const ingresarLink = screen.getByText('Ingresar').closest('a')
        expect(ingresarLink).toHaveAttribute('href', '/login')
    })

    it('displays greeting with username', async () => {
        localStorage.setItem('username', 'Juan')

        render(<Navbar />)

        await waitFor(() => {
            expect(screen.getByText('Hola,')).toBeInTheDocument()
            expect(screen.getByText('Juan')).toBeInTheDocument()
        })
    })
})
