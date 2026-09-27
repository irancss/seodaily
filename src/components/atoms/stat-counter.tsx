/**
 * Number that counts up as it scrolls into view (pure CSS, see `.count` in
 * globals.css). Screen readers get the plain value.
 */
export function StatCounter({ value, suffix, className }: { value: number; suffix?: string; className?: string }) {
  return (
    <span className={className}>
      <span className="sr-only">
        {value.toLocaleString("fa-IR")}
        {suffix}
      </span>
      <span aria-hidden="true" className="count" style={{ ["--to" as string]: value }} />
      {suffix && <span aria-hidden="true">{suffix}</span>}
    </span>
  );
}
