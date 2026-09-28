/**
 * A loggable summary of a failed database call. Driver errors quote the query
 * parameters (names, phone numbers…), so only the error name and code are kept.
 */
export function errorSummary(error: unknown) {
  const e = error as { name?: string; code?: string; cause?: { code?: string; name?: string } };
  const code = e?.code ?? e?.cause?.code;
  return [e?.cause?.name ?? e?.name ?? "Error", code].filter(Boolean).join(" ");
}
