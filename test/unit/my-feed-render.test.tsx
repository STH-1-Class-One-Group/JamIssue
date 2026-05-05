import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import React from 'react';
import { MyFeedTabSection } from '../../src/components/my-page/MyFeedTabSection';
import * as MyFeedReviewCardModule from '../../src/components/my-page/MyFeedReviewCard';

// Spy on the memoized component's type (the render function inside memo)
// In React 18, a memo component is an object { $$typeof: Symbol(react.memo), type: [Function] }
const originalRenderFunction = (MyFeedReviewCardModule.MyFeedReviewCard as any).type;

const renderCounts: Record<string, number> = {};

// We replace the render function inside the memo wrapper with our spied version
// This allows React to still do the memo bailout, but when it DOES render, we count it.
(MyFeedReviewCardModule.MyFeedReviewCard as any).type = vi.fn((props: any) => {
  renderCounts[props.review.id] = (renderCounts[props.review.id] || 0) + 1;
  return originalRenderFunction(props);
});

test('MyFeedReviewCard does not re-render inactive cards during edits', async () => {
  const user = userEvent.setup();
  const mockUpdate = vi.fn().mockResolvedValue(undefined);

  const reviews = [
    {
      id: 'rev-1', placeId: 'p-1', placeName: 'P 1', body: 'body 1', mood: '혼자서',
      visitedAt: '2024-05-01', visitLabel: '1', badge: '1', hasPublishedRoute: false,
      imageUrl: null, thumbnailUrl: null,
    },
    {
      id: 'rev-2', placeId: 'p-2', placeName: 'P 2', body: 'body 2', mood: '혼자서',
      visitedAt: '2024-05-02', visitLabel: '1', badge: '1', hasPublishedRoute: false,
      imageUrl: null, thumbnailUrl: null,
    }
  ] as any[];

  render(
    <MyFeedTabSection
      reviews={reviews}
      onOpenPlace={vi.fn()}
      onOpenReview={vi.fn()}
      onUpdateReview={mockUpdate}
      onDeleteReview={vi.fn()}
    />
  );

  // Initial render: both cards should render once
  expect(renderCounts['rev-1']).toBe(1);
  expect(renderCounts['rev-2']).toBe(1);

  // Start editing rev-1
  const editButtons = screen.getAllByRole('button', { name: '수정' });
  await user.click(editButtons[0]);

  // Now the editor is open for rev-1.
  // rev-1 re-renders because its editing state changed.
  // rev-2 should NOT re-render because its props (the default stable ones) haven't changed.

  const initialRev2Count = renderCounts['rev-2'];

  // Type in the textarea for rev-1
  const textarea = screen.getByLabelText('리뷰 내용');
  await user.clear(textarea);
  await user.type(textarea, 'updated body 1');

  // Verify rev-2 did not re-render at all during the typing
  expect(renderCounts['rev-2']).toBe(initialRev2Count);

  // rev-1 should have rendered several times during typing
  expect(renderCounts['rev-1']).toBeGreaterThan(1);
});
