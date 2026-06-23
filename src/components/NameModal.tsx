import { useState } from "react";

interface Props {
  initial: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/** Dedicated modal for entering + confirming (locking) the certificate name. */
export function NameModal({ initial, onSubmit, onClose }: Props) {
  const [value, setValue] = useState(initial);
  const [confirming, setConfirming] = useState(false);
  const trimmed = value.trim();

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__card modal__card--narrow" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>🎓 Claim your certificate</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {confirming ? (
          <>
            <div className="confirm-box">
              Issue the certificate to
              <div className="confirm-box__name">{trimmed}</div>
              This name is <strong>locked once confirmed</strong> and cannot be changed.
            </div>
            <div className="modal__actions">
              <button className="btn btn--primary" onClick={() => onSubmit(trimmed)}>
                ✓ Yes, lock it in
              </button>
              <button className="btn btn--ghost" onClick={() => setConfirming(false)}>
                ← Edit name
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">
              Enter the name to print on your certificate. It's{" "}
              <strong>locked once confirmed</strong> and can't be changed.
            </p>
            <label className="modal__name">
              Your name
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && trimmed && setConfirming(true)}
                placeholder="e.g. Ali Amer"
                maxLength={40}
                autoFocus
              />
            </label>
            <div className="modal__actions">
              <button
                className="btn btn--primary"
                disabled={!trimmed}
                onClick={() => setConfirming(true)}
              >
                Continue →
              </button>
              <button className="btn btn--ghost" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
