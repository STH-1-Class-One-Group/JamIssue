import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SplashScreen } from '../../src/components/SplashScreen';

describe('SplashScreen', () => {
  it('shows the brand copy and completes after the fade-out window', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();

    try {
      render(<SplashScreen onDone={onDone} />);

      const logo = screen.getByRole('presentation', { hidden: true });
      expect(logo).toHaveAttribute('src', expect.stringContaining('jamissue-logo'));
      expect(screen.queryByText('J')).not.toBeInTheDocument();
      expect(screen.getByText('DAEJEON LOCAL GUIDE')).toBeInTheDocument();
      expect(screen.getByText('JAM ISSUE')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(screen.getByTestId('app-splash')).toHaveClass('app-splash--hidden');
      expect(onDone).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(onDone).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
