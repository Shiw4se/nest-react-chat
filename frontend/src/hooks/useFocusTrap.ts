import { useEffect, useRef } from 'react';
import { FOCUSABLE_ELEMENTS } from '../constants/a11y';

export const useFocusTrap = (isOpen: boolean, onClose: () => void) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    const getFocusableElements = () => {
      return modalElement.querySelectorAll<HTMLElement>(
        FOCUSABLE_ELEMENTS.join(', ')
      );
    };

    const initialElements = getFocusableElements();
    if (initialElements.length > 0 && !modalElement.contains(document.activeElement)) {
      initialElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const elements = getFocusableElements();
        if (elements.length === 0) return;

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        if (!modalElement.contains(document.activeElement)) {
          firstElement.focus();
          e.preventDefault();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose]); 

  return modalRef;
};