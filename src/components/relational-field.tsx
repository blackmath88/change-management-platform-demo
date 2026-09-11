import type { ChangeCase } from "../domain/case";

export function RelationalField({ value }: { value: ChangeCase }) {
  const actors = value.workspaces.influence.actors;
  const forces = value.workspaces.dynamics.forces;
  const marks = [
    ...actors.map((actor, index) => ({
      id: actor.id,
      x: 18 + ((actor.stance + 2) / 4) * 64,
      y: 20 + ((5 - actor.influence) / 4) * 54 + (index % 2) * 7,
      radius: 4 + actor.interest * 1.3,
      kind: actor.stance < 0 ? "warm" : "cool",
    })),
    ...forces.map((force, index) => ({
      id: force.id,
      x: 16 + ((index * 29 + force.strength * 7) % 70),
      y: 70 + (index % 3) * 7,
      radius: 2.5 + force.strength,
      kind: force.kind === "constraining" ? "warm" : "quiet",
    })),
  ];

  return (
    <svg
      className="relational-field"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${actors.length} actors and ${forces.length} forces arranged as a relational field`}
    >
      <defs>
        <filter id="paper-soften">
          <feGaussianBlur stdDeviation=".35" />
        </filter>
      </defs>
      <path className="field-line field-line--one" d="M3 71 C24 39, 48 82, 97 28" />
      <path className="field-line field-line--two" d="M8 34 C38 12, 66 54, 94 68" />
      {marks.map((mark, index) => {
        const next = marks[index + 1];
        return next ? (
          <line
            key={`line-${mark.id}`}
            className="field-connection"
            x1={mark.x}
            y1={mark.y}
            x2={next.x}
            y2={next.y}
          />
        ) : null;
      })}
      {marks.map((mark) => (
        <g key={mark.id} className={`field-mark field-mark--${mark.kind}`}>
          <circle cx={mark.x} cy={mark.y} r={mark.radius + 2.5} opacity=".12" />
          <circle cx={mark.x} cy={mark.y} r={mark.radius} />
        </g>
      ))}
      <text x="7" y="94">PRESSURE / INFLUENCE / ATTENTION</text>
    </svg>
  );
}
