import { useCallback, useEffect, useRef, type RefObject, type TouchEvent } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseModalSheetOptions {
  isOpen: boolean;
  onClose: () => void;
  dialogRef: RefObject<HTMLDivElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
}

interface UseModalSheetResult {
  sheetTouchHandlers: {
    onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
    onTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
    onTouchEnd: () => void;
    onTouchCancel: () => void;
  };
}

/**
 * Shared accessible bottom-sheet & dialog controller:
 * - Locks background page scrolling while open
 * - Moves focus into the dialog and restores previous focus on close
 * - Traps Tab / Shift+Tab keyboard focus inside the dialog (WCAG 2.1 AA)
 * - Closes cleanly on Escape
 * - Supports 60/120fps zero-re-render mobile swipe-down-to-dismiss via CSS variable
 */
export function useModalSheet({
  isOpen,
  onClose,
  dialogRef,
  initialFocusRef,
}: UseModalSheetOptions): UseModalSheetResult {
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const dragOffsetYRef = useRef<number>(0);
  const draggingActiveRef = useRef(false);

  const resetSheetDrag = useCallback(() => {
    const sheet = dialogRef.current;
    if (sheet) {
      sheet.classList.remove('isonil-sheet-dragging');
      sheet.style.removeProperty('--isonil-sheet-drag-y');
    }
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    dragOffsetYRef.current = 0;
    draggingActiveRef.current = false;
  }, [dialogRef]);

  useEffect(() => {
    if (!isOpen) {
      resetSheetDrag();
      return;
    }

    const previousFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => {
      initialFocusRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialogRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      resetSheetDrag();
      previousFocused?.focus();
    };
  }, [isOpen, onClose, dialogRef, initialFocusRef, resetSheetDrag]);

  const onTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (typeof window !== 'undefined' && window.innerWidth >= 640) return;
      if (event.touches.length !== 1) return;
      const sheet = dialogRef.current;
      if (!sheet || sheet.scrollTop > 2) return;

      touchStartYRef.current = event.touches[0].clientY;
      touchStartXRef.current = event.touches[0].clientX;
      dragOffsetYRef.current = 0;
      draggingActiveRef.current = false;
    },
    [dialogRef]
  );

  const onTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (touchStartYRef.current === null || touchStartXRef.current === null) return;
      if (event.touches.length !== 1) return;

      const sheet = dialogRef.current;
      if (!sheet) return;

      const deltaY = event.touches[0].clientY - touchStartYRef.current;
      const deltaX = Math.abs(event.touches[0].clientX - touchStartXRef.current);

      if (!draggingActiveRef.current) {
        if (deltaY > 8 && deltaY > deltaX * 1.25) {
          draggingActiveRef.current = true;
          sheet.classList.add('isonil-sheet-dragging');
        } else if (deltaY < -4 || deltaX > 12) {
          touchStartYRef.current = null;
          touchStartXRef.current = null;
          return;
        }
      }

      if (draggingActiveRef.current) {
        const clamped = Math.max(0, Math.min(deltaY, 220));
        dragOffsetYRef.current = clamped;
        sheet.style.setProperty('--isonil-sheet-drag-y', `${clamped}px`);
      }
    },
    [dialogRef]
  );

  const finishDrag = useCallback(() => {
    const shouldClose = draggingActiveRef.current && dragOffsetYRef.current > 76;
    resetSheetDrag();
    if (shouldClose) {
      onClose();
    }
  }, [onClose, resetSheetDrag]);

  return {
    sheetTouchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd: finishDrag,
      onTouchCancel: finishDrag,
    },
  };
}
