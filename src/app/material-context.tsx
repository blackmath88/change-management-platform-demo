import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MaterialMode = "clear" | "paper" | "fibre";

interface MaterialContextValue {
  mode: MaterialMode;
  setMode(mode: MaterialMode): void;
}

const storageKey = "casework.material";
const materialModes: MaterialMode[] = ["clear", "paper", "fibre"];
const MaterialContext = createContext<MaterialContextValue | null>(null);

function initialMode(): MaterialMode {
  const stored = window.localStorage.getItem(storageKey);
  return materialModes.includes(stored as MaterialMode)
    ? (stored as MaterialMode)
    : "paper";
}

export function MaterialProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MaterialMode>(initialMode);

  useEffect(() => {
    document.documentElement.dataset.material = mode;
    window.localStorage.setItem(storageKey, mode);
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return (
    <MaterialContext.Provider value={value}>
      {children}
    </MaterialContext.Provider>
  );
}

export function useMaterial() {
  const context = useContext(MaterialContext);
  if (!context) {
    throw new Error("useMaterial must be used inside MaterialProvider.");
  }
  return context;
}
