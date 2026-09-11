import { changeCaseSchema, type ChangeCase } from "../domain/case";
import { caseRepository } from "./case-repository";
import { supabase } from "./supabase";

interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: string[];
}

interface PushResult {
  outcome: "accepted" | "conflict";
  remote?: ChangeCase;
}

function message(reason: unknown) {
  return reason instanceof Error ? reason.message : String(reason);
}

async function pushCase(value: ChangeCase): Promise<PushResult> {
  if (!supabase) throw new Error("Remote synchronization is not configured.");
  const { data, error } = await supabase.rpc("sync_casework_case", {
    p_case: value,
  });
  if (error) throw error;
  const row = data?.[0];
  if (row?.outcome === "accepted") return { outcome: "accepted" };
  if (!row?.remote_data) {
    throw new Error("The remote service reported a conflict without a record.");
  }
  return {
    outcome: "conflict",
    remote: changeCaseSchema.parse(row.remote_data),
  };
}

async function pullCases(): Promise<ChangeCase[]> {
  if (!supabase) throw new Error("Remote synchronization is not configured.");
  const { data, error } = await supabase
    .from("casework_cases")
    .select("data")
    .order("client_updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => changeCaseSchema.parse(row.data));
}

export async function synchronizeCases(): Promise<SyncResult> {
  if (!supabase) throw new Error("Remote synchronization is not configured.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in before synchronizing.");

  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: [] };
  const pending = await caseRepository.pendingChanges();

  for (const change of pending) {
    try {
      if (change.operation === "delete") {
        const { error } = await supabase
          .from("casework_cases")
          .delete()
          .eq("id", change.caseId);
        if (error) throw error;
      } else {
        const value = await caseRepository.get(change.caseId);
        if (!value) {
          await caseRepository.acknowledgeChange(change.id);
          continue;
        }
        const pushed = await pushCase(value);
        if (pushed.outcome === "conflict" && pushed.remote) {
          result.conflicts.push(change.caseId);
          await caseRepository.recordConflict(value, pushed.remote);
          await caseRepository.failChange(
            change.id,
            "The remote record has a newer revision.",
          );
          continue;
        }
      }
      result.pushed += 1;
      await caseRepository.acknowledgeChange(change.id);
    } catch (reason) {
      await caseRepository.failChange(change.id, message(reason));
      throw reason;
    }
  }

  const stillPending = await caseRepository.pendingChanges();
  const blocked = new Set(stillPending.map((item) => item.caseId));
  for (const remote of await pullCases()) {
    if (blocked.has(remote.id)) continue;
    const local = await caseRepository.get(remote.id);
    if (!local || remote.revision > local.revision) {
      await caseRepository.acceptRemote(remote);
      result.pulled += 1;
    }
  }

  return result;
}
