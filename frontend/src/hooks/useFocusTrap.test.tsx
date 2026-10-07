import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

const Dialog = ({ onClose }: { onClose: () => void }) => {
  const ref = useFocusTrap(true, onClose);
  return (
    <div ref={ref}>
      <button>plain</button>
      <textarea aria-label="inline" data-own-escape />
    </div>
  );
};

describe('useFocusTrap Escape handling', () => {
  it('closes on Escape from a regular element', () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    fireEvent.keyDown(screen.getByText('plain'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves Escape to elements marked data-own-escape', () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    fireEvent.keyDown(screen.getByLabelText('inline'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
