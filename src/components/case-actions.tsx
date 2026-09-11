import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { useCases } from "../app/cases-context";
import type { ChangeCase } from "../domain/case";
import { downloadCase } from "../services/case-file";

export function CaseActions({ value }: { value: ChangeCase }) {
  const { duplicateCase, saveCase, deleteCase } = useCases();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const archived = value.status === "archived";

  async function duplicate() {
    const created = await duplicateCase(value);
    await navigate({ to: "/cases/$caseId", params: { caseId: created.id } });
  }

  async function changeArchiveState() {
    await saveCase({
      ...value,
      status: archived ? "active" : "archived",
    });
  }

  async function remove() {
    await deleteCase(value.id);
    setDeleteOpen(false);
    await navigate({ to: "/" });
  }

  return (
    <div className="case-actions">
      <button type="button" onClick={() => downloadCase(value)}>
        Export record ↓
      </button>
      <button type="button" onClick={() => void duplicate()}>
        Make working copy ↗
      </button>
      <button type="button" onClick={() => void changeArchiveState()}>
        {archived ? "Return to motion ↑" : "Move to archive →"}
      </button>

      <DialogTrigger isOpen={deleteOpen} onOpenChange={setDeleteOpen}>
        <Button className="case-actions__delete">Remove permanently</Button>
        <ModalOverlay className="modal-overlay" isDismissable>
          <Modal className="modal modal--decision">
            <Dialog className="delete-dialog">
              {({ close }) => (
                <>
                  <p className="dialog-index">IRREVERSIBLE / DELETE</p>
                  <Heading slot="title">Remove this case?</Heading>
                  <blockquote>{value.title}</blockquote>
                  <p>
                    Export the record first if any part of this case may be useful
                    later. Removal cannot be undone.
                  </p>
                  <div className="dialog-actions">
                    <Button className="quiet-button" onPress={close}>
                      Keep case
                    </Button>
                    <Button className="destructive-button" onPress={() => void remove()}>
                      Remove permanently
                    </Button>
                  </div>
                </>
              )}
            </Dialog>
          </Modal>
        </ModalOverlay>
      </DialogTrigger>
    </div>
  );
}
