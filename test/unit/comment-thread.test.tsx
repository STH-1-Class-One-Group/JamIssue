import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CommentThread } from '../../src/components/CommentThread';
import type { Comment } from '../../src/types/review';

function commentFixture(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    userId: 'user-1',
    author: 'tester',
    body: 'original body',
    parentId: null,
    isDeleted: false,
    createdAt: '2026-05-14T00:00:00Z',
    replies: [],
    ...overrides,
  };
}

function renderCommentThread(overrides: Partial<ComponentProps<typeof CommentThread>> = {}) {
  const props: ComponentProps<typeof CommentThread> = {
    comments: [commentFixture()],
    canWriteComment: true,
    currentUserId: 'user-1',
    submittingReviewId: null,
    mutatingCommentId: null,
    highlightedCommentId: null,
    reviewId: 'review-1',
    onSubmitComment: vi.fn().mockResolvedValue(undefined),
    onUpdateComment: vi.fn().mockResolvedValue(undefined),
    onDeleteComment: vi.fn().mockResolvedValue(undefined),
    onRequestLogin: vi.fn(),
    ...overrides,
  };
  const view = render(<CommentThread {...props} />);
  return { ...view, props };
}

function getComposerInput(container: HTMLElement, index = 0) {
  const inputs = container.querySelectorAll<HTMLInputElement>('.comment-thread__reply-form input');
  const input = inputs.item(index);
  if (!input) {
    throw new Error(`Composer input ${index} not found`);
  }
  return input;
}

function getSubmitButton(container: HTMLElement, index = 0) {
  const buttons = container.querySelectorAll<HTMLButtonElement>('.comment-thread__submit');
  const button = buttons.item(index);
  if (!button) {
    throw new Error(`Submit button ${index} not found`);
  }
  return button;
}

function getActionButtons(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLButtonElement>('.comment-thread__reply-toggle')];
}

describe('CommentThread', () => {
  it('submits a top-level comment only when the trimmed body is valid', async () => {
    const user = userEvent.setup();
    const { container, props } = renderCommentThread({ comments: [] });
    const input = getComposerInput(container);
    const submitButton = getSubmitButton(container);

    expect(submitButton).toBeDisabled();
    await user.type(input, ' a ');
    expect(submitButton).toBeDisabled();
    await user.clear(input);
    await user.type(input, '  hello  ');
    await user.click(submitButton);

    expect(props.onSubmitComment).toHaveBeenCalledWith('review-1', 'hello', undefined);
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('requests login instead of submitting when comments are read-only', async () => {
    const user = userEvent.setup();
    const { container, props } = renderCommentThread({
      comments: [],
      canWriteComment: false,
    });
    const input = getComposerInput(container);
    const submitButton = getSubmitButton(container);

    await user.type(input, 'hello');
    await user.click(submitButton);

    expect(props.onRequestLogin).toHaveBeenCalledTimes(1);
    expect(props.onSubmitComment).not.toHaveBeenCalled();
  });

  it('opens a reply composer and submits with the parent comment id', async () => {
    const user = userEvent.setup();
    const { container, props } = renderCommentThread();

    await user.click(getActionButtons(container)[0]);
    const replyInput = getComposerInput(container, 1);
    await user.type(replyInput, 'reply body');
    await user.click(getSubmitButton(container, 1));

    expect(props.onSubmitComment).toHaveBeenCalledWith('review-1', 'reply body', 'comment-1');
    await waitFor(() => expect(container.querySelectorAll('.comment-thread__reply-form input')).toHaveLength(1));
  });

  it('edits and cancels own comments through item actions', async () => {
    const user = userEvent.setup();
    const { container, props } = renderCommentThread();

    await user.click(getActionButtons(container)[1]);
    const editInput = getComposerInput(container, 1);
    expect(editInput).toHaveValue('original body');
    await user.clear(editInput);
    await user.type(editInput, 'updated body');
    await user.click(getSubmitButton(container, 1));

    expect(props.onUpdateComment).toHaveBeenCalledWith('review-1', 'comment-1', 'updated body');

    await user.click(getActionButtons(container)[1]);
    await user.click(getActionButtons(container)[1]);
    expect(container.querySelectorAll('.comment-thread__reply-form input')).toHaveLength(1);
  });

  it('confirms before deleting own comments', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    const { container, props } = renderCommentThread();

    await user.click(getActionButtons(container)[2]);
    expect(props.onDeleteComment).not.toHaveBeenCalled();
    await user.click(getActionButtons(container)[2]);

    expect(confirmSpy).toHaveBeenCalledTimes(2);
    expect(props.onDeleteComment).toHaveBeenCalledWith('review-1', 'comment-1');
    confirmSpy.mockRestore();
  });

  it('renders deleted comments without item actions and scrolls highlighted comments into view', async () => {
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const { container } = renderCommentThread({
      comments: [commentFixture({ isDeleted: true })],
      highlightedCommentId: 'comment-1',
    });

    expect(getActionButtons(container)).toHaveLength(0);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    scrollIntoView.mockRestore();
  });

  it('renders nested replies as reply items', () => {
    const { container } = renderCommentThread({
      comments: [
        commentFixture({
          replies: [commentFixture({ id: 'reply-1', parentId: 'comment-1', userId: 'user-2' })],
        }),
      ],
    });

    expect(container.querySelectorAll('.comment-thread__item')).toHaveLength(2);
    expect(container.querySelectorAll('.comment-thread__item--reply')).toHaveLength(1);
  });
});
