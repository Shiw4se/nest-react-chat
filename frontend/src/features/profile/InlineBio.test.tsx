import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '../../config/i18n';
import { InlineBio } from './InlineBio';

const openEditor = async (value: string | null = 'Old bio') => {
  const onSave = vi.fn().mockResolvedValue(true);
  render(<InlineBio value={value} onSave={onSave} />);
  await userEvent.click(screen.getByRole('button', { name: /about/i }));
  const textarea = screen.getByRole('textbox', { name: /about/i });
  return { onSave, textarea };
};

describe('InlineBio', () => {
  it('focuses the field with the cursor at the end on click', async () => {
    const { textarea } = await openEditor('Old bio');
    expect(textarea).toHaveFocus();
    expect((textarea as HTMLTextAreaElement).selectionStart).toBe('Old bio'.length);
  });

  it('saves on Enter', async () => {
    const { onSave, textarea } = await openEditor();
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'New bio{Enter}');

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('New bio');
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
  });

  it('keeps Shift+Enter as a line break', async () => {
    const { onSave, textarea } = await openEditor('');
    await userEvent.type(textarea, 'line 1{Shift>}{Enter}{/Shift}line 2');
    expect(onSave).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('line 1\nline 2');
  });

  it('cancels on Escape without saving', async () => {
    const { onSave, textarea } = await openEditor();
    await userEvent.type(textarea, ' changed{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Old bio')).toBeInTheDocument();
  });

  it('saves when focus leaves the field, once', async () => {
    const { onSave, textarea } = await openEditor();
    await userEvent.type(textarea, '!');
    fireEvent.blur(textarea);
    fireEvent.blur(textarea);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith('Old bio!');
  });

  it('does not call the API when nothing changed', async () => {
    const { onSave, textarea } = await openEditor();
    fireEvent.blur(textarea);
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('stays open with the draft when saving fails', async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    render(<InlineBio value="Old bio" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /about/i }));
    const textarea = screen.getByRole('textbox', { name: /about/i });
    await userEvent.type(textarea, '!{Enter}');

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(screen.getByRole('textbox')).toHaveValue('Old bio!');
  });
});
