import { calcularTurno, formatoFecha, formatoHora } from '@/lib/turnos'

describe('Turnos Utilities', () => {
    describe('calcularTurno', () => {
        it('returns Turno 1 for morning hours (6am-2pm)', () => {
            const morningDate = new Date('2024-01-01T10:00:00')
            expect(calcularTurno(morningDate)).toBe('Turno 1 (6 am - 2 pm)')
        })

        it('returns Turno 1 at exactly 6am', () => {
            const date = new Date('2024-01-01T06:00:00')
            expect(calcularTurno(date)).toBe('Turno 1 (6 am - 2 pm)')
        })

        it('returns Turno 2 for afternoon hours (2pm-10pm)', () => {
            const afternoonDate = new Date('2024-01-01T16:00:00')
            expect(calcularTurno(afternoonDate)).toBe('Turno 2 (2 pm - 10 pm)')
        })

        it('returns Turno 2 at exactly 2pm', () => {
            const date = new Date('2024-01-01T14:00:00')
            expect(calcularTurno(date)).toBe('Turno 2 (2 pm - 10 pm)')
        })

        it('returns Turno 3 for night hours (10pm-6am)', () => {
            const nightDate = new Date('2024-01-01T23:00:00')
            expect(calcularTurno(nightDate)).toBe('Turno 3 (10 pm - 6 am)')
        })

        it('returns Turno 3 for early morning hours', () => {
            const earlyDate = new Date('2024-01-01T03:00:00')
            expect(calcularTurno(earlyDate)).toBe('Turno 3 (10 pm - 6 am)')
        })
    })

    describe('formatoFecha', () => {
        it('formats date in es-CO locale', () => {
            const date = new Date('2024-01-15T10:00:00')
            const formatted = formatoFecha(date)

            // Should contain day, month and year
            expect(formatted).toContain('15')
            expect(formatted).toContain('1')
            expect(formatted).toContain('2024')
        })

        it('handles different dates', () => {
            const date = new Date('2024-12-31T10:00:00')
            const formatted = formatoFecha(date)

            expect(formatted).toContain('31')
            expect(formatted).toContain('12')
            expect(formatted).toContain('2024')
        })
    })

    describe('formatoHora', () => {
        it('formats time in es-CO locale with hours and minutes', () => {
            const date = new Date('2024-01-01T14:30:00')
            const formatted = formatoHora(date)

            // Should contain hour and minute
            expect(formatted).toContain('14')
            expect(formatted).toContain('30')
        })

        it('formats midnight correctly', () => {
            const date = new Date('2024-01-01T00:15:00')
            const formatted = formatoHora(date)

            // Should contain minutes, hour format may vary by locale
            expect(formatted).toContain('15')
            expect(formatted).toMatch(/\d{1,2}:\d{2}/)
        })
    })
})
