import { Link } from "@tanstack/react-router";
import { Brand } from "../components/brand";

export function NotFound() {
  return (
    <main className="error-page">
      <Brand />
      <p className="meta-label">Record not found</p>
      <h1>This case has left the ledger.</h1>
      <Link to="/" className="text-link">
        Return to the case index
      </Link>
    </main>
  );
}
