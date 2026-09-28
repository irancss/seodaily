/** Cycles through four words in place (CSS only); assistive tech reads them all once. */
export function WordRotator({ words, className }: { words: string[]; className?: string }) {
  if (words.length === 0) return null;
  // The keyframes step through exactly four words, then jump back to a copy of the first.
  const four = Array.from({ length: 4 }, (_, i) => words[i % words.length]);
  const loop = [...four, four[0]];
  return (
    <span className={className}>
      <span className="sr-only">{[...new Set(four)].join("، ")}</span>
      <span aria-hidden="true" className="rotator">
        <span className="rotator-list">
          {/* Drawn by CSS so the page text holds each word only once (in the sr-only list). */}
          {loop.map((word, i) => (
            <span key={i} className="css-label" data-label={word} />
          ))}
        </span>
      </span>
    </span>
  );
}
