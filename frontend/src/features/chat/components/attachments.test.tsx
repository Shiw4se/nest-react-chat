import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, it, expect, vi } from 'vitest';
import '../../../config/i18n';
import { Composer } from './Composer';
import { AttachmentDialog } from './AttachmentDialog';
import { MessageBubble } from '../../../components/ui/MessageBubble';
import { Lightbox } from '../../../components/ui/Lightbox';
import { imageFileError, firstImage } from '../../../utils/imageFile';
import { messagesService } from '../../../api/services/messagesService';
import type { ChatMessage } from '../../../types/chat';

vi.mock('../../../api/services/messagesService', () => ({
  messagesService: { uploadAttachment: vi.fn() },
}));

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

const png = new File(['x'], 'cat.png', { type: 'image/png' });

describe('imageFile', () => {
  it('accepts images and rejects other types or oversized files', () => {
    expect(imageFileError(png)).toBeNull();
    expect(imageFileError(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe('attachment.type_error');
    const big = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 });
    expect(imageFileError(big)).toBe('attachment.size_error');
  });

  it('picks the first image from a mixed list', () => {
    const txt = new File(['x'], 'a.txt', { type: 'text/plain' });
    expect(firstImage([txt, png])).toBe(png);
    expect(firstImage([txt])).toBeNull();
  });
});

describe('Composer attachments', () => {
  const props = {
    mode: null,
    onSend: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelMode: vi.fn(),
    onEditLast: vi.fn(),
    onTyping: vi.fn(),
  };

  it('hands a chosen file to onPickFile', () => {
    const onPickFile = vi.fn();
    render(<Composer {...props} onPickFile={onPickFile} />);
    fireEvent.change(screen.getByTestId('attach-input'), { target: { files: [png] } });
    expect(onPickFile).toHaveBeenCalledWith(png);
  });

  it('turns a pasted image into an attachment', () => {
    const onPickFile = vi.fn();
    render(<Composer {...props} onPickFile={onPickFile} />);
    fireEvent.paste(screen.getByRole('textbox'), { clipboardData: { files: [png] } });
    expect(onPickFile).toHaveBeenCalledWith(png);
  });
});

describe('AttachmentDialog', () => {
  it('uploads with caption and reply target, then reports success', async () => {
    vi.mocked(messagesService.uploadAttachment).mockResolvedValue({} as ChatMessage);
    const onSent = vi.fn();
    const replyTo = {
      id: '11111111-1111-4111-8111-111111111111',
      message: 'q',
      roomId: 'r1',
      userId: 'u2',
      user: { username: 'bob' },
      createdAt: '2026-10-07T10:00:00Z',
    };
    render(<AttachmentDialog roomId="r1" file={png} replyTo={replyTo} onClose={vi.fn()} onSent={onSent} />);

    expect(screen.getByText('Reply to bob')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), 'My cat{Enter}');

    await waitFor(() => expect(onSent).toHaveBeenCalled());
    expect(messagesService.uploadAttachment).toHaveBeenCalledWith(
      'r1',
      png,
      expect.objectContaining({ caption: 'My cat', replyToId: replyTo.id }),
    );
  });
});

describe('MessageBubble image', () => {
  const photo: ChatMessage = {
    id: 'm1',
    message: '',
    roomId: 'r1',
    userId: 'u2',
    user: { username: 'bob' },
    createdAt: '2026-10-07T10:00:00Z',
    attachmentUrl: '/uploads/attachments/x.webp',
    attachmentWidth: 800,
    attachmentHeight: 600,
  };

  it('renders the photo with its aspect ratio and opens it on click', () => {
    const onImageClick = vi.fn();
    const { container } = render(<MessageBubble message={photo} isMe={false} onImageClick={onImageClick} />);
    const img = container.querySelector('img[src$="/uploads/attachments/x.webp"]') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.style.aspectRatio).toBe('800 / 600');

    fireEvent.click(screen.getByRole('button', { name: 'Photo' }));
    expect(onImageClick).toHaveBeenCalledWith(expect.stringContaining('/uploads/attachments/x.webp'));
  });
});

describe('Lightbox', () => {
  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<Lightbox src="blob:x" onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
