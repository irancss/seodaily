/**
 * Number that counts up as it scrolls into view (pure CSS, see `.count` in
 * globals.css). The digits and suffix are drawn by CSS, so the page text
 * (and what search engines read) holds the value exactly once, in the
 * visually hidden span.
 */
export function StatCounter({ value, suffix, className }: { value: number; suffix?: string; className?: string }) {
  return (
    <span className={className}>
      <span className="sr-only">
        {value.toLocaleString("fa-IR")}
        {suffix}
      </span>
      <span aria-hidden="true" className="count" data-suffix={suffix} style={{ ["--to" as string]: value }} />
    </span>
  );
}
