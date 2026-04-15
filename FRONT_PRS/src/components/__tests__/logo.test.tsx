import { render, screen } from '@testing-library/react'
import Logo from '@/components/logo'

describe('Logo Component', () => {
    it('renders both light and dark theme logos', () => {
        render(<Logo />)

        // Verifica que hay 2 imágenes (tema claro y oscuro)
        const images = screen.getAllByAltText('Prebel')
        expect(images).toHaveLength(2)
    })

    it('renders with correct image sources', () => {
        render(<Logo />)

        const images = screen.getAllByAltText('Prebel') as HTMLImageElement[]

        // Verifica que las rutas son correctas
        expect(images[0].src).toContain('Prebel_AzulClaro_SF.webp')
        expect(images[1].src).toContain('Prebel_Blanco.webp')
    })

    it('has correct dimensions', () => {
        render(<Logo />)

        const images = screen.getAllByAltText('Prebel') as HTMLImageElement[]

        // Verifica dimensiones
        images.forEach(img => {
            expect(img.width).toBe(112)
            expect(img.height).toBe(28)
        })
    })
})
