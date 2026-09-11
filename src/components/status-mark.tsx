import type { CaseStatus } from "../domain/case";

export function StatusMark({ status }: { status: CaseStatus }) {
  return (
    <span className={`status-mark status-mark--${status}`}>
      <span aria-hidden="true" />
      {status}
    </span>
  );
}
