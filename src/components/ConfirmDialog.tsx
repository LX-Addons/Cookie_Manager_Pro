import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface ConfirmDialogProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description?: string;
  readonly message: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly variant?: "danger" | "warning" | "info" | "success";
}

const getIconForVariant = (variant: string) => {
  switch (variant) {
    case "danger":
      return "!";
    case "warning":
      return "!";
    case "success":
      return "✓";
    case "info":
    default:
      return "i";
  }
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = "warning",
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "danger":
        return "btn-danger";
      case "success":
        return "btn-success";
      case "info":
        return "btn-primary";
      case "warning":
      default:
        return "btn-warning";
    }
  };

  return (
    <div
      className="overlay-backdrop"
      onClick={handleOverlayClick}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      role="presentation"
    >
      <div
        className="modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-body"
      >
        <div className="modal-header">
          <div className={`modal-icon ${variant}`}>{getIconForVariant(variant)}</div>
          <div className="modal-title-section">
            <h3 id="modal-title" className="modal-title">
              {title}
            </h3>
            {description && <p className="modal-description">{description}</p>}
          </div>
        </div>
        <div className="modal-body">
          <p id="modal-body" className="modal-body-text">
            {message}
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText ?? t("common.cancel")}
          </button>
          <button
            ref={confirmBtnRef}
            className={`btn ${getConfirmButtonClass()}`}
            onClick={onConfirm}
          >
            {confirmText ?? t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
