import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReviewImageFrame } from '../../src/components/review/ReviewImageFrame';

describe('ReviewImageFrame', () => {
  it('uses the thumbnail first and falls back to the original image on error', () => {
    render(<ReviewImageFrame src="/images/review-orig.jpg" thumbnailSrc="/images/review-thumb.jpg" alt="후기 이미지" />);

    const image = screen.getByAltText('후기 이미지');
    expect(image.getAttribute('src')).toBe('/images/review-thumb.jpg');

    fireEvent.error(image);

    expect(image.getAttribute('src')).toBe('/images/review-orig.jpg');
  });
});
