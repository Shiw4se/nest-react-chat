import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageBubble } from './MessageBubble';

describe('MessageBubble Component', () => {
  const mockMsg = { message: 'Test message content', user: { username: 'Alice' } };

  it('renders an incoming message correctly', () => {
    render(<MessageBubble message={mockMsg as any} isMe={false} />);
    
    expect(screen.getByText('Test message content')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    
    const bubble = screen.getByText('Test message content');
    expect(bubble.className).toContain('bg-slate-700'); 
  });

  it('renders an outgoing message correctly (isMe=true)', () => {
    render(<MessageBubble message={mockMsg as any} isMe={true} />);
    
    const bubble = screen.getByText('Test message content');
    expect(bubble.className).toContain('bg-blue-600');
  });
});