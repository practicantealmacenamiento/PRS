/* eslint-disable @typescript-eslint/no-explicit-any */
export type CSVOptions = {
  /** Separador de columnas. Por defecto coma. */
  delimiter?: string;                  // "," | ";" | "\t"
  /** Fin de línea. Excel prefiere CRLF. */
  lineEnding?: "\r\n" | "\n";
  /** Insertar BOM UTF-8 al inicio (mejor tildes/ñ en Excel). */
  includeBOM?: boolean;
  /** Inyectar directiva de Excel: sep=<delimiter> */
  excelSepDirective?: boolean;
};

function normalize(value: any): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeCSV(value: any, delimiter: string): string {
  // Normalizamos saltos y escapamos comillas
  const s = normalize(value).replace(/\r?\n/g, "\n").replace(/"/g, '""');
  // Citar si contiene comillas, delimitador o saltos de línea
  return (s.includes('"') || s.includes(delimiter) || s.includes("\n") || s.includes("\r"))
    ? `"${s}"`
    : s;
}

export function rowsToCSV<T extends Record<string, any>>(
  rows: T[],
  headers?: Record<string, string>,
  opts: CSVOptions = {}
): string {
  if (!rows || rows.length === 0) return "";

  const delimiter = opts.delimiter ?? ",";
  const EOL = opts.lineEnding ?? "\r\n";
  const includeBOM = opts.includeBOM ?? true;
  const excelSep = opts.excelSepDirective ?? true;

  const cols = headers ? Object.keys(headers) : Object.keys(rows[0]);

  const head = cols
    .map((c) => escapeCSV(headers ? headers[c] : c, delimiter))
    .join(delimiter);

  const body = rows
    .map((r) => cols.map((c) => escapeCSV(r[c], delimiter)).join(delimiter))
    .join(EOL);

  const prefix =
    (includeBOM ? "\uFEFF" : "") + // BOM UTF-8
    (excelSep ? `sep=${delimiter}${EOL}` : ""); // Directiva para Excel

  // Último EOL ayuda a que Excel no “pegue” la última línea
  return prefix + head + EOL + body + EOL;
}

export function downloadCSV(content: string, filename = "export.csv") {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

