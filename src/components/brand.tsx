import { Link } from "@tanstack/react-router";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      aria-label={compact ? "Changefield home" : undefined}
      className={`brand${compact ? " brand--compact" : ""}`}
    >
      <span className="brand__mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="brand__name">Changefield</span>
      {!compact && <span className="brand__descriptor">change in practice</span>}
    </Link>
  );
}
