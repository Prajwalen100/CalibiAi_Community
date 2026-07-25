export type CsvColumn<T> = {
  key: string;
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
};

/**
 * Escapes a single CSV cell.
 *
 * Values that start with =, +, - or @ are prefixed with a single quote so that
 * spreadsheet software does not evaluate exported user content as a formula.
 */
export function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const body = rows.map((row) => columns.map((column) => escapeCsvValue(column.value(row))).join(","));
  // \uFEFF (BOM) keeps unicode names readable when the file is opened in Excel.
  return `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
}

export function csvFileName(prefix: string, date = new Date()) {
  const stamp = date.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `${prefix}-${stamp}.csv`;
}
