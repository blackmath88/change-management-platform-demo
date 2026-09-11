import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { ConflictChoices } from "../domain/conflict-resolution";
import { mergeConflict } from "../domain/conflict-resolution";
import {
  caseRepository,
  type CaseSyncConflict,
} from "../data/case-repository";
import { synchronizeCases } from "../data/case-sync";
import { remoteConfigured, supabase } from "../data/supabase";
import { useCases } from "./cases-context";

export type SyncState =
  | "local"
  | "signed-out"
  | "quiet"
  | "synchronizing"
  | "conflict"
  | "error";

interface SyncContextValue {
  configured: boolean;
  user: User | null;
  state: SyncState;
  detail: string;
  conflicts: CaseSyncConflict[];
  sendMagicLink(email: string): Promise<void>;
  signOut(): Promise<void>;
  synchronize(): Promise<void>;
  resolveConflict(conflict: CaseSyncConflict, choices: ConflictChoices): Promise<void>;
  useRemoteConflict(conflict: CaseSyncConflict): Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { reloadCases } = useCases();
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<SyncState>(
    remoteConfigured ? "signed-out" : "local",
  );
  const [detail, setDetail] = useState(
    remoteConfigured ? "Sign in to synchronize" : "This record stays on this device",
  );
  const [conflicts, setConflicts] = useState<CaseSyncConflict[]>([]);

  const reloadConflicts = useCallback(async () => {
    const values = await caseRepository.conflicts();
    setConflicts(values);
    return values;
  }, []);

  const synchronize = useCallback(async () => {
    if (!supabase || !user) return;
    setState("synchronizing");
    setDetail("Reconciling local and remote records");
    try {
      const result = await synchronizeCases();
      await reloadCases();
      const unresolved = await reloadConflicts();
      if (unresolved.length) {
        setState("conflict");
        setDetail(`${unresolved.length} case conflict${unresolved.length === 1 ? "" : "s"} require attention`);
      } else {
        setState("quiet");
        setDetail(`${result.pushed} sent · ${result.pulled} received`);
      }
    } catch (reason) {
      setState("error");
      setDetail(reason instanceof Error ? reason.message : "Synchronization failed");
    }
  }, [reloadCases, reloadConflicts, user]);

  useEffect(() => {
    void reloadConflicts().then((values) => {
      if (values.length && remoteConfigured) {
        setState("conflict");
        setDetail(`${values.length} case conflict${values.length === 1 ? "" : "s"} require attention`);
      }
    });
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setState((current) => current === "conflict" ? current : data.user ? "quiet" : "signed-out");
      setDetail((current) => current.includes("require attention") ? current : data.user ? "Ready to synchronize" : "Sign in to synchronize");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setState((current) => current === "conflict" ? current : session?.user ? "quiet" : "signed-out");
      setDetail((current) => current.includes("require attention") ? current : session?.user ? "Ready to synchronize" : "Sign in to synchronize");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [reloadConflicts]);

  async function sendMagicLink(email: string) {
    if (!supabase) throw new Error("Remote synchronization is not configured.");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    setDetail("Check your email for the sign-in link");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function resolveConflict(
    conflict: CaseSyncConflict,
    choices: ConflictChoices,
  ) {
    const merged = mergeConflict(conflict.local, conflict.remote, choices);
    await caseRepository.resolveConflict(merged);
    await reloadCases();
    const unresolved = await reloadConflicts();
    setState(unresolved.length ? "conflict" : "quiet");
    setDetail(
      unresolved.length
        ? `${unresolved.length} case conflict${unresolved.length === 1 ? "" : "s"} require attention`
        : "Resolution saved locally · ready to synchronize",
    );
  }

  async function useRemoteConflict(conflict: CaseSyncConflict) {
    await caseRepository.acceptConflictRemote(conflict.caseId);
    await reloadCases();
    const unresolved = await reloadConflicts();
    setState(unresolved.length ? "conflict" : "quiet");
    setDetail(
      unresolved.length
        ? `${unresolved.length} case conflict${unresolved.length === 1 ? "" : "s"} require attention`
        : "Remote revision accepted",
    );
  }

  const value = useMemo<SyncContextValue>(
    () => ({
      configured: remoteConfigured,
      user,
      state,
      detail,
      conflicts,
      sendMagicLink,
      signOut,
      synchronize,
      resolveConflict,
      useRemoteConflict,
    }),
    [user, state, detail, conflicts, synchronize],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used inside SyncProvider.");
  return context;
}
