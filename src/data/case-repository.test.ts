import "fake-indexeddb/auto";
import Dexie from "dexie";
import { beforeAll, describe, expect, it } from "vitest";
import { createEmptyCase } from "../domain/case";
import { IndexedDbCaseRepository } from "./case-repository";

describe("local case repository", () => {
  beforeAll(async () => {
    await Dexie.delete("casework");
  });

  it("coalesces local changes into one durable synchronization intent", async () => {
    const repository = new IndexedDbCaseRepository();
    const created = await repository.create(
      createEmptyCase({
        title: "Queue behavior",
        organization: "Northline",
        situation: "A local record changes before synchronization.",
      }),
    );

    expect(await repository.pendingChanges()).toMatchObject([
      { id: created.id, caseId: created.id, operation: "upsert", attempts: 0 },
    ]);

    await repository.save({
      ...created,
      situation: "The local record changed again.",
    });
    expect(await repository.pendingChanges()).toHaveLength(1);

    await repository.remove(created.id);
    expect(await repository.pendingChanges()).toMatchObject([
      { id: created.id, caseId: created.id, operation: "delete", attempts: 0 },
    ]);
    await repository.acknowledgeChange(created.id);
  });

  it("keeps both divergent records until a resolution is recorded", async () => {
    const repository = new IndexedDbCaseRepository();
    const local = await repository.create(
      createEmptyCase({
        title: "Local reading",
        organization: "Northline",
        situation: "The situation as observed here.",
      }),
    );
    const remote = {
      ...structuredClone(local),
      title: "Remote reading",
      revision: 4,
    };

    await repository.recordConflict(local, remote);
    expect(await repository.conflicts()).toMatchObject([
      {
        caseId: local.id,
        local: { title: "Local reading" },
        remote: { title: "Remote reading", revision: 4 },
      },
    ]);

    const resolved = await repository.resolveConflict({
      ...local,
      title: "Deliberate synthesis",
      revision: remote.revision,
    });
    expect(resolved).toMatchObject({
      title: "Deliberate synthesis",
      revision: 5,
    });
    expect(await repository.conflicts()).toEqual([]);
    expect(await repository.pendingChanges()).toMatchObject([
      { caseId: local.id, operation: "upsert" },
    ]);
    await repository.acknowledgeChange(local.id);
    await repository.remove(local.id);
    await repository.acknowledgeChange(local.id);
  });

  it("can accept the complete remote record without sending it back", async () => {
    const repository = new IndexedDbCaseRepository();
    const local = await repository.create(
      createEmptyCase({
        title: "Local reading to replace",
        organization: "Northline",
        situation: "A divergent record.",
      }),
    );
    const remote = {
      ...structuredClone(local),
      title: "Accepted remote reading",
      revision: 7,
    };

    await repository.recordConflict(local, remote);
    await repository.acceptConflictRemote(local.id);

    expect(await repository.get(local.id)).toMatchObject(remote);
    expect(await repository.conflicts()).toEqual([]);
    expect(await repository.pendingChanges()).toEqual([]);
  });
});
