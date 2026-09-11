import { useParams } from "@tanstack/react-router";
import { useCases } from "../app/cases-context";
import { useCaseDraft } from "../app/use-case-draft";
import { SaveStateLabel } from "../components/save-state";
import { ThoughtField } from "../components/thought-field";
import type {
  Actor,
  ChangeCase,
  Difference,
  Experiment,
  Force,
  WorkspaceKey,
} from "../domain/case";

const workspaceMeta: Record<
  WorkspaceKey,
  { index: string; title: string; question: string; note: string }
> = {
  direction: {
    index: "01",
    title: "Direction",
    question: "What are we actually trying to make possible?",
    note: "Hold ambition beside present reality. A useful direction is specific enough to guide choices and open enough to survive contact with the work.",
  },
  dynamics: {
    index: "02",
    title: "Dynamics",
    question: "What is giving this situation its present shape?",
    note: "Pressure is carried by structures, incentives, identities, and people. Record evidence before assigning intent.",
  },
  influence: {
    index: "03",
    title: "Influence",
    question: "Who can alter the direction—and what are they protecting?",
    note: "Do not reduce people to supporters and blockers. Influence becomes useful when position, interest, and legitimate concern remain visible together.",
  },
  narrative: {
    index: "04",
    title: "Narrative",
    question: "What can be said truthfully that helps people move?",
    note: "A credible narrative names both possibility and cost. It does not use optimism to conceal what people may lose.",
  },
  experiments: {
    index: "05",
    title: "Experiments",
    question: "What is the smallest action that could teach us something?",
    note: "Use experiments to expose assumptions, not to disguise predetermined implementation as participation.",
  },
  differences: {
    index: "06",
    title: "Differences",
    question: "What must be coordinated even if agreement does not arrive?",
    note: "Some tensions contain information that consensus would erase. Name what differs, then design a way of working that can hold it.",
  },
};

function replaceWorkspace<K extends WorkspaceKey>(
  value: ChangeCase,
  key: K,
  workspace: ChangeCase["workspaces"][K],
): ChangeCase {
  return {
    ...value,
    workspaces: { ...value.workspaces, [key]: workspace },
  };
}

function DirectionEditor({
  value,
  change,
}: {
  value: ChangeCase;
  change(next: ChangeCase): void;
}) {
  const workspace = value.workspaces.direction;
  const field = (key: keyof typeof workspace, next: string) =>
    change(replaceWorkspace(value, "direction", { ...workspace, [key]: next }));
  return (
    <div className="thought-grid">
      <ThoughtField
        label="Intended outcome"
        prompt="Describe a changed condition—not a programme, deliverable, or slogan."
        value={workspace.intendedOutcome}
        onChange={(next) => field("intendedOutcome", next)}
        rows={5}
        signal="ANCHOR"
      />
      <ThoughtField
        label="Present tension"
        prompt="What is true now that the intended outcome must confront?"
        value={workspace.presentTension}
        onChange={(next) => field("presentTension", next)}
        rows={5}
      />
      <ThoughtField
        label="Why now"
        prompt="What makes movement necessary now? Separate urgency from manufactured pressure."
        value={workspace.whyNow}
        onChange={(next) => field("whyNow", next)}
      />
      <ThoughtField
        label="Boundaries"
        prompt="What must remain protected? What will this case deliberately not attempt?"
        value={workspace.boundaries}
        onChange={(next) => field("boundaries", next)}
      />
      <ThoughtField
        label="Evidence"
        prompt="Which observations make this account credible?"
        value={workspace.evidence}
        onChange={(next) => field("evidence", next)}
      />
      <ThoughtField
        label="Assumptions"
        prompt="What are we currently treating as true without sufficient evidence?"
        value={workspace.assumptions}
        onChange={(next) => field("assumptions", next)}
        signal="TEST NEXT"
      />
    </div>
  );
}

function DynamicsEditor({
  value,
  change,
}: {
  value: ChangeCase;
  change(next: ChangeCase): void;
}) {
  const workspace = value.workspaces.dynamics;
  const setForces = (forces: Force[]) =>
    change(replaceWorkspace(value, "dynamics", { ...workspace, forces }));
  const updateForce = (id: string, patch: Partial<Force>) =>
    setForces(workspace.forces.map((force) => (force.id === id ? { ...force, ...patch } : force)));

  return (
    <>
      <div className="record-toolbar">
        <span>{workspace.forces.length} pressures recorded</span>
        <button
          type="button"
          onClick={() =>
            setForces([
              ...workspace.forces,
              {
                id: crypto.randomUUID(),
                label: "",
                kind: "constraining",
                strength: 3,
                evidence: "",
              },
            ])
          }
        >
          Add pressure +
        </button>
      </div>
      <div className="pressure-field">
        {workspace.forces.map((force, index) => (
          <article className={`pressure-record pressure-record--${force.kind}`} key={force.id}>
            <div className="record-index">{String(index + 1).padStart(2, "0")}</div>
            <div className="record-main">
              <input
                aria-label="Pressure"
                placeholder="Name the pressure"
                value={force.label}
                onChange={(event) => updateForce(force.id, { label: event.target.value })}
              />
              <textarea
                aria-label="Evidence"
                placeholder="What evidence makes this more than an assumption?"
                value={force.evidence}
                onChange={(event) => updateForce(force.id, { evidence: event.target.value })}
              />
            </div>
            <div className="record-controls">
              <label>
                Character
                <select
                  value={force.kind}
                  onChange={(event) =>
                    updateForce(force.id, {
                      kind: event.target.value as Force["kind"],
                    })
                  }
                >
                  <option value="enabling">Enabling</option>
                  <option value="constraining">Constraining</option>
                </select>
              </label>
              <label>
                Weight · {force.strength}
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={force.strength}
                  onChange={(event) =>
                    updateForce(force.id, { strength: Number(event.target.value) })
                  }
                />
              </label>
              <button
                className="remove-record"
                type="button"
                onClick={() => setForces(workspace.forces.filter((item) => item.id !== force.id))}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
      <ThoughtField
        label="Interpretation"
        prompt="What pattern becomes visible when these pressures are held together?"
        value={workspace.interpretation}
        onChange={(next) =>
          change(replaceWorkspace(value, "dynamics", { ...workspace, interpretation: next }))
        }
        rows={5}
        signal="SYNTHESIS"
      />
    </>
  );
}

function InfluenceMap({ actors }: { actors: Actor[] }) {
  return (
    <div className="influence-map">
      <div className="influence-map__axis influence-map__axis--x">
        <span>Resisting</span><span>Undecided</span><span>Advancing</span>
      </div>
      <div className="influence-map__axis influence-map__axis--y">
        <span>High influence</span><span>Low influence</span>
      </div>
      {actors.map((actor) => (
        <div
          className="actor-node"
          key={actor.id}
          style={{
            left: `${12 + ((actor.stance + 2) / 4) * 76}%`,
            top: `${12 + ((5 - actor.influence) / 4) * 68}%`,
            width: `${46 + actor.interest * 8}px`,
            height: `${46 + actor.interest * 8}px`,
          }}
          title={`${actor.name}: influence ${actor.influence}, stance ${actor.stance}`}
        >
          {actor.name || "Unnamed"}
        </div>
      ))}
    </div>
  );
}

function InfluenceEditor({
  value,
  change,
}: {
  value: ChangeCase;
  change(next: ChangeCase): void;
}) {
  const workspace = value.workspaces.influence;
  const setActors = (actors: Actor[]) =>
    change(replaceWorkspace(value, "influence", { ...workspace, actors }));
  const updateActor = (id: string, patch: Partial<Actor>) =>
    setActors(workspace.actors.map((actor) => (actor.id === id ? { ...actor, ...patch } : actor)));

  return (
    <>
      <InfluenceMap actors={workspace.actors} />
      <div className="record-toolbar">
        <span>{workspace.actors.length} actors in the field</span>
        <button
          type="button"
          onClick={() =>
            setActors([
              ...workspace.actors,
              {
                id: crypto.randomUUID(),
                name: "",
                role: "",
                influence: 3,
                stance: 0,
                interest: 3,
                notes: "",
              },
            ])
          }
        >
          Add actor +
        </button>
      </div>
      <div className="actor-ledger">
        {workspace.actors.map((actor, index) => (
          <article className="actor-record" key={actor.id}>
            <span className="record-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="actor-record__identity">
              <input
                aria-label="Actor name"
                placeholder="Person or group"
                value={actor.name}
                onChange={(event) => updateActor(actor.id, { name: event.target.value })}
              />
              <input
                aria-label="Actor role"
                placeholder="Role in this case"
                value={actor.role}
                onChange={(event) => updateActor(actor.id, { role: event.target.value })}
              />
            </div>
            <label>Influence · {actor.influence}
              <input type="range" min="1" max="5" value={actor.influence}
                onChange={(event) => updateActor(actor.id, { influence: Number(event.target.value) })} />
            </label>
            <label>Position · {actor.stance > 0 ? `+${actor.stance}` : actor.stance}
              <input type="range" min="-2" max="2" value={actor.stance}
                onChange={(event) => updateActor(actor.id, { stance: Number(event.target.value) })} />
            </label>
            <textarea
              aria-label="Actor notes"
              placeholder="What are they protecting?"
              value={actor.notes}
              onChange={(event) => updateActor(actor.id, { notes: event.target.value })}
            />
            <button className="remove-record" type="button"
              onClick={() => setActors(workspace.actors.filter((item) => item.id !== actor.id))}>
              Remove
            </button>
          </article>
        ))}
      </div>
      <ThoughtField
        label="Interpretation"
        prompt="Where does influence actually sit, and what does the visible pattern change?"
        value={workspace.interpretation}
        onChange={(next) =>
          change(replaceWorkspace(value, "influence", { ...workspace, interpretation: next }))
        }
        rows={5}
        signal="SYNTHESIS"
      />
    </>
  );
}

function NarrativeEditor({
  value,
  change,
}: {
  value: ChangeCase;
  change(next: ChangeCase): void;
}) {
  const workspace = value.workspaces.narrative;
  const field = (key: keyof typeof workspace, next: string) =>
    change(replaceWorkspace(value, "narrative", { ...workspace, [key]: next }));
  return (
    <div className="narrative-sequence">
      <ThoughtField label="The central truth"
        prompt="What can no longer honestly be ignored?"
        value={workspace.centralTruth} onChange={(next) => field("centralTruth", next)} rows={5} />
      <ThoughtField label="The promise"
        prompt="What becomes possible—and for whom?"
        value={workspace.promise} onChange={(next) => field("promise", next)} rows={5} />
      <ThoughtField label="The acknowledged cost"
        prompt="What effort, loss, or uncertainty must not be hidden?"
        value={workspace.acknowledgedCost}
        onChange={(next) => field("acknowledgedCost", next)} rows={5} signal="CREDIBILITY" />
      <ThoughtField label="The invitation"
        prompt="What meaningful part can people play in shaping what happens?"
        value={workspace.invitation} onChange={(next) => field("invitation", next)} rows={5} />
    </div>
  );
}

function ExperimentsEditor({
  value,
  change,
}: {
  value: ChangeCase;
  change(next: ChangeCase): void;
}) {
  const workspace = value.workspaces.experiments;
  const setItems = (items: Experiment[]) =>
    change(replaceWorkspace(value, "experiments", { ...workspace, items }));
  const updateItem = (id: string, patch: Partial<Experiment>) =>
    setItems(workspace.items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  return (
    <>
      <ThoughtField label="Learning question"
        prompt="What do we need to learn before making the next expensive or irreversible move?"
        value={workspace.learningQuestion}
        onChange={(next) =>
          change(replaceWorkspace(value, "experiments", { ...workspace, learningQuestion: next }))
        } rows={4} signal="ORIENTING QUESTION" />
      <div className="record-toolbar">
        <span>{workspace.items.length} experiments</span>
        <button type="button" onClick={() => setItems([...workspace.items, {
          id: crypto.randomUUID(), hypothesis: "", signal: "", status: "idea",
        }])}>Add experiment +</button>
      </div>
      <div className="experiment-list">
        {workspace.items.map((item, index) => (
          <article className="experiment-record" key={item.id}>
            <header><span>{String(index + 1).padStart(2, "0")}</span>
              <select value={item.status}
                onChange={(event) => updateItem(item.id, { status: event.target.value as Experiment["status"] })}>
                <option value="idea">Idea</option><option value="running">Running</option>
                <option value="observed">Observed</option>
              </select>
            </header>
            <textarea aria-label="Hypothesis" placeholder="If we… then we expect… because…"
              value={item.hypothesis}
              onChange={(event) => updateItem(item.id, { hypothesis: event.target.value })} />
            <input aria-label="Signal" placeholder="What observable signal will matter?"
              value={item.signal}
              onChange={(event) => updateItem(item.id, { signal: event.target.value })} />
            <button className="remove-record" type="button"
              onClick={() => setItems(workspace.items.filter((entry) => entry.id !== item.id))}>
              Remove
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

function DifferencesEditor({
  value,
  change,
}: {
  value: ChangeCase;
  change(next: ChangeCase): void;
}) {
  const workspace = value.workspaces.differences;
  const setItems = (items: Difference[]) =>
    change(replaceWorkspace(value, "differences", { ...workspace, items }));
  const updateItem = (id: string, patch: Partial<Difference>) =>
    setItems(workspace.items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  return (
    <>
      <div className="record-toolbar">
        <span>{workspace.items.length} differences held</span>
        <button type="button" onClick={() => setItems([...workspace.items, {
          id: crypto.randomUUID(), tension: "", sideA: "", sideB: "", coordination: "",
        }])}>Name a difference +</button>
      </div>
      <div className="difference-list">
        {workspace.items.map((item, index) => (
          <article className="difference-record" key={item.id}>
            <header>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <input aria-label="Tension" placeholder="Name the unresolved tension"
                value={item.tension}
                onChange={(event) => updateItem(item.id, { tension: event.target.value })} />
            </header>
            <div className="difference-record__positions">
              <textarea aria-label="First position" placeholder="One legitimate position…"
                value={item.sideA}
                onChange={(event) => updateItem(item.id, { sideA: event.target.value })} />
              <textarea aria-label="Second position" placeholder="Another legitimate position…"
                value={item.sideB}
                onChange={(event) => updateItem(item.id, { sideB: event.target.value })} />
            </div>
            <textarea className="difference-record__coordination" aria-label="Coordination practice"
              placeholder="How can work continue without pretending this difference is resolved?"
              value={item.coordination}
              onChange={(event) => updateItem(item.id, { coordination: event.target.value })} />
            <button className="remove-record" type="button"
              onClick={() => setItems(workspace.items.filter((entry) => entry.id !== item.id))}>
              Remove
            </button>
          </article>
        ))}
      </div>
      <ThoughtField label="Operating agreement"
        prompt="What agreement about working together can hold these differences without erasing them?"
        value={workspace.operatingAgreement}
        onChange={(next) =>
          change(replaceWorkspace(value, "differences", { ...workspace, operatingAgreement: next }))
        } rows={5} signal="WORKABLE BOUNDARY" />
    </>
  );
}

export function WorkspacePage({ workspace }: { workspace: WorkspaceKey }) {
  const { caseId } = useParams({ strict: false });
  const { getCase } = useCases();
  const source = caseId ? getCase(caseId) : undefined;
  if (!source) return null;
  return <WorkspaceEditor key={`${source.id}-${workspace}`} source={source} workspace={workspace} />;
}

function WorkspaceEditor({
  source,
  workspace,
}: {
  source: ChangeCase;
  workspace: WorkspaceKey;
}) {
  const { draft, update, saveState } = useCaseDraft(source);
  const meta = workspaceMeta[workspace];

  return (
    <main className={`workspace workspace--${workspace}`}>
      <header className="stage-header workspace__header">
        <div className="workspace__index">{meta.index}</div>
        <div>
          <p className="meta-label">{meta.title} / working field</p>
          <h1>{meta.question}</h1>
        </div>
        <p>{meta.note}</p>
        <SaveStateLabel state={saveState} revision={draft.revision} />
      </header>
      <section className="workspace__body">
        {workspace === "direction" && <DirectionEditor value={draft} change={update} />}
        {workspace === "dynamics" && <DynamicsEditor value={draft} change={update} />}
        {workspace === "influence" && <InfluenceEditor value={draft} change={update} />}
        {workspace === "narrative" && <NarrativeEditor value={draft} change={update} />}
        {workspace === "experiments" && <ExperimentsEditor value={draft} change={update} />}
        {workspace === "differences" && <DifferencesEditor value={draft} change={update} />}
      </section>
    </main>
  );
}
