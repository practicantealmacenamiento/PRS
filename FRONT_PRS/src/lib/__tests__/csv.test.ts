/**
 * Tests completos para el módulo CSV
 * Cubre: rowsToCSV con diferentes opciones, escaping, y downloadCSV
 */

import { rowsToCSV, downloadCSV } from '@/lib/csv'

describe('CSV Module', () => {
    describe('rowsToCSV', () => {
        it('should convert simple rows to CSV with default options', () => {
            const rows = [
                { id: 1, name: 'Juan', age: 30 },
                { id: 2, name: 'María', age: 25 }
            ]

            const result = rowsToCSV(rows)

            expect(result).toContain('sep=,')
            expect(result).toContain('id,name,age')
            expect(result).toContain('1,Juan,30')
            expect(result).toContain('2,María,25')
        })

        it('should use custom headers', () => {
            const rows = [{ id: 1, name: 'Juan' }]
            const headers = { id: 'ID', name: 'Nombre' }

            const result = rowsToCSV(rows, headers)

            expect(result).toContain('ID,Nombre')
            expect(result).toContain('1,Juan')
        })

        it('should handle empty rows', () => {
            const result = rowsToCSV([])
            expect(result).toBe('')
        })

        it('should escape values with commas', () => {
            const rows = [{ name: 'Pérez, Juan' }]
            const result = rowsToCSV(rows)

            expect(result).toContain('"Pérez, Juan"')
        })

        it('should escape values with quotes', () => {
            const rows = [{ comment: 'He said "hello"' }]
            const result = rowsToCSV(rows)

            expect(result).toContain('He said ""hello""')
        })

        it('should escape values with newlines', () => {
            const rows = [{ text: 'Line 1\nLine 2' }]
            const result = rowsToCSV(rows)

            expect(result).toContain('"Line 1\nLine 2"')
        })

        it('should handle null and undefined values', () => {
            const rows = [{ a: null, b: undefined, c: 'value' }]
            const result = rowsToCSV(rows)

            const lines = result.split('\r\n').filter(l => l && !l.startsWith('sep='))
            expect(lines[1]).toContain(',,value')
        })

        it('should handle Date objects', () => {
            const date = new Date('2024-01-15T10:00:00Z')
            const rows = [{ date }]
            const result = rowsToCSV(rows)

            expect(result).toContain('2024-01-15T10:00:00.000Z')
        })

        it('should use custom delimiter (semicolon)', () => {
            const rows = [{ a: 1, b: 2 }]
            const result = rowsToCSV(rows, undefined, { delimiter: ';' })

            expect(result).toContain('sep=;')
            expect(result).toContain('a;b')
            expect(result).toContain('1;2')
        })

        it('should use custom delimiter (tab)', () => {
            const rows = [{ a: 1, b: 2 }]
            const result = rowsToCSV(rows, undefined, { delimiter: '\t' })

            expect(result).toContain('a\tb')
            expect(result).toContain('1\t2')
        })

        it('should use custom line ending (LF)', () => {
            const rows = [{ a: 1 }, { a: 2 }]
            const result = rowsToCSV(rows, undefined, { lineEnding: '\n' })

            expect(result.split('\r\n').length).toBe(1)
            expect(result.split('\n').length).toBeGreaterThan(1)
        })

        it('should omit BOM when includeBOM is false', () => {
            const rows = [{ a: 1 }]
            const result = rowsToCSV(rows, undefined, { includeBOM: false })

            expect(result.charCodeAt(0)).not.toBe(0xFEFF)
        })

        it('should include BOM by default', () => {
            const rows = [{ a: 1 }]
            const result = rowsToCSV(rows)

            expect(result.charCodeAt(0)).toBe(0xFEFF)
        })

        it('should omit Excel sep directive when excelSepDirective is false', () => {
            const rows = [{ a: 1 }]
            const result = rowsToCSV(rows, undefined, { excelSepDirective: false })

            expect(result).not.toContain('sep=')
        })

        it('should handle complex real-world data', () => {
            const rows = [
                {
                    cedula: '123456789',
                    nombre: 'Pérez, Juan "El Rápido"',
                    fecha: new Date('2024-01-01'),
                    observaciones: 'Line 1\nLine 2',
                    activo: true
                }
            ]

            const headers = {
                cedula: 'Cédula',
                nombre: 'Nombre Completo',
                fecha: 'Fecha',
                observaciones: 'Observaciones',
                activo: 'Activo'
            }

            const result = rowsToCSV(rows, headers)

            expect(result).toContain('Cédula,Nombre Completo,Fecha,Observaciones,Activo')
            expect(result).toContain('123456789')
            expect(result).toContain('"Pérez, Juan ""El Rápido"""')
            expect(result).toContain('"Line 1\nLine 2"')
        })
    })

    describe('downloadCSV', () => {
        it('should create and trigger download with default filename', () => {
            // Mock createElement and URL methods
            const mockClick = jest.fn()
            const mockAnchor = {
                href: '',
                download: '',
                click: mockClick,
                style: {}
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
            jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
            jest.spyOn(URL, 'revokeObjectURL').mockImplementation()

            downloadCSV('test,data', 'test.csv')

            expect(mockClick).toHaveBeenCalled()
            expect(mockAnchor.download).toBe('test.csv')
        })
    })
})
