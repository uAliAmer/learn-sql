import { useState } from "react";

interface Props {
  initial: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/** A small dedicated modal for entering (and locking) the certificate name. */
export function NameModal({ initial, onSubmit, onClose }: Props) {
  const [value, setValue] = useState(initial);
  const trimmed = value.trim();

  const submit = () => {
    if (!trimmed) return;
    if (
      window.confirm(
        `Issue the certificate to "${trimmed}"?\n\nThis name is locked once confirmed and cannot be changed.`,
      )
    ) {
      onSubmit(trimmed);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__card modal__card--narrow" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>🎓 Claim your certificate</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="muted">
          Enter the name to print on your certificate. It's{" "}
          <strong>locked once confirmed</strong> and can't be changed.
        </p>
        <label className="modal__name">
          Your name
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. Ali Amer"
            maxLength={40}
            autoFocus
          />
        </label>
        <div className="modal__actions">
          <button className="btn btn--primary" disabled={!trimmed} onClick={submit}>
            ✓ Confirm &amp; continue
          </button>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
