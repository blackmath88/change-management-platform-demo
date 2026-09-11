import { Link, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { useCases } from "../app/cases-context";
import { Brand } from "../components/brand";
import { StatusMark } from "../components/status-mark";
import { CaseActions } from "../components/case-actions";
import { MaterialControl } from "../components/material-control";

const navigation = [
  { path: "", label: "Case plate", index: "00" },
  { path: "direction", label: "Direction", index: "01" },
  { path: "dynamics", label: "Dynamics", index: "02" },
  { path: "influence", label: "Influence", index: "03" },
  { path: "narrative", label: "Narrative", index: "04" },
  { path: "experiments", label: "Experiments", index: "05" },
  { path: "differences", label: "Differences", index: "06" },
  { path: "history", label: "Record", index: "07" },
  { path: "brief", label: "Brief", index: "08" },
] as const;

export function CaseLayout() {
  const { caseId } = useParams({ from: "/cases/$caseId" });
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { getCase, loading } = useCases();
  const currentCase = getCase(caseId);

  if (loading) {
    return <div className="case-loading case-loading--page">Opening case…</div>;
  }

  if (!currentCase) {
    return (
      <main className="error-page">
        <Brand />
        <p className="meta-label">Missing record</p>
        <h1>This case is not in the local ledger.</h1>
        <Link to="/" className="text-link">Return to the case index</Link>
      </main>
    );
  }

  return (
    <div className="case-shell">
      <aside className="case-rail">
        <div className="case-rail__brand">
          <Brand compact />
          <MaterialControl compact />
        </div>
        <Link to="/" className="back-to-index">← Case index</Link>

        <div className="case-rail__identity">
          <span className="meta-label">Current record</span>
          <strong>{currentCase.title}</strong>
          <span>{currentCase.organization || "Independent case"}</span>
          <CaseActions value={currentCase} />
        </div>

        <nav className="case-navigation" aria-label="Case workspaces">
          <Link to="/" className="case-navigation__index-mobile">
            <span>←</span>
            <strong>Index</strong>
          </Link>
          {navigation.map((item) => {
            const to = item.path
              ? `/cases/$caseId/${item.path}` as const
              : "/cases/$caseId" as const;
            const hrefEnd = item.path ? `/${item.path}` : `/cases/${caseId}`;
            const active = item.path
              ? pathname.endsWith(hrefEnd)
              : pathname === hrefEnd || pathname === `${hrefEnd}/`;
            return (
              <Link
                key={item.index}
                to={to}
                params={{ caseId }}
                aria-label={item.label}
                className={`case-navigation__item${active ? " is-active" : ""}`}
              >
                <span>{item.index}</span>
                <strong>{item.label}</strong>
                <i aria-hidden="true" />
              </Link>
            );
          })}
        </nav>

        <footer className="case-rail__footer">
          <StatusMark status={currentCase.status} />
          <span>Revision {String(currentCase.revision).padStart(2, "0")}</span>
        </footer>
      </aside>

      <div className="case-stage">
        <Outlet />
      </div>
    </div>
  );
}
