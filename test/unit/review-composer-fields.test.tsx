import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewComposer } from '../../src/components/ReviewComposer';
import { ReviewFormFields } from '../../src/components/ReviewFormFields';
import type { ReviewMood } from '../../src/types/core';

describe('ReviewComposer', () => {
  it('blocks short bodies and submits a trimmed review payload when ready', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <ReviewComposer
        placeName="Place 1"
        loggedIn
        canSubmit
        status="ready"
        submitting={false}
        errorMessage={null}
        proofMessage="proof"
        onSubmit={onSubmit}
        onRequestLogin={vi.fn()}
        onRequestProof={vi.fn()}
      />,
    );
    const textarea = container.querySelector('textarea');
    const submitButton = container.querySelector('.route-submit-button');
    if (!textarea || !(submitButton instanceof HTMLButtonElement)) {
      throw new Error('review composer controls missing');
    }

    await user.type(textarea, 'abc');
    await user.click(submitButton);
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(textarea);
    await user.type(textarea, '  valid review  ');
    await user.click(submitButton);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      body: 'valid review',
      mood: expect.any(String),
      file: null,
    }));
    expect(textarea).toHaveValue('');
  });

  it('routes blocked states to login or proof actions instead of form submit', async () => {
    const user = userEvent.setup();
    const onRequestLogin = vi.fn();
    const onRequestProof = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container, rerender } = render(
      <ReviewComposer
        placeName="Place 1"
        loggedIn={false}
        canSubmit={false}
        status="login"
        submitting={false}
        errorMessage="error"
        proofMessage="proof"
        onSubmit={onSubmit}
        onRequestLogin={onRequestLogin}
        onRequestProof={onRequestProof}
      />,
    );
    const actionButton = () => {
      const button = container.querySelector('.route-submit-button');
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('review composer action button missing');
      }
      return button;
    };

    await user.click(actionButton());
    expect(onRequestLogin).toHaveBeenCalledTimes(1);
    expect(screen.getByText('error')).toBeInTheDocument();

    rerender(
      <ReviewComposer
        placeName="Place 1"
        loggedIn
        canSubmit={false}
        status="claim"
        submitting={false}
        errorMessage={null}
        proofMessage="proof"
        onSubmit={onSubmit}
        onRequestLogin={onRequestLogin}
        onRequestProof={onRequestProof}
      />,
    );

    await user.click(actionButton());
    expect(onRequestProof).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ReviewFormFields', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:review-preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports mood, body, and file changes while preserving existing-image controls', async () => {
    const user = userEvent.setup();
    const onMoodChange = vi.fn();
    const onBodyChange = vi.fn();
    const onFileChange = vi.fn();
    const onToggleRemoveImage = vi.fn();
    const file = new File(['image'], 'review.jpg', { type: 'image/jpeg' });
    const { container, rerender } = render(
      <ReviewFormFields
        moodOptions={['혼자서', '친구랑']}
        mood="혼자서"
        onMoodChange={onMoodChange}
        body=""
        onBodyChange={onBodyChange}
        file={null}
        onFileChange={onFileChange}
        disabled={false}
        bodyLabel="Body"
        bodyPlaceholder="Write body"
        fileLabel="File"
        existingImageUrl="/images/existing.jpg"
        existingImageAlt="existing image"
        removeImage={false}
        onToggleRemoveImage={onToggleRemoveImage}
      />,
    );

    await user.click(screen.getByRole('button', { name: '친구랑' }));
    expect(onMoodChange).toHaveBeenCalledWith('친구랑');

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'review body' } });
    expect(onBodyChange).toHaveBeenLastCalledWith('review body');
    expect(screen.getByAltText('existing image')).toHaveAttribute('src', '/images/existing.jpg');

    const fileInput = container.querySelector('input[type="file"]');
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('review file input missing');
    }
    await user.upload(fileInput, file);
    expect(onFileChange).toHaveBeenCalledWith(file);

    rerender(
      <ReviewFormFields
        moodOptions={['혼자서', '친구랑']}
        mood="친구랑"
        onMoodChange={onMoodChange}
        body="review body"
        onBodyChange={onBodyChange}
        file={file}
        onFileChange={onFileChange}
        disabled={false}
        bodyLabel="Body"
        fileLabel="File"
        existingImageUrl="/images/existing.jpg"
        existingImageAlt="existing image"
        removeImage={false}
        onToggleRemoveImage={onToggleRemoveImage}
      />,
    );

    expect(screen.getByAltText(/\S+/u)).toHaveAttribute('src', 'blob:review-preview');
    await user.click(screen.getByRole('button', { name: /취소|痍⑥냼/u }));
    expect(onFileChange).toHaveBeenLastCalledWith(null);

    await user.click(screen.getByRole('button', { name: /젣|삭제|除/u }));
    expect(onToggleRemoveImage).toHaveBeenCalledTimes(1);
  });

  it('disables controls when the parent form is not writable', () => {
    const moodOptions: ReviewMood[] = ['혼자서', '친구랑'];
    const { container } = render(
      <ReviewFormFields
        moodOptions={moodOptions}
        mood="혼자서"
        onMoodChange={vi.fn()}
        body=""
        onBodyChange={vi.fn()}
        file={null}
        onFileChange={vi.fn()}
        disabled
        bodyLabel="Body"
        fileLabel="File"
      />,
    );

    expect(screen.getByRole('button', { name: '혼자서' })).toBeDisabled();
    expect(screen.getByLabelText('Body')).toBeDisabled();
    expect(container.querySelector('.file-picker')).toHaveClass('is-disabled');
  });
});

describe('ReviewImageFrame rotation behavior', () => {
  it('marks tall images as rotated and falls back from thumbnails only once', async () => {
    const { ReviewImageFrame } = await import('../../src/components/review/ReviewImageFrame');
    render(<ReviewImageFrame src="/images/original.jpg" thumbnailSrc="/images/thumb.jpg" alt="review image" />);
    const image = screen.getByAltText('review image');
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 100 });
    Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 200 });

    fireEvent.load(image);

    await waitFor(() => expect(document.querySelector('.review-card__image-frame--rotated')).toBeInTheDocument());
    fireEvent.error(screen.getByAltText('review image'));
    expect(screen.getByAltText('review image')).toHaveAttribute('src', '/images/original.jpg');
    fireEvent.error(screen.getByAltText('review image'));
    expect(screen.getByAltText('review image')).toHaveAttribute('src', '/images/original.jpg');
  });
});
