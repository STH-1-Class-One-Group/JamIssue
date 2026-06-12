import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatCoordinatorErrorMessage,
  reportCoordinatorBackgroundError,
} from '../../src/hooks/app-coordinator/useAppCoordinatorActionUtils';

describe('app coordinator action utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves explicit error messages and falls back for unknown thrown values', () => {
    expect(formatCoordinatorErrorMessage(new Error('explicit failure'))).toBe('explicit failure');
    expect(formatCoordinatorErrorMessage('unknown failure')).toBeTruthy();
  });

  it('reports background coordinator errors through console.error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('background failure');

    reportCoordinatorBackgroundError(error);

    expect(consoleError).toHaveBeenCalledWith(error);
  });
});
