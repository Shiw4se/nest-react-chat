import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '../../config/i18n';
import { EditProfileForm } from './EditProfileForm';
import { Avatar } from '../../components/ui/Avatar';
import type { UserProfile } from '../../types/user';

const profile: UserProfile = {
  id: 'u1',
  username: 'ann',
  displayName: null,
  bio: null,
  avatarUrl: null,
  lastSeenAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  stats: { rooms: 0, ownedRooms: 0, messages: 0 },
};

beforeAll(() => {
  // jsdom has no object URLs
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

const renderForm = (overrides: Partial<UserProfile> = {}) => {
  const onUploadAvatar = vi.fn().mockResolvedValue(undefined);
  const onRemoveAvatar = vi.fn().mockResolvedValue(undefined);
  render(
    <EditProfileForm
      profile={{ ...profile, ...overrides }}
      onSave={vi.fn()}
      onUploadAvatar={onUploadAvatar}
      onRemoveAvatar={onRemoveAvatar}
      onCancel={vi.fn()}
    />,
  );
  return { onUploadAvatar, onRemoveAvatar, input: screen.getByTestId('avatar-input') };
};

const pick = (input: HTMLElement, file: File) => fireEvent.change(input, { target: { files: [file] } });

describe('EditProfileForm avatar', () => {
  it('uploads a valid image', async () => {
    const { onUploadAvatar, input } = renderForm();
    const file = new File(['x'], 'me.png', { type: 'image/png' });

    pick(input, file);

    await waitFor(() => expect(onUploadAvatar).toHaveBeenCalledWith(file));
  });

  it('rejects unsupported types and oversized files without uploading', () => {
    const { onUploadAvatar, input } = renderForm();

    pick(input, new File(['x'], 'doc.pdf', { type: 'application/pdf' }));
    const big = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
    pick(input, big);

    expect(onUploadAvatar).not.toHaveBeenCalled();
  });

  it('offers removal only when a photo exists', () => {
    renderForm();
    expect(screen.queryByRole('button', { name: /^remove$/i })).toBeNull();
  });

  it('removes an existing photo', async () => {
    const { onRemoveAvatar } = renderForm({ avatarUrl: '/uploads/avatars/a.webp' });
    fireEvent.click(screen.getByRole('button', { name: /^remove$/i }));
    await waitFor(() => expect(onRemoveAvatar).toHaveBeenCalled());
  });
});

describe('Avatar', () => {
  it('falls back to initials when the photo fails to load', () => {
    const { container } = render(<Avatar name="Ann Kim" src="/uploads/avatars/broken.webp" />);
    const img = container.querySelector('img')!;
    expect(img).toBeTruthy();

    fireEvent.error(img);

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('AK');
  });
});
