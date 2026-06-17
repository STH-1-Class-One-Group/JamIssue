import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToggleSwitch } from '../../src/components/common/ToggleSwitch';

describe('ToggleSwitch', () => {
  it('renders a labelled switch and reports the next checked state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ToggleSwitch checked={false} label="관광정보" onChange={onChange} size="sm" />);

    const switchControl = screen.getByRole('switch', { name: '관광정보' });
    expect(switchControl).not.toBeChecked();

    await user.click(switchControl);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('blocks interaction while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ToggleSwitch checked label="관광정보" disabled onChange={onChange} />);

    await user.click(screen.getByRole('switch', { name: '관광정보' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
