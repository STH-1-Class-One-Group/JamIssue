import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppAccountSettingsSlot } from '../../src/components/app-settings/AppAccountSettingsSlot';
import { CommentThreadItem } from '../../src/components/comment-thread/CommentThreadItem';
import { MyPagePanel } from '../../src/components/MyPagePanel';
import { ReviewListItem } from '../../src/components/review/ReviewListItem';
import { commentFixture, createReviewFixture, myPageFixture, sessionUserFixture } from '../fixtures/app-fixtures';
import type { MyPagePanelProps } from '../../src/components/my-page/myPagePanelTypes';

function createPanelProps(overrides: Partial<MyPagePanelProps> = {}): MyPagePanelProps {
  return {
    sessionData: {
      sessionUser: { ...sessionUserFixture, profileImage: 'https://cdn.example.test/me.webp' },
      myPage: {
        ...myPageFixture,
        user: { ...sessionUserFixture, profileImage: 'https://cdn.example.test/me.webp' },
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

describe('profile avatar UI consumption', () => {
  it('renders My Page as an identity header without duplicate stat tiles or a large empty image slot', () => {
    const { container } = render(<MyPagePanel {...createPanelProps()} />);

    expect(screen.getByLabelText(`${sessionUserFixture.nickname} 프로필 이미지`)).toHaveClass('avatar--lg');
    expect(container.querySelector('.my-page-profile-header__summary')).not.toBeInTheDocument();
    expect(screen.getByText('방문한 고유 명소')).toBeInTheDocument();
    expect(screen.queryByText('프로필 사진 자리')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '프로필 사진 설정' })).not.toBeInTheDocument();
  });

  it('renders account settings subsections with one drawer rhythm', () => {
    render(
      <AppAccountSettingsSlot
        sessionUser={{ ...sessionUserFixture, profileImage: 'https://cdn.example.test/me.webp' }}
        providers={[]}
        profileSaving={false}
        profileError={null}
        isLoggingOut={false}
        onLinkProvider={vi.fn()}
        onSaveNickname={vi.fn().mockResolvedValue(undefined)}
        onUploadAvatar={vi.fn().mockResolvedValue(undefined)}
        onDeleteAvatar={vi.fn().mockResolvedValue(undefined)}
        onLogout={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const editor = screen.getByRole('region', { name: '프로필 사진 설정' });

    expect(within(editor).getByLabelText(`${sessionUserFixture.nickname} 프로필 이미지`)).toHaveClass('avatar--md');
    expect(within(editor).getByText('작은 프로필 이미지로 피드와 댓글에서 표시돼요.')).toBeInTheDocument();
    expect(within(editor).getByText('AVATAR')).toHaveClass('chrome-drawer-section__label');
    expect(within(editor).getByText('사진 변경').closest('.settings-card__avatar-action')).not.toBeNull();
    expect(within(editor).getByRole('button', { name: '사진 삭제' })).toHaveClass('settings-card__avatar-action');
    expect(screen.getByText('프로필명')).toHaveClass('chrome-drawer-section__label');
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });

  it('routes avatar upload and delete controls through the app settings account slot', async () => {
    const user = userEvent.setup();
    const onUploadAvatar = vi.fn().mockResolvedValue(undefined);
    const onDeleteAvatar = vi.fn().mockResolvedValue(undefined);

    render(
      <AppAccountSettingsSlot
        sessionUser={{ ...sessionUserFixture, profileImage: 'https://cdn.example.test/me.webp' }}
        providers={[]}
        profileSaving={false}
        profileError={null}
        isLoggingOut={false}
        onLinkProvider={vi.fn()}
        onSaveNickname={vi.fn().mockResolvedValue(undefined)}
        onUploadAvatar={onUploadAvatar}
        onDeleteAvatar={onDeleteAvatar}
        onLogout={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const fileInput = screen.getByLabelText('사진 변경', { selector: 'input' });
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    await user.upload(fileInput, file);
    await user.click(screen.getByRole('button', { name: '사진 삭제' }));

    expect(onUploadAvatar).toHaveBeenCalledWith(file);
    expect(onDeleteAvatar).toHaveBeenCalledTimes(1);
  });

  it('uses authorProfileImage in feed cards and comment threads', () => {
    const review = createReviewFixture({
      author: '리뷰어',
      authorProfileImage: 'https://cdn.example.test/reviewer.webp',
      comments: [
        {
          ...commentFixture,
          author: '댓글러',
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
    expect(within(card).getByLabelText('리뷰어 프로필 이미지').querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.example.test/reviewer.webp',
    );
    expect(within(card).getByLabelText('댓글러 프로필 이미지').querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.example.test/commenter.webp',
    );
  });

  it('falls back to comment initials when authorProfileImage is null', () => {
    render(
      <ul>
        <CommentThreadItem
          comment={{ ...commentFixture, author: '댓글러', authorProfileImage: null }}
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

    expect(screen.getByLabelText('댓글러 프로필 이미지')).toHaveTextContent('댓');
  });
});
