"use client";

import { CircleHelp, ShieldAlert, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type ContextHelpProps = {
  title: string;
  summary: string;
  details?: string[];
  note?: string;
  label?: string;
  className?: string;
};

export function ContextHelp({ title, summary, details = [], note, label = "Learn what this means", className = "" }: ContextHelpProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className={`context-help ${className}`.trim()}>
      <button
        type="button"
        className="context-help__trigger"
        aria-label={`${label}: ${title}`}
        aria-describedby={tooltipId}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <CircleHelp size={15} aria-hidden="true" />
      </button>
      <span className="context-help__tooltip" id={tooltipId} role="tooltip">
        <strong>{title}</strong>
        <span>{summary}</span>
        <small>Open for details</small>
      </span>
      {open && (
        <ModalShell title={title} eyebrow="How CandidRoute uses this" onClose={() => setOpen(false)}>
          <p className="context-modal__summary">{summary}</p>
          {details.length > 0 && (
            <ul className="context-modal__list">
              {details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
          )}
          {note && <div className="context-modal__note"><ShieldAlert size={17} /><p>{note}</p></div>}
        </ModalShell>
      )}
    </span>
  );
}

type ModalShellProps = {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: "compact" | "wide";
};

export function ModalShell({ title, eyebrow, onClose, children, footer, width = "compact" }: ModalShellProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousActive?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="context-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`context-modal context-modal--${width}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header>
          <div>{eyebrow && <span className="product-eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
        </header>
        <div className="context-modal__body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>,
    document.body
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  summary: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  busy?: boolean;
  consequences?: string[];
};

export function ConfirmDialog({ open, title, summary, confirmLabel, onConfirm, onClose, busy = false, consequences = [] }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <ModalShell
      title={title}
      eyebrow="Confirm consequential action"
      onClose={() => !busy && onClose()}
      footer={<><button type="button" className="product-button product-button--secondary" disabled={busy} onClick={onClose}>Cancel</button><button type="button" className="product-button product-button--primary" disabled={busy} onClick={() => void onConfirm()}>{busy ? "Publishing…" : confirmLabel}</button></>}
    >
      <p className="context-modal__summary">{summary}</p>
      {consequences.length > 0 && <ul className="context-modal__list">{consequences.map((item) => <li key={item}>{item}</li>)}</ul>}
    </ModalShell>
  );
}
