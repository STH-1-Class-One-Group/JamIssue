import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
  it('renders My Page as a small avatar summary header without a large empty image slot', () => {
    render(<MyPagePanel {...createPanelProps()} />);

    expect(screen.getByLabelText(`${sessionUserFixture.nickname} 프로필 이미지`)).toHaveClass('avatar--lg');
    expect(screen.getByLabelText('내 활동 요약')).toHaveTextContent(String(myPageFixture.stats.uniquePlaceCount));
    expect(screen.queryByText('프로필 사진 자리')).not.toBeInTheDocument();
  });

  it('routes avatar upload and delete controls through My Page settings', async () => {
    const user = userEvent.setup();
    const onUploadAvatar = vi.fn().mockResolvedValue(undefined);
    const onDeleteAvatar = vi.fn().mockResolvedValue(undefined);
    const props = createPanelProps({
      panelActions: {
        ...createPanelProps().panelActions,
        onUploadAvatar,
        onDeleteAvatar,
      },
    });

    render(<MyPagePanel {...props} />);
    await user.click(screen.getByRole('button', { name: /설정/ }));

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
