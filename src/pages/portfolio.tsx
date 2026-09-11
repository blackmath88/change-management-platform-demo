import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
  TextField,
  Input,
  Label,
  TextArea,
} from "react-aria-components";
import { useCases } from "../app/cases-context";
import { Brand } from "../components/brand";
import { StatusMark } from "../components/status-mark";
import { parseCaseFile } from "../services/case-file";
import type { ChangeCase } from "../domain/case";
import { SyncControl } from "../components/sync-control";
import { MaterialControl } from "../components/material-control";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(value))
    .toUpperCase();
}

function caseSignal(value: ReturnType<typeof useCases>["cases"][number]) {
  const forces = value.workspaces.dynamics.forces.length;
  const actors = value.workspaces.influence.actors.length;
  const experiments = value.workspaces.experiments.items.filter(
    (item) => item.status === "running",
  ).length;
  const differences = value.workspaces.differences.items.length;
  return [
    `${forces} pressure${forces === 1 ? "" : "s"}`,
    `${actors} actor${actors === 1 ? "" : "s"}`,
    experiments ? `${experiments} experiment active` : "no experiment active",
    `${differences} difference${differences === 1 ? "" : "s"} held`,
  ].join(" · ");
}

function NewCaseDialog() {
  const { createCase } = useCases();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState({
    title: "",
    organization: "",
    situation: "",
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const created = await createCase(input);
    setOpen(false);
    await navigate({ to: "/cases/$caseId", params: { caseId: created.id } });
  }

  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <Button className="begin-case">Begin a new case <span>↗</span></Button>
      <ModalOverlay className="modal-overlay" isDismissable>
        <Modal className="modal">
          <Dialog className="new-case-dialog">
            {({ close }) => (
              <form onSubmit={submit}>
                <div className="dialog-index">NEW / 01</div>
                <Heading slot="title">Open a case.</Heading>
                <p>
                  Start with the situation as it exists—not the programme designed
                  to solve it.
                </p>
                <TextField
                  isRequired
                  value={input.title}
                  onChange={(title) => setInput((current) => ({ ...current, title }))}
                >
                  <Label>Working title</Label>
                  <Input autoFocus placeholder="What are you trying to move?" />
                </TextField>
                <TextField
                  value={input.organization}
                  onChange={(organization) =>
                    setInput((current) => ({ ...current, organization }))
                  }
                >
                  <Label>Organization or setting</Label>
                  <Input placeholder="Where is this happening?" />
                </TextField>
                <TextField
                  value={input.situation}
                  onChange={(situation) =>
                    setInput((current) => ({ ...current, situation }))
                  }
                >
                  <Label>Present situation</Label>
                  <TextArea placeholder="What is happening now, and what makes it difficult?" />
                </TextField>
                <div className="dialog-actions">
                  <Button type="button" className="quiet-button" onPress={close}>
                    Cancel
                  </Button>
                  <Button type="submit" className="action-button">
                    Open case
                  </Button>
                </div>
              </form>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

function ImportCaseButton() {
  const { importCase } = useCases();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function selectFile(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const parsed = parseCaseFile(JSON.parse(await file.text()));
      const created = await importCase(parsed.value);
      await navigate({ to: "/cases/$caseId", params: { caseId: created.id } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The record could not be imported.");
    }
  }

  return (
    <div className="import-case">
      <label className="import-case__button">
        Import a record ↑
        <input
          type="file"
          accept=".json,.casework.json,application/json"
          onChange={(event) => {
            void selectFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function CaseRows({ values }: { values: ChangeCase[] }) {
  return (
    <ol className="case-list">
      {values.map((item, index) => (
        <li key={item.id}>
          <Link
            to="/cases/$caseId"
            params={{ caseId: item.id }}
            className="case-row"
          >
            <span className="case-row__number">
              {String(values.length - index).padStart(2, "0")}
            </span>
            <span className="case-row__identity">
              <strong>{item.title}</strong>
              <span>{item.organization || "Independent case"}</span>
            </span>
            <span className="case-row__signal">{caseSignal(item)}</span>
            <span className="case-row__meta">
              <StatusMark status={item.status} />
              <time>{formatDate(item.updatedAt)}</time>
            </span>
            <span className="case-row__arrow" aria-hidden="true">↗</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function Portfolio() {
  const { cases, loading } = useCases();
  const activeCases = cases.filter((item) => item.status !== "archived");
  const archivedCases = cases.filter((item) => item.status === "archived");

  return (
    <div className="portfolio">
      <header className="portfolio__masthead">
        <Brand />
        <div className="portfolio__date">
          <MaterialControl />
          <SyncControl />
          <span>Private ledger</span>
          <time>{formatDate(new Date().toISOString())}</time>
        </div>
      </header>

      <main className="portfolio__main">
        <section className="portfolio__introduction">
          <div className="folio-number" aria-hidden="true">01</div>
          <div>
            <p className="meta-label">Active case index</p>
            <h1>Change becomes legible<br />when the relations do.</h1>
          </div>
          <p className="portfolio__thesis">
            A working ledger for direction, pressure, influence, narrative,
            experiments, and the differences that will not simply disappear.
          </p>
        </section>

        <section className="case-index" aria-labelledby="case-index-title">
          <header className="case-index__header">
            <h2 id="case-index-title">Cases in motion</h2>
            <span>{String(activeCases.length).padStart(2, "0")} records</span>
          </header>

          {loading ? (
            <div className="case-loading">Opening the ledger…</div>
          ) : activeCases.length ? (
            <CaseRows values={activeCases} />
          ) : (
            <div className="case-loading">No case is currently in motion.</div>
          )}
          <footer className="case-index__footer">
            <div className="case-index__actions">
              <NewCaseDialog />
              <ImportCaseButton />
            </div>
            <p>
              Records remain in this browser.<br />
              Remote synchronization is not yet connected.
            </p>
          </footer>
        </section>

        {archivedCases.length > 0 && (
          <details className="archive-index">
            <summary>
              <span>Archive</span>
              <span>{String(archivedCases.length).padStart(2, "0")} records</span>
            </summary>
            <CaseRows values={archivedCases} />
          </details>
        )}
      </main>
    </div>
  );
}
