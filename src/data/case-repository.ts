import Dexie, { type EntityTable } from "dexie";
import {
  changeCaseSchema,
  createExampleCase,
  type ChangeCase,
} from "../domain/case";

export interface SyncQueueItem {
  id: string;
  caseId: string;
  operation: "upsert" | "delete";
  enqueuedAt: string;
  attempts: number;
  lastError: string;
}

export interface CaseSyncConflict {
  caseId: string;
  local: ChangeCase;
  remote: ChangeCase;
  detectedAt: string;
}

export interface CaseRepository {
  list(): Promise<ChangeCase[]>;
  get(id: string): Promise<ChangeCase | undefined>;
  create(value: ChangeCase): Promise<ChangeCase>;
  save(value: ChangeCase): Promise<ChangeCase>;
  remove(id: string): Promise<void>;
  pendingChanges(): Promise<SyncQueueItem[]>;
  acknowledgeChange(id: string): Promise<void>;
  failChange(id: string, message: string): Promise<void>;
  acceptRemote(value: ChangeCase): Promise<void>;
  conflicts(): Promise<CaseSyncConflict[]>;
  recordConflict(local: ChangeCase, remote: ChangeCase): Promise<void>;
  resolveConflict(value: ChangeCase): Promise<ChangeCase>;
  acceptConflictRemote(caseId: string): Promise<ChangeCase>;
}

class CaseworkDatabase extends Dexie {
  cases!: EntityTable<ChangeCase, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;
  syncConflicts!: EntityTable<CaseSyncConflict, "caseId">;

  constructor() {
    super("casework");
    this.version(1).stores({
      cases: "id, status, updatedAt, organization",
    });
    this.version(2).stores({
      cases: "id, status, updatedAt, organization",
      syncQueue: "id, caseId, operation, enqueuedAt",
    }).upgrade(async (transaction) => {
      const existingCases = await transaction
        .table<ChangeCase>("cases")
        .toArray();
      const queue = transaction.table<SyncQueueItem>("syncQueue");
      for (const value of existingCases) {
        await queue.put({
          id: value.id,
          caseId: value.id,
          operation: "upsert",
          enqueuedAt: new Date().toISOString(),
          attempts: 0,
          lastError: "",
        });
      }
    });
    this.version(3).stores({
      cases: "id, status, updatedAt, organization",
      syncQueue: "id, caseId, operation, enqueuedAt",
      syncConflicts: "caseId, detectedAt",
    });
  }
}

const database = new CaseworkDatabase();

async function queueChange(caseId: string, operation: SyncQueueItem["operation"]) {
  const existing = await database.syncQueue.get(caseId);
  const item: SyncQueueItem = {
    id: caseId,
    caseId,
    operation,
    enqueuedAt: new Date().toISOString(),
    attempts: existing?.attempts ?? 0,
    lastError: "",
  };
  await database.syncQueue.put(item);
}

export class IndexedDbCaseRepository implements CaseRepository {
  async ensureExample(): Promise<void> {
    if ((await database.cases.count()) === 0) {
      const example = createExampleCase();
      // A deterministic seed id keeps React StrictMode's development remount
      // from racing two different example records into an empty database.
      example.id = "00000000-0000-4000-8000-000000000001";
      await database.transaction("rw", database.cases, database.syncQueue, async () => {
        await database.cases.put(example);
        await queueChange(example.id, "upsert");
      });
    }
  }

  async list(): Promise<ChangeCase[]> {
    await this.ensureExample();
    const rows = await database.cases.orderBy("updatedAt").reverse().toArray();
    return rows.map((row) => changeCaseSchema.parse(row));
  }

  async get(id: string): Promise<ChangeCase | undefined> {
    const row = await database.cases.get(id);
    return row ? changeCaseSchema.parse(row) : undefined;
  }

  async create(value: ChangeCase): Promise<ChangeCase> {
    const parsed = changeCaseSchema.parse(value);
    await database.transaction("rw", database.cases, database.syncQueue, async () => {
      await database.cases.add(parsed);
      await queueChange(parsed.id, "upsert");
    });
    return parsed;
  }

  async save(value: ChangeCase): Promise<ChangeCase> {
    const current = await database.cases.get(value.id);
    const parsed = changeCaseSchema.parse({
      ...value,
      revision: Math.max(value.revision, current?.revision ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    });
    await database.transaction("rw", database.cases, database.syncQueue, async () => {
      await database.cases.put(parsed);
      await queueChange(parsed.id, "upsert");
    });
    return parsed;
  }

  async remove(id: string): Promise<void> {
    await database.transaction("rw", database.cases, database.syncQueue, async () => {
      await database.cases.delete(id);
      await queueChange(id, "delete");
    });
  }

  async pendingChanges(): Promise<SyncQueueItem[]> {
    return database.syncQueue.orderBy("enqueuedAt").toArray();
  }

  async acknowledgeChange(id: string): Promise<void> {
    await database.syncQueue.delete(id);
  }

  async failChange(id: string, message: string): Promise<void> {
    const item = await database.syncQueue.get(id);
    if (!item) return;
    await database.syncQueue.put({
      ...item,
      attempts: item.attempts + 1,
      lastError: message,
    });
  }

  async acceptRemote(value: ChangeCase): Promise<void> {
    await database.cases.put(changeCaseSchema.parse(value));
  }

  async conflicts(): Promise<CaseSyncConflict[]> {
    const rows = await database.syncConflicts.orderBy("detectedAt").reverse().toArray();
    return rows.map((row) => ({
      ...row,
      local: changeCaseSchema.parse(row.local),
      remote: changeCaseSchema.parse(row.remote),
    }));
  }

  async recordConflict(local: ChangeCase, remote: ChangeCase): Promise<void> {
    if (local.id !== remote.id) {
      throw new Error("A synchronization conflict must refer to one case.");
    }
    await database.syncConflicts.put({
      caseId: local.id,
      local: changeCaseSchema.parse(local),
      remote: changeCaseSchema.parse(remote),
      detectedAt: new Date().toISOString(),
    });
  }

  async resolveConflict(value: ChangeCase): Promise<ChangeCase> {
    const conflict = await database.syncConflicts.get(value.id);
    if (!conflict) throw new Error("This synchronization conflict no longer exists.");
    const parsed = changeCaseSchema.parse({
      ...value,
      revision: Math.max(conflict.local.revision, conflict.remote.revision) + 1,
      updatedAt: new Date().toISOString(),
    });
    await database.transaction(
      "rw",
      database.cases,
      database.syncQueue,
      database.syncConflicts,
      async () => {
        await database.cases.put(parsed);
        await queueChange(parsed.id, "upsert");
        await database.syncConflicts.delete(parsed.id);
      },
    );
    return parsed;
  }

  async acceptConflictRemote(caseId: string): Promise<ChangeCase> {
    const conflict = await database.syncConflicts.get(caseId);
    if (!conflict) throw new Error("This synchronization conflict no longer exists.");
    const remote = changeCaseSchema.parse(conflict.remote);
    await database.transaction(
      "rw",
      database.cases,
      database.syncQueue,
      database.syncConflicts,
      async () => {
        await database.cases.put(remote);
        await database.syncQueue.delete(caseId);
        await database.syncConflicts.delete(caseId);
      },
    );
    return remote;
  }
}

export const caseRepository = new IndexedDbCaseRepository();
