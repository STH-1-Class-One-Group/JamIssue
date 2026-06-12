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

  it('keeps regular images unrotated and ignores errors when no thumbnail fallback is active', () => {
    const { container, rerender } = render(<ReviewImageFrame src="/images/review-orig.jpg" alt="plain image" />);
    const frame = container.querySelector<HTMLDivElement>('.review-card__image-frame');
    Object.defineProperty(frame, 'clientWidth', { configurable: true, value: 160 });
    Object.defineProperty(frame, 'clientHeight', { configurable: true, value: 90 });

    const image = screen.getByAltText('plain image');
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 200 });
    Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 100 });

    fireEvent(window, new Event('resize'));
    fireEvent.load(image);
    fireEvent.error(image);

    expect(container.querySelector('.review-card__image-frame--rotated')).toBeNull();
    expect(image.getAttribute('src')).toBe('/images/review-orig.jpg');

    rerender(<ReviewImageFrame src="/images/review-next.jpg" thumbnailSrc={null} alt="plain image" />);
    expect(screen.getByAltText('plain image').getAttribute('src')).toBe('/images/review-next.jpg');
  });

  it('rotates tall images and keeps the original source when it is already resolved', () => {
    const { container } = render(<ReviewImageFrame src="/images/tall.jpg" thumbnailSrc={null} alt="tall image" />);
    const frame = container.querySelector<HTMLDivElement>('.review-card__image-frame');
    Object.defineProperty(frame, 'clientWidth', { configurable: true, value: 120 });
    Object.defineProperty(frame, 'clientHeight', { configurable: true, value: 200 });

    const image = screen.getByAltText('tall image');
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 100 });
    Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 300 });

    fireEvent.load(image);
    fireEvent.error(screen.getByAltText('tall image'));

    expect(container.querySelector('.review-card__image-frame--rotated')).not.toBeNull();
    expect(screen.getByAltText('tall image').getAttribute('src')).toBe('/images/tall.jpg');
  });
});
