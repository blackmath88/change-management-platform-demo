import { Link, useParams } from "@tanstack/react-router";
import { useCases } from "../app/cases-context";
import { RelationalField } from "../components/relational-field";

function measure(value: string | unknown[]) {
  return typeof value === "string" ? (value.trim() ? 1 : 0) : value.length;
}

export function CaseOverview() {
  const { caseId } = useParams({ from: "/cases/$caseId/" });
  const { getCase } = useCases();
  const value = getCase(caseId);
  if (!value) return null;

  const actors = value.workspaces.influence.actors;
  const forces = value.workspaces.dynamics.forces;
  const experiments = value.workspaces.experiments.items;
  const differences = value.workspaces.differences.items;
  const completion = [
    measure(value.workspaces.direction.intendedOutcome),
    measure(forces),
    measure(actors),
    measure(value.workspaces.narrative.centralTruth),
    measure(experiments),
    measure(differences),
  ].reduce((sum, item) => sum + (item ? 1 : 0), 0);

  const strongest = [...forces].sort((a, b) => b.strength - a.strength)[0];
  const centralActor = [...actors].sort((a, b) => b.influence - a.influence)[0];

  return (
    <main className="case-plate">
      <header className="stage-header stage-header--plate">
        <div>
          <p className="meta-label">Case plate / revision {value.revision}</p>
          <h1>{value.title}</h1>
        </div>
        <p>{value.situation}</p>
      </header>

      <div className="case-composition">
        <section className="composition-direction">
          <p className="meta-label">Intended direction</p>
          <blockquote>
            {value.workspaces.direction.intendedOutcome ||
              "The intended outcome has not been recorded yet."}
          </blockquote>
          <Link
            to="/cases/$caseId/direction"
            params={{ caseId }}
            className="section-link"
          >
            Examine direction <span>↗</span>
          </Link>
        </section>

        <section className="composition-field">
          <RelationalField value={value} />
        </section>

        <section className="composition-signals">
          <p className="meta-label">Current signals</p>
          <dl>
            <div><dt>Pressure</dt><dd>{forces.length.toString().padStart(2, "0")}</dd></div>
            <div><dt>Actors</dt><dd>{actors.length.toString().padStart(2, "0")}</dd></div>
            <div><dt>Experiments</dt><dd>{experiments.length.toString().padStart(2, "0")}</dd></div>
            <div><dt>Held differences</dt><dd>{differences.length.toString().padStart(2, "0")}</dd></div>
          </dl>
        </section>

        <section className="composition-attention">
          <p className="meta-label">What asks for attention</p>
          <h2>{strongest?.label || "Pressure has not been mapped."}</h2>
          <p>
            {strongest?.evidence ||
              "Record enabling and constraining forces to make the field visible."}
          </p>
          <Link to="/cases/$caseId/dynamics" params={{ caseId }} className="section-link">
            Read the dynamics <span>↗</span>
          </Link>
        </section>

        <section className="composition-actor">
          <p className="meta-label">Central influence</p>
          <h2>{centralActor?.name || "No actor identified"}</h2>
          <p>{centralActor?.notes || "Map who can alter the direction of the case."}</p>
          <Link to="/cases/$caseId/influence" params={{ caseId }} className="section-link">
            Open influence field <span>↗</span>
          </Link>
        </section>

        <section className="composition-next">
          <p className="meta-label">Next useful move</p>
          <h2>
            {experiments.some((item) => item.status === "running")
              ? "Observe before prescribing."
              : "Turn one assumption into an experiment."}
          </h2>
          <Link to="/cases/$caseId/experiments" params={{ caseId }} className="section-link">
            Work with experiments <span>↗</span>
          </Link>
        </section>
      </div>

      <footer className="plate-footer">
        <span>CASE COMPLETENESS</span>
        <span className="plate-footer__track">
          <i style={{ width: `${(completion / 6) * 100}%` }} />
        </span>
        <strong>{completion} / 6 fields in use</strong>
      </footer>
    </main>
  );
}
