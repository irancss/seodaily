// CSV cells for spreadsheets: values that a spreadsheet would run as a
// formula (=, +, -, @, tab, CR) are prefixed with an apostrophe, which also
// keeps +98… numbers as text instead of a number with lost digits.
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvRow(values: unknown[]) {
  return `${values.map(csvCell).join(",")}\r\n`;
}
