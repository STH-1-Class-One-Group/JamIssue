import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppAccountSettingsSlot } from '../../src/components/app-settings/AppAccountSettingsSlot';
import { Avatar } from '../../src/components/Avatar';
import { CommentThreadItem } from '../../src/components/comment-thread/CommentThreadItem';
import { MyPagePanel } from '../../src/components/MyPagePanel';
import { ReviewListItem } from '../../src/components/review/ReviewListItem';
import { commentFixture, createReviewFixture, myPageFixture, sessionUserFixture } from '../fixtures/app-fixtures';
import type { MyPagePanelProps } from '../../src/components/my-page/myPagePanelTypes';

function createPanelProps(overrides: Partial<MyPagePanelProps> = {}): MyPagePanelProps {
  return {
    sessionData: {
      sessionUser: { ...sessionUserFixture, nickname: 'code305', profileImage: 'https://cdn.example.test/me.webp' },
      myPage: {
        ...myPageFixture,
        user: { ...sessionUserFixture, nickname: 'code305', profileImage: 'https://cdn.example.test/me.webp' },
      },
      providers: [],
      myPageError: null,
    },
    panelState: {
      activeTab: 'feeds',
      isLoggingOut: false,
      profileSaving: false,
      profileError: null,
      routeSubmitting: false,
      routeError: null,
      commentsHasMore: false,
      commentsLoadingMore: false,
    },
    reviewActions: {
      onOpenPlace: vi.fn(),
      onOpenComment: vi.fn(),
      onOpenRoute: vi.fn().mockResolvedValue(undefined),
      onOpenReview: vi.fn(),
      onUpdateReview: vi.fn().mockResolvedValue(undefined),
      onDeleteReview: vi.fn().mockResolvedValue(undefined),
      onLoadMoreComments: vi.fn().mockResolvedValue(undefined),
    },
    panelActions: {
      onChangeTab: vi.fn(),
      onLogin: vi.fn(),
      onLinkProvider: vi.fn(),
      onRetry: vi.fn().mockResolvedValue(undefined),
      onLogout: vi.fn().mockResolvedValue(undefined),
      onSaveNickname: vi.fn().mockResolvedValue(undefined),
      onUploadAvatar: vi.fn().mockResolvedValue(undefined),
      onDeleteAvatar: vi.fn().mockResolvedValue(undefined),
      onPublishRoute: vi.fn().mockResolvedValue(undefined),
    },
    adminData: {
      adminSummary: null,
      adminBusyPlaceId: null,
      adminLoading: false,
    },
    adminActions: {
      onRefreshAdmin: vi.fn().mockResolvedValue(undefined),
      onToggleAdminPlace: vi.fn().mockResolvedValue(undefined),
      onToggleAdminManualOverride: vi.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  };
}

function renderAccountSettingsSlot(overrides: Partial<Parameters<typeof AppAccountSettingsSlot>[0]> = {}) {
  const props = {
    sessionUser: { ...sessionUserFixture, nickname: 'code305', profileImage: 'https://cdn.example.test/me.webp' },
    providers: [],
    profileSaving: false,
    profileError: null,
    isLoggingOut: false,
    onLinkProvider: vi.fn(),
    onSaveNickname: vi.fn().mockResolvedValue(undefined),
    onUploadAvatar: vi.fn().mockResolvedValue(undefined),
    onDeleteAvatar: vi.fn().mockResolvedValue(undefined),
    onLogout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return {
    ...render(<AppAccountSettingsSlot {...props} />),
    props,
  };
}

describe('profile avatar UI consumption', () => {
  it('renders My Page as an identity header without duplicate stat tiles or a large empty image slot', () => {
    const { container } = render(<MyPagePanel {...createPanelProps()} />);

    const headerAvatar = container.querySelector('.my-page-profile-header .avatar--lg');

    expect(headerAvatar).toBeInTheDocument();
    expect(headerAvatar?.querySelector('img')).toHaveAttribute('src', 'https://cdn.example.test/me.webp');
    expect(container.querySelector('.my-page-profile-header__summary')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-label*="profile photo settings" i]')).not.toBeInTheDocument();
  });

  it('renders account settings subsections with one drawer rhythm', () => {
    const { container } = renderAccountSettingsSlot();

    expect(container.querySelector('.settings-card__account-content')).toBeInTheDocument();
    expect(container.querySelector('.settings-card__social')).toBeInTheDocument();
    expect(container.querySelector('.settings-card__avatar-editor')).toBeInTheDocument();
    expect(container.querySelector('.settings-card__avatar-preview .avatar--md img')).toHaveAttribute(
      'src',
      'https://cdn.example.test/me.webp',
    );
    expect(container.querySelector('.settings-card__avatar-action-row')).toBeInTheDocument();
    expect(screen.getByLabelText('프로필명')).toHaveValue('code305');
    expect(container.querySelectorAll('.ui-app-surface--panel').length).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll('.ui-section-header__eyebrow').length).toBeGreaterThanOrEqual(2);
  });

  it('routes avatar upload and delete controls through the app settings account slot', async () => {
    const user = userEvent.setup();
    const onUploadAvatar = vi.fn().mockResolvedValue(undefined);
    const onDeleteAvatar = vi.fn().mockResolvedValue(undefined);
    const { container } = renderAccountSettingsSlot({ onUploadAvatar, onDeleteAvatar });

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    const avatarActions = Array.from(container.querySelectorAll<HTMLButtonElement | HTMLLabelElement>('.settings-card__avatar-action'));
    const deleteButton = avatarActions.find((action): action is HTMLButtonElement => action.tagName === 'BUTTON');
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    expect(fileInput).not.toBeNull();
    expect(deleteButton).toBeDefined();

    await user.upload(fileInput as HTMLInputElement, file);
    await user.click(deleteButton as HTMLButtonElement);

    expect(onUploadAvatar).toHaveBeenCalledWith(file);
    expect(onDeleteAvatar).toHaveBeenCalledTimes(1);
  });

  it('falls back to initials when avatar image loading fails', () => {
    const { container } = render(<Avatar src="https://cdn.example.test/broken.webp" name="Tester" />);

    const image = container.querySelector('.avatar__image');
    expect(image).not.toBeNull();
    fireEvent.error(image as Element);

    expect(screen.getByText('T')).toHaveClass('avatar__fallback');
  });

  it('uses authorProfileImage in feed cards and comment threads', () => {
    const review = createReviewFixture({
      author: 'Reviewer',
      authorProfileImage: 'https://cdn.example.test/reviewer.webp',
      comments: [
        {
          ...commentFixture,
          author: 'Commenter',
          authorProfileImage: 'https://cdn.example.test/commenter.webp',
        },
      ],
    });

    render(
      <ReviewListItem
        review={review}
        currentUserId="user-1"
        isHighlighted={false}
        canWriteComment
        canToggleLike
        isLiking={false}
        isSubmitting={false}
        onToggleLike={vi.fn().mockResolvedValue(undefined)}
        onSubmitComment={vi.fn().mockResolvedValue(undefined)}
        onUpdateComment={vi.fn().mockResolvedValue(undefined)}
        onDeleteComment={vi.fn().mockResolvedValue(undefined)}
        onRequestLogin={vi.fn()}
      />,
    );

    const card = screen.getByTestId('feed-review-card');
    const avatarImages = Array.from(card.querySelectorAll('.avatar__image'));

    expect(avatarImages.some((image) => image.getAttribute('src') === 'https://cdn.example.test/reviewer.webp')).toBe(true);
    expect(avatarImages.some((image) => image.getAttribute('src') === 'https://cdn.example.test/commenter.webp')).toBe(true);
  });

  it('falls back to comment initials when authorProfileImage is null', () => {
    render(
      <ul>
        <CommentThreadItem
          comment={{ ...commentFixture, author: 'Commenter', authorProfileImage: null }}
          reviewId="review-1"
          canWriteComment
          currentUserId="user-1"
          submittingReviewId={null}
          mutatingCommentId={null}
          highlightedCommentId={null}
          onSubmitComment={vi.fn().mockResolvedValue(undefined)}
          onUpdateComment={vi.fn().mockResolvedValue(undefined)}
          onDeleteComment={vi.fn().mockResolvedValue(undefined)}
          onRequestLogin={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByText('C')).toHaveClass('avatar__fallback');
  });
});
