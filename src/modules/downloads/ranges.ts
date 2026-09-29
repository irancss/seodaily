/** Union of completed inclusive byte ranges; incomplete streams never enter it. */
export function mergeRanges(ranges: [number, number][], start: number, end: number, size: number): [number, number][] {
  if (![start, end, size].every(Number.isSafeInteger) || start < 0 || end < start || end >= size) throw new Error("Invalid completed range");
  const result: [number, number][] = [];
  for (const [a, b] of [...ranges, [start, end] as [number, number]].sort((x, y) => x[0] - y[0])) {
    const prev = result.at(-1);
    if (prev && a <= prev[1] + 1) prev[1] = Math.max(prev[1], b);
    else result.push([a, b]);
  }
  // Bound adversarial fragment storage. Forgetting coverage may undercount,
  // but must never turn holes into a completed transfer.
  return result.length > 256 ? result.slice(0, 256) : result;
}
