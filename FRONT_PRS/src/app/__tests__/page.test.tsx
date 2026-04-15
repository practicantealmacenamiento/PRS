/**
 * Test de ejemplo para la página principal
 * Este archivo demuestra cómo escribir tests para componentes de React
 */

import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
    it('renders without crashing', () => {
        render(<Home />)
        // Verifica que la página se renderice
        expect(document.body).toBeInTheDocument()
    })

    it('has main content', () => {
        render(<Home />)
        const main = screen.getByRole('main')
        expect(main).toBeInTheDocument()
    })
})
