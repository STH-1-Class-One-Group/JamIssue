import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MyPageSettingsSection } from '../../src/components/my-page/MyPageSettingsSection';

describe('MyPageSettingsSection', () => {
  it('stays hidden for completed profiles until settings are opened', () => {
    const { container } = render(
      <MyPageSettingsSection
        nickname="tester"
        showSettings={false}
        profileCompletedAt="2026-05-14T00:00:00Z"
        profileSaving={false}
        profileError={null}
        onNicknameChange={vi.fn()}
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders profile setup, routes nickname edits, close, and submit events', async () => {
    const user = userEvent.setup();
    const onNicknameChange = vi.fn();
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <MyPageSettingsSection
        nickname="tester"
        showSettings
        profileCompletedAt="2026-05-14T00:00:00Z"
        profileSaving={false}
        profileError="profile error"
        onNicknameChange={onNicknameChange}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );
    const input = container.querySelector('input');
    const submitButton = container.querySelector('.route-submit-button');
    const closeButton = container.querySelector('.settings-card__close');
    if (!input || !(submitButton instanceof HTMLButtonElement) || !(closeButton instanceof HTMLButtonElement)) {
      throw new Error('profile settings controls missing');
    }

    await user.type(input, '!');
    await user.click(closeButton);
    fireEvent.submit(submitButton.closest('form') as HTMLFormElement);

    expect(screen.getByText('profile error')).toBeInTheDocument();
    expect(onNicknameChange).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables save while saving or while the nickname is too short', () => {
    const props = {
      nickname: 'a',
      showSettings: true,
      profileCompletedAt: null,
      profileSaving: false,
      profileError: null,
      onNicknameChange: vi.fn(),
      onClose: vi.fn(),
      onSubmit: vi.fn().mockResolvedValue(undefined),
    };
    const { rerender } = render(<MyPageSettingsSection {...props} />);
    expect(document.querySelector('.route-submit-button')).toBeDisabled();

    rerender(<MyPageSettingsSection {...props} nickname="tester" profileSaving />);
    expect(document.querySelector('.route-submit-button')).toBeDisabled();
  });
});
