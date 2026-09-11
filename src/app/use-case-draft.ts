import { useCallback, useEffect, useRef, useState } from "react";
import { useCases } from "./cases-context";
import type { ChangeCase } from "../domain/case";

export type SaveState = "quiet" | "mark-made" | "recorded";

export function useCaseDraft(source: ChangeCase) {
  const { saveCase } = useCases();
  const [draft, setDraft] = useState(source);
  const [saveState, setSaveState] = useState<SaveState>("quiet");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const draftRef = useRef(draft);

  useEffect(() => {
    setDraft(source);
    draftRef.current = source;
  }, [source.id]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const update = useCallback(
    (next: ChangeCase) => {
      draftRef.current = next;
      setDraft(next);
      setSaveState("mark-made");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const saved = await saveCase(draftRef.current);
        draftRef.current = { ...draftRef.current, revision: saved.revision };
        setDraft((current) => ({ ...current, revision: saved.revision }));
        setSaveState("recorded");
        timer.current = setTimeout(() => setSaveState("quiet"), 1600);
      }, 650);
    },
    [saveCase],
  );

  return { draft, update, saveState };
}
