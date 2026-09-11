import { useId } from "react";

export function ThoughtField({
  label,
  prompt,
  value,
  onChange,
  rows = 3,
  signal,
}: {
  label: string;
  prompt: string;
  value: string;
  onChange(value: string): void;
  rows?: number;
  signal?: string;
}) {
  const id = useId();
  return (
    <div className="thought-field">
      <div className="thought-field__label">
        <label htmlFor={id}>{label}</label>
        {signal && <span>{signal}</span>}
      </div>
      <p>{prompt}</p>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
