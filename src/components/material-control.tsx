import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Label,
  Modal,
  ModalOverlay,
  Radio,
  RadioGroup,
} from "react-aria-components";
import {
  useMaterial,
  type MaterialMode,
} from "../app/material-context";

const materials: ReadonlyArray<{
  id: MaterialMode;
  name: string;
  description: string;
}> = [
  {
    id: "clear",
    name: "Clear",
    description: "Flat colour and sharp rules. No simulated grain.",
  },
  {
    id: "paper",
    name: "Paper",
    description: "Quiet tooth and restrained tonal variation.",
  },
  {
    id: "fibre",
    name: "Fibre",
    description: "More visible directional fibres and uneven pigment.",
  },
];

export function MaterialControl({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useMaterial();
  const current = materials.find(({ id }) => id === mode) ?? materials[1];

  return (
    <DialogTrigger>
      <Button
        className={`material-trigger${compact ? " material-trigger--compact" : ""}`}
        aria-label={`Surface material: ${current.name}`}
      >
        <i aria-hidden="true" />
        {!compact && <span>Surface / {current.name}</span>}
      </Button>
      <ModalOverlay className="modal-overlay" isDismissable>
        <Modal className="modal modal--material">
          <Dialog className="material-dialog">
            {({ close }) => (
              <>
                <p className="dialog-index">RENDERING / LOCAL PREFERENCE</p>
                <Heading slot="title">Choose the surface.</Heading>
                <p>
                  Material changes atmosphere, never the case content. The
                  preference stays in this browser.
                </p>
                <RadioGroup
                  value={mode}
                  onChange={(next) => setMode(next as MaterialMode)}
                  aria-label="Surface material"
                  className="material-choices"
                >
                  {materials.map((material, index) => (
                    <Radio key={material.id} value={material.id}>
                      {({ isSelected }) => (
                        <>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <div>
                            <Label>{material.name}</Label>
                            <p>{material.description}</p>
                          </div>
                          <i aria-hidden="true">{isSelected ? "●" : "○"}</i>
                        </>
                      )}
                    </Radio>
                  ))}
                </RadioGroup>
                <div className="dialog-actions">
                  <Button className="action-button" onPress={close}>
                    Keep this surface
                  </Button>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
