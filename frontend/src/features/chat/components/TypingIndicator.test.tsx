import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator Component', () => {
  it('renders nothing when the users array is empty', () => {
    const { container } = render(<TypingIndicator users={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('displays correctly for a single user', () => {
    render(<TypingIndicator users={['Bob']} />);
    expect(screen.getByText(/Bob is typing/i)).toBeInTheDocument();
  });

  it('displays correctly for multiple users', () => {
    render(<TypingIndicator users={['Bob', 'Alice']} />);
    expect(screen.getByText(/Bob, Alice are typing/i)).toBeInTheDocument();
  });
});
