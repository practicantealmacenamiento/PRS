/* eslint-disable @typescript-eslint/no-explicit-any */

// -----------------------------
// Tipos y utilidades
// -----------------------------
export type XLSXOptions = {
  filename?: string;
  sheetName?: string;
  /** Claves que deben tratarse como fecha (se intentará convertir a Date) */
  dateKeys?: string[];
  /** Color ARGB del header, ej: 'FFE8F1FF' (AARRGGBB). */
  headerFillARGB?: string;
  /** Aplicar zebra striping (rayado alterno) a filas de datos */
  zebra?: boolean;
};

function asDate(val: any): Date | any {
  if (val == null) return val;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d;
}

function textLen(v: unknown): number {
  const s = v == null ? "" : String(v);
  return Math.min(50, Math.max(2, s.length));
}

/** Normaliza la entrada a un arreglo de objetos */
export function normalizeRows<T = any>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    for (const key of ["results", "items", "data", "rows"]) {
      const val = obj[key];
      if (Array.isArray(val)) return val as T[];
    }
    // Último recurso: si es un objeto tipo índice con valores-objeto
    const values = Object.values(obj);
    if (values.length && values.every((v) => typeof v === "object")) return values as T[];
  }
  return [];
}

// Carga exceljs solo en el navegador; intenta el paquete normal y, si falla, el build de browser
async function loadExcelJS(): Promise<typeof import("exceljs")> {
  try {
    return await import("exceljs");
  } catch {
    return await import("exceljs/dist/exceljs.min.js");
  }
}

// -----------------------------
// Exportador principal
// -----------------------------
/**
 * Exporta un XLSX con estilos básicos:
 * - Encabezado con fondo y negrita
 * - Zebra striping opcional
 * - Auto–ancho de columnas
 * - Filtro automático
 * - Fila de encabezado fija
 * - Formato de fecha "dd/mm/yyyy hh:mm" para keys indicadas
 *
 * Importante: Llamar desde un componente cliente ("use client").
 */
export async function exportXLSX<T extends Record<string, any>>(
  rowsInput: T[] | Record<string, unknown>,
  headers?: Record<string, string>,
  opts: XLSXOptions = {}
) {
  // Asegura ejecución en navegador
  if (typeof window === "undefined") {
    throw new Error("exportXLSX debe ejecutarse en el navegador (componente cliente).");
  }

  const rows = normalizeRows<T>(rowsInput);
  if (!rows.length) throw new Error("exportXLSX: no hay filas para exportar.");

  const ExcelJS = await loadExcelJS();
  const WorkbookCtor =
    (ExcelJS as unknown as { Workbook?: new () => any }).Workbook ||
    (ExcelJS as unknown as { default?: { Workbook?: new () => any } }).default?.Workbook;
  if (!WorkbookCtor) throw new Error("No se pudo cargar ExcelJS (Workbook no disponible).");

  const {
    filename = "export.xlsx",
    sheetName = "Histórico",
    dateKeys = ["fecha_hora_prestamo", "fecha_hora_devolucion"],
    headerFillARGB = "FFE8F1FF",
    zebra = true,
  } = opts;

  const cols = headers ? Object.keys(headers) : Object.keys(rows[0] ?? {});
  if (!cols.length) throw new Error("exportXLSX: no se detectaron columnas.");

  const wb = new WorkbookCtor();
  const ws = wb.addWorksheet(sheetName, { properties: { defaultRowHeight: 18 } });

  // Definir columnas
  ws.columns = cols.map((key) => ({
    key,
    header: headers ? headers[key] ?? key : key,
    width: 12, // se recalcula más abajo
  }));

  // Header estilizado
  const headerRow = ws.addRow(ws.columns.map((c: any) => c.header));
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.eachCell((cell: any) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerFillARGB } };
    cell.border = { bottom: { style: "thin", color: { argb: "FFCFD8DC" } } };
  });

  // Filas de datos
  rows.forEach((r, idx) => {
    const data: Record<string, any> = {};
    for (const k of cols) {
      const raw = (r as any)[k];
      data[k] = dateKeys.includes(k) ? asDate(raw) : (raw ?? "");
    }
    const row = ws.addRow(data);
    row.alignment = { vertical: "middle" };

    // Zebra striping
    if (zebra && idx % 2 === 1) {
      row.eachCell((cell: any) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFF" } };
      });
    }

    // Formato para fechas
    cols.forEach((k, i) => {
      if (dateKeys.includes(k)) {
        const cell = row.getCell(i + 1);
        if (cell.value instanceof Date) cell.numFmt = "dd/mm/yyyy hh:mm";
      }
    });
  });

  // Auto–ancho de columnas
  ws.columns?.forEach((col: any, i: number) => {
    const headerLen = textLen(col.header);
    const valuesLen = ws
      .getColumn(i + 1)
      .values.slice(2) // ignora undefined y header
      .reduce((max: number, v: any) => Math.max(max, textLen(v?.text ?? v)), 0);
    col.width = Math.min(50, Math.max(headerLen + 2, valuesLen + 2));
  });

  // Filtros y freeze
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };

  // Bordes verticales suaves (opcional)
  ws.eachRow((row: any, rowNumber: number) => {
    if (rowNumber === 1) return;
    row.eachCell((cell: any) => {
      cell.border = { ...cell.border, right: { style: "hair", color: { argb: "FFE0E0E0" } } };
    });
  });

  // Descargar
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
