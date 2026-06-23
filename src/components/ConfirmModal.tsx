import type { ReactNode } from "react";

interface Props {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Generic in-app confirmation dialog (replaces window.confirm). */
export function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }: Props) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__card modal__card--narrow" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="confirm-box">{message}</div>
        <div className="modal__actions">
          <button className="btn btn--danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
