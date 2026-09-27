export function Dots({ size = 10 }: { size?: number }) {
  return (
    <div aria-hidden="true" className="flex gap-1.5">
      <span className="rounded-full bg-line-strong" style={{ width: size, height: size }} />
      <span className="rounded-full bg-line" style={{ width: size, height: size }} />
      <span className="rounded-full bg-line" style={{ width: size, height: size }} />
    </div>
  );
}
