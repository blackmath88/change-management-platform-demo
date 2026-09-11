import type { SaveState } from "../app/use-case-draft";

const labels: Record<SaveState, string> = {
  quiet: "Local record",
  "mark-made": "Mark made",
  recorded: "Recorded",
};

export function SaveStateLabel({
  state,
  revision,
}: {
  state: SaveState;
  revision: number;
}) {
  return (
    <span className={`save-state save-state--${state}`} role="status">
      <span className="save-state__line" aria-hidden="true" />
      {labels[state]} · r{String(revision).padStart(2, "0")}
    </span>
  );
}
