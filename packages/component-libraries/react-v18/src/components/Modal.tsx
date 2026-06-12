import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  HTMLAttributes,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  RefObject
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import "../design-system/components/modal.css";

export type ModalProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Controls the visibility of the modal. */
  open: boolean;
  /** Invoked when the modal should close (overlay click, escape key). */
  onClose: () => void;
  /** Modal content. Ensure focusable controls are present for accessibility. */
  children: ReactNode;
  /** Optional class for the overlay element. */
  overlayClassName?: string;
  /** Whether clicking the overlay should dismiss the modal. */
  closeOnOverlayClick?: boolean;
  /** Optional ref for defining the initial focus target when the modal opens. */
  initialFocusRef?: RefObject<HTMLElement>;
};

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable]"
].join(",");

export function Modal({
  open,
  onClose,
  children,
  className,
  overlayClassName,
  closeOnOverlayClick = true,
  initialFocusRef,
  ...rest
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  const portalTarget = useMemo(() => {
    if (typeof document === "undefined") {
      return null;
    }

    const node = document.createElement("div");
    node.dataset.modalRoot = "";
    return node;
  }, []);

  useEffect(() => {
    if (!open || !portalTarget || typeof document === "undefined") {
      return;
    }

    document.body.appendChild(portalTarget);

    return () => {
      document.body.removeChild(portalTarget);
    };
  }, [open, portalTarget]);

  const focusFirstElement = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const target = initialFocusRef?.current ?? dialog;
    target.focus({ preventScroll: true });
  }, [initialFocusRef]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (typeof document !== "undefined") {
      lastFocusedElement.current = document.activeElement as HTMLElement | null;
    }

    focusFirstElement();

    return () => {
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus?.({ preventScroll: true });
      }
    };
  }, [focusFirstElement, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const active = document.activeElement as HTMLElement | null;
      const currentIndex = active ? focusable.indexOf(active) : -1;
      const lastIndex = focusable.length - 1;
      const movingBackward = event.shiftKey;

      event.preventDefault();

      if (movingBackward) {
        const nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1;
        const target = focusable[nextIndex] ?? focusable[lastIndex] ?? dialog;
        target.focus({ preventScroll: true });
        return;
      }

      const nextIndex = currentIndex === -1 || currentIndex === lastIndex ? 0 : currentIndex + 1;
      const target = focusable[nextIndex] ?? focusable[0] ?? dialog;
      target.focus({ preventScroll: true });
      return;
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const handleOverlayClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!closeOnOverlayClick) {
        return;
      }

      if (event.target === overlayRef.current) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  if (!open || !portalTarget) {
    return null;
  }

  const dialog = (
    <div
      ref={overlayRef}
      className={clsx("modal-overlay", overlayClassName)}
      data-testid="modal-overlay"
      onMouseDown={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        {...rest}
        ref={dialogRef}
        className={clsx("modal", className)}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(dialog, portalTarget);
}
