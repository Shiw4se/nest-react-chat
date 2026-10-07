import { bubble, expect, openRoom, send, test, TINY_PNG } from './fixtures';
import { createRoom, deleteRoom } from './api';

test.describe('real-time chat between two users', () => {
  test('messages, typing, replies, edits and reactions arrive live', async ({ alice, bob, users }) => {
    const room = await createRoom(users.alice, `Live ${Date.now().toString(36)}`);
    try {
      await alice.reload();
      await openRoom(alice, room.name);
      await openRoom(bob, room.name, 'Public');

      await test.step('message is delivered instantly', async () => {
        await send(alice, 'Hi Bob, can you hear me?');
        await expect(bubble(bob, 'Hi Bob, can you hear me?')).toBeVisible();
      });

      await test.step('typing indicator shows up for the other side', async () => {
        await bob.getByRole('textbox', { name: 'Type a message' }).pressSequentially('typing');
        await expect(alice.getByText(`${users.bob.username} is typing`).first()).toBeVisible();
        await bob.getByRole('textbox', { name: 'Type a message' }).fill('');
      });

      await test.step('reply quotes the original', async () => {
        await bubble(bob, 'Hi Bob').hover();
        await bob.getByRole('button', { name: 'Reply' }).first().click();
        await expect(bob.getByTestId('composer-mode')).toContainText(`Reply to ${users.alice.username}`);
        await send(bob, 'Loud and clear');

        const reply = bubble(alice, 'Loud and clear');
        await expect(reply).toContainText('Hi Bob, can you hear me?');
      });

      await test.step('edit shows the new text and an "edited" label', async () => {
        await bubble(bob, 'Loud and clear').hover();
        await bob.getByRole('button', { name: 'Edit' }).click();
        const input = bob.getByRole('textbox', { name: 'Type a message' });
        await expect(input).toHaveValue('Loud and clear');
        await input.fill('Loud and clear 👍');
        await input.press('Enter');

        await expect(bubble(alice, 'Loud and clear 👍')).toContainText('edited');
      });

      await test.step('reaction appears for both users', async () => {
        await bubble(alice, 'Loud and clear 👍').hover();
        await alice.getByRole('button', { name: 'React' }).first().click();
        await alice.getByRole('menuitem', { name: '🔥' }).click();

        await expect(bob.getByRole('button', { name: '🔥, 1 reaction' })).toBeVisible();
        await expect(alice.getByRole('button', { name: '🔥, 1 reaction' })).toHaveAttribute('aria-pressed', 'true');
      });

      await test.step('deleting removes the message for everyone', async () => {
        await send(alice, 'This will vanish');
        await expect(bubble(bob, 'This will vanish')).toBeVisible();
        await bubble(alice, 'This will vanish').hover();
        await alice.getByRole('button', { name: 'Delete' }).last().click();
        await expect(bubble(bob, 'This will vanish')).toHaveCount(0);
      });
    } finally {
      await deleteRoom(users.alice, room.id);
    }
  });

  test('unread badge counts messages in rooms that are not open', async ({ alice, bob, users }) => {
    const suffix = Date.now().toString(36);
    const busy = await createRoom(users.alice, `Busy ${suffix}`);
    const quiet = await createRoom(users.alice, `Quiet ${suffix}`);
    try {
      // Bob joins Busy (becomes a member), then looks at another room
      await openRoom(bob, busy.name, 'Public');
      await openRoom(bob, quiet.name, 'Public');
      await bob.getByRole('tab', { name: /^My Chats/ }).click();

      await alice.reload();
      await openRoom(alice, busy.name);
      await send(alice, 'one');
      await send(alice, 'two');

      const busyRow = bob.getByRole('button', { name: `${busy.name}, 2 unread messages` });
      await expect(busyRow).toBeVisible();
      await expect(busyRow).toContainText(`${users.alice.username}: two`);
      await expect(bob).toHaveTitle('(2) Chat');

      await busyRow.click();
      await expect(bob).toHaveTitle('Chat');
    } finally {
      await deleteRoom(users.alice, busy.id);
      await deleteRoom(users.alice, quiet.id);
    }
  });

  test('a photo with caption reaches the other user', async ({ alice, bob, users }) => {
    const room = await createRoom(users.alice, `Photos ${Date.now().toString(36)}`);
    try {
      await alice.reload();
      await openRoom(alice, room.name);
      await openRoom(bob, room.name, 'Public');

      await alice.getByTestId('attach-input').setInputFiles({
        name: 'dot.png',
        mimeType: 'image/png',
        buffer: TINY_PNG,
      });
      const dialog = alice.getByRole('dialog', { name: 'Send photo' });
      await dialog.getByRole('textbox').fill('Tiny but mighty');
      await dialog.getByRole('button', { name: 'Send' }).click();
      await expect(dialog).toBeHidden();

      const photo = bubble(bob, 'Tiny but mighty');
      await expect(photo.locator('img[src*="/attachments/"]')).toBeVisible();

      await photo.getByRole('button', { name: 'Photo' }).click();
      await expect(bob.getByRole('dialog', { name: 'Image viewer' })).toBeVisible();
      await bob.keyboard.press('Escape');
      await expect(bob.getByRole('dialog', { name: 'Image viewer' })).toBeHidden();
    } finally {
      await deleteRoom(users.alice, room.id);
    }
  });

  test('presence: the other member is shown online', async ({ alice, bob, users }) => {
    const room = await createRoom(users.alice, `Presence ${Date.now().toString(36)}`);
    try {
      await openRoom(bob, room.name, 'Public');
      await alice.reload();
      await openRoom(alice, room.name);

      await alice.getByRole('button', { name: 'Open room info' }).click();
      const member = alice.getByRole('dialog').getByRole('button', { name: new RegExp(users.bob.username) });
      await expect(member).toContainText('online');

      await bob.close();
      await expect(member).toContainText(/last seen/);
    } finally {
      await deleteRoom(users.alice, room.id);
    }
  });
});
