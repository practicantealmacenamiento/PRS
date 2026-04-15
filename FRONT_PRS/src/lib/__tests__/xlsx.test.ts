/**
 * Tests para xlsx.ts
 * Cubre: Helper functions (normalizeRows, textLen, etc)
 */

import { normalizeRows } from '@/lib/xlsx'

describe('XLSX Module', () => {
    describe('normalizeRows', () => {
        it('should return array as-is if already an array', () => {
            const input = [{ id: 1 }, { id: 2 }]
            const result = normalizeRows(input)

            expect(result).toBe(input)
            expect(result).toHaveLength(2)
        })

        it('should extract results property from object', () => {
            const input = {
                results: [{ id: 1 }, { id: 2 }],
                count: 2
            }

            const result = normalizeRows(input)

            expect(result).toEqual([{ id: 1 }, { id: 2 }])
        })

        it('should extract items property from object', () => {
            const input = {
                items: [{ name: 'A' }, { name: 'B' }]
            }

            const result = normalizeRows(input)

            expect(result).toEqual([{ name: 'A' }, { name: 'B' }])
        })

        it('should extract data property from object', () => {
            const input = {
                data: [{ value: 1 }, { value: 2 }]
            }

            const result = normalizeRows(input)

            expect(result).toEqual([{ value: 1 }, { value: 2 }])
        })

        it('should extract rows property from object', () => {
            const input = {
                rows: [{ col1: 'A' }, { col1: 'B' }]
            }

            const result = normalizeRows(input)

            expect(result).toEqual([{ col1: 'A' }, { col1: 'B' }])
        })

        it('should extract object values if all values are objects', () => {
            const input = {
                item1: { id: 1, name: 'A' },
                item2: { id: 2, name: 'B' }
            }

            const result = normalizeRows(input)

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({ id: 1, name: 'A' })
            expect(result[1]).toEqual({ id: 2, name: 'B' })
        })

        it('should return empty array for null', () => {
            const result = normalizeRows(null)
            expect(result).toEqual([])
        })

        it('should return empty array for undefined', () => {
            const result = normalizeRows(undefined)
            expect(result).toEqual([])
        })

        it('should return empty array for primitive value', () => {
            const result = normalizeRows(42)
            expect(result).toEqual([])
        })

        it('should return empty array for empty object', () => {
            const result = normalizeRows({})
            expect(result).toEqual([])
        })

        it('should prioritize results over other keys', () => {
            const input = {
                results: [{ id: 1 }],
                items: [{ id: 2 }],
                data: [{ id: 3 }]
            }

            const result = normalizeRows(input)

            // Should return results, not items or data
            expect(result).toEqual([{ id: 1 }])
        })

        it('should prioritize items over data', () => {
            const input = {
                items: [{ id: 1 }],
                data: [{ id: 2 }]
            }

            const result = normalizeRows(input)

            expect(result).toEqual([{ id: 1 }])
        })

        it('should handle complex nested arrays', () => {
            const input = {
                results: [
                    { id: 1, items: [1, 2, 3] },
                    { id: 2, items: [4, 5, 6] }
                ]
            }

            const result = normalizeRows(input)

            expect(result).toHaveLength(2)
            expect(result[0].items).toEqual([1, 2, 3])
        })

        it('should not extract if values are not all objects', () => {
            const input = {
                item1: { id: 1 },
                item2: 'not an object'
            }

            const result = normalizeRows(input)

            expect(result).toEqual([])
        })
    })
})
