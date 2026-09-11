import { useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Input,
  Label,
  Modal,
  ModalOverlay,
  TextField,
} from "react-aria-components";
import { useSync } from "../app/sync-context";
import {
  changedConflictSections,
  conflictSections,
  conflictSectionSummary,
  type ConflictChoices,
  type ConflictSectionKey,
} from "../domain/conflict-resolution";
import type { CaseSyncConflict } from "../data/case-repository";

const stateLabels = {
  local: "Local only",
  "signed-out": "Connect sync",
  quiet: "Remote ready",
  synchronizing: "Synchronizing",
  conflict: "Conflict",
  error: "Sync paused",
};

export function SyncControl() {
  const {
    configured,
    user,
    state,
    detail,
    conflicts,
    sendMagicLink,
    signOut,
    synchronize,
    resolveConflict,
    useRemoteConflict,
  } = useSync();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [activeConflict, setActiveConflict] = useState<CaseSyncConflict | null>(null);
  const [choices, setChoices] = useState<ConflictChoices>({});

  if (!configured) {
    return (
      <span className="sync-indicator sync-indicator--local" title={detail}>
        <i aria-hidden="true" />
        Local only
      </span>
    );
  }

  async function requestLink(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    try {
      await sendMagicLink(email);
      setNotice("A sign-in link is on its way. You can close this sheet.");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Sign-in could not begin.");
    }
  }

  function inspectConflict(conflict: CaseSyncConflict) {
    const initial: ConflictChoices = {};
    for (const key of changedConflictSections(conflict.local, conflict.remote)) {
      initial[key] = "local";
    }
    setChoices(initial);
    setActiveConflict(conflict);
  }

  function choose(key: ConflictSectionKey, value: "local" | "remote") {
    setChoices((current) => ({ ...current, [key]: value }));
  }

  async function saveResolution() {
    if (!activeConflict) return;
    await resolveConflict(activeConflict, choices);
    setActiveConflict(null);
  }

  return (
    <DialogTrigger>
      <Button className={`sync-indicator sync-indicator--${state}`}>
        <i aria-hidden="true" />
        {stateLabels[state]}
      </Button>
      <ModalOverlay className="modal-overlay" isDismissable>
        <Modal className="modal modal--sync">
          <Dialog className="sync-dialog">
            {({ close }) => (
              <>
                {activeConflict ? (
                  <ConflictReview
                    conflict={activeConflict}
                    choices={choices}
                    onChoose={choose}
                    onBack={() => setActiveConflict(null)}
                    onUseRemote={async () => {
                      await useRemoteConflict(activeConflict);
                      setActiveConflict(null);
                    }}
                    onSave={saveResolution}
                  />
                ) : (
                  <>
                    <p className="dialog-index">REMOTE REPLICA / OPTIONAL</p>
                    <Heading slot="title">
                      {user ? "Reconcile the ledger." : "Connect your ledger."}
                    </Heading>
                {user ? (
                  <>
                    <p className="sync-dialog__identity">{user.email}</p>
                    <p>{detail}</p>
                    {conflicts.length > 0 && (
                      <div className="conflict-index">
                        <p className="sync-dialog__warning">
                          Local and remote work diverged. Neither version has been
                          overwritten.
                        </p>
                        {conflicts.map((conflict) => (
                          <button
                            className="conflict-index__row"
                            key={conflict.caseId}
                            type="button"
                            onClick={() => inspectConflict(conflict)}
                          >
                            <span>
                              <strong>{conflict.local.title}</strong>
                              <small>
                                Local r{conflict.local.revision} · Remote r{conflict.remote.revision}
                              </small>
                            </span>
                            <b>Review →</b>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="dialog-actions dialog-actions--spread">
                      <Button className="quiet-button" onPress={() => void signOut()}>
                        Sign out
                      </Button>
                      <div>
                        <Button className="quiet-button" onPress={close}>
                          Close
                        </Button>
                        <Button
                          className="action-button"
                          isDisabled={state === "synchronizing"}
                          onPress={() => void synchronize()}
                        >
                          Synchronize now
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <form onSubmit={requestLink}>
                    <p>
                      Use a private email link. Local records remain available even
                      when remote synchronization is disconnected.
                    </p>
                    <TextField
                      type="email"
                      isRequired
                      value={email}
                      onChange={setEmail}
                    >
                      <Label>Email address</Label>
                      <Input autoFocus placeholder="you@example.com" />
                    </TextField>
                    {notice && <p className="sync-dialog__notice" role="status">{notice}</p>}
                    <div className="dialog-actions">
                      <Button className="quiet-button" onPress={close}>
                        Keep local
                      </Button>
                      <Button type="submit" className="action-button">
                        Send private link
                      </Button>
                    </div>
                  </form>
                )}
                  </>
                )}
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

interface ConflictReviewProps {
  conflict: CaseSyncConflict;
  choices: ConflictChoices;
  onChoose(key: ConflictSectionKey, value: "local" | "remote"): void;
  onBack(): void;
  onUseRemote(): Promise<void>;
  onSave(): Promise<void>;
}

function ConflictReview({
  conflict,
  choices,
  onChoose,
  onBack,
  onUseRemote,
  onSave,
}: ConflictReviewProps) {
  const changed = new Set(changedConflictSections(conflict.local, conflict.remote));

  return (
    <div className="conflict-review">
      <p className="dialog-index">REVISION REVIEW / {conflict.local.title}</p>
      <Heading slot="title">Choose what survives.</Heading>
      <p>
        Compare the work by section. Your resolution becomes a new revision; the
        two source records remain untouched until you decide.
      </p>
      <div className="conflict-review__legend" aria-hidden="true">
        <span>On this device · r{conflict.local.revision}</span>
        <span>Remote copy · r{conflict.remote.revision}</span>
      </div>
      <div className="conflict-review__sections">
        {conflictSections.filter(({ key }) => changed.has(key)).map(({ key, label }) => (
          <section className="conflict-section" key={key}>
            <h3>{label}</h3>
            <button
              type="button"
              className={choices[key] !== "remote" ? "is-selected" : ""}
              aria-pressed={choices[key] !== "remote"}
              onClick={() => onChoose(key, "local")}
            >
              <small>On this device</small>
              <span>{conflictSectionSummary(conflict.local, key)}</span>
            </button>
            <button
              type="button"
              className={choices[key] === "remote" ? "is-selected" : ""}
              aria-pressed={choices[key] === "remote"}
              onClick={() => onChoose(key, "remote")}
            >
              <small>Remote copy</small>
              <span>{conflictSectionSummary(conflict.remote, key)}</span>
            </button>
          </section>
        ))}
      </div>
      <div className="conflict-review__remote">
        <button type="button" onClick={() => void onUseRemote()}>
          Accept the complete remote revision instead
        </button>
      </div>
      <div className="dialog-actions dialog-actions--spread">
        <Button className="quiet-button" onPress={onBack}>Back</Button>
        <Button className="action-button" onPress={() => void onSave()}>
          Record resolution
        </Button>
      </div>
    </div>
  );
}
