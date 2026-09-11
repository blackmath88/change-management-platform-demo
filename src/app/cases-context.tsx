import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { caseRepository } from "../data/case-repository";
import {
  createCaseCopy,
  createEmptyCase,
  type ChangeCase,
} from "../domain/case";

interface NewCaseInput {
  title: string;
  organization: string;
  situation: string;
}

interface CasesContextValue {
  cases: ChangeCase[];
  loading: boolean;
  reloadCases(): Promise<void>;
  createCase(input: NewCaseInput): Promise<ChangeCase>;
  importCase(value: ChangeCase): Promise<ChangeCase>;
  duplicateCase(value: ChangeCase): Promise<ChangeCase>;
  saveCase(value: ChangeCase): Promise<ChangeCase>;
  deleteCase(id: string): Promise<void>;
  getCase(id: string): ChangeCase | undefined;
}

const CasesContext = createContext<CasesContextValue | null>(null);

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<ChangeCase[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadCases = useCallback(async () => {
    const result = await caseRepository.list();
    setCases(result);
  }, []);

  useEffect(() => {
    let active = true;
    caseRepository
      .list()
      .then((result) => {
        if (active) setCases(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const createCase = useCallback(async (input: NewCaseInput) => {
    const created = await caseRepository.create(createEmptyCase(input));
    setCases((current) => [created, ...current]);
    return created;
  }, []);

  const importCase = useCallback(async (value: ChangeCase) => {
    const now = new Date().toISOString();
    const imported = await caseRepository.create({
      ...value,
      id: crypto.randomUUID(),
      revision: 0,
      createdAt: now,
      updatedAt: now,
    });
    setCases((current) => [imported, ...current]);
    return imported;
  }, []);

  const duplicateCase = useCallback(async (value: ChangeCase) => {
    const created = await caseRepository.create(createCaseCopy(value));
    setCases((current) => [created, ...current]);
    return created;
  }, []);

  const saveCase = useCallback(async (value: ChangeCase) => {
    const saved = await caseRepository.save(value);
    setCases((current) =>
      current
        .map((item) => (item.id === saved.id ? saved : item))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
    return saved;
  }, []);

  const deleteCase = useCallback(async (id: string) => {
    await caseRepository.remove(id);
    setCases((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo<CasesContextValue>(
    () => ({
      cases,
      loading,
      reloadCases,
      createCase,
      importCase,
      duplicateCase,
      saveCase,
      deleteCase,
      getCase: (id) => cases.find((item) => item.id === id),
    }),
    [
      cases,
      loading,
      reloadCases,
      createCase,
      importCase,
      duplicateCase,
      saveCase,
      deleteCase,
    ],
  );

  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases() {
  const context = useContext(CasesContext);
  if (!context) throw new Error("useCases must be used inside CasesProvider.");
  return context;
}
