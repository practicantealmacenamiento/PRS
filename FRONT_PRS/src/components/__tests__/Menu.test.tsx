/**
 * Tests para Menu component
 * Cubre: renderizado, links, active states
 */

import { render, screen } from '@testing-library/react'
import Menu from '@/components/Menu'

// Mock usePathname
jest.mock('next/navigation', () => ({
    usePathname: jest.fn()
}))

import { usePathname } from 'next/navigation'

describe('Menu Component', () => {
    beforeEach(() => {
        ; (usePathname as jest.Mock).mockReturnValue('/')
    })

    it('renders menu title', () => {
        render(<Menu />)
        expect(screen.getByText('Menú')).toBeInTheDocument()
    })

    it('renders all menu items', () => {
        render(<Menu />)

        expect(screen.getByText('Inicio')).toBeInTheDocument()
        expect(screen.getByText('Prestamos y Devoluciones')).toBeInTheDocument()
        expect(screen.getByText('Consultar Histórico')).toBeInTheDocument()
    })

    it('highlights active menu item', () => {
        ; (usePathname as jest.Mock).mockReturnValue('/prestamos')
        render(<Menu />)

        const prestamosLink = screen.getByText('Prestamos y Devoluciones')
        expect(prestamosLink.className).toContain('bg-skyBlue')
        expect(prestamosLink.style.color).toBe('white')
    })

    it('applies hover style to inactive items', () => {
        ; (usePathname as jest.Mock).mockReturnValue('/')
        render(<Menu />)

        const historicLink = screen.getByText('Consultar Histórico')
        expect(historicLink.className).toContain('hover:bg-cloud')
    })

    it('contains correct links', () => {
        render(<Menu />)

        const inicioLink = screen.getByText('Inicio').closest('a')
        const prestamosLink = screen.getByText('Prestamos y Devoluciones').closest('a')
        const historicoLink = screen.getByText('Consultar Histórico').closest('a')

        expect(inicioLink).toHaveAttribute('href', '/')
        expect(prestamosLink).toHaveAttribute('href', '/prestamos')
        expect(historicoLink).toHaveAttribute('href', '/historico')
    })
})
