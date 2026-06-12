import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BottomNav } from '../../src/components/BottomNav';
import type { Tab } from '../../src/types/core';

const expectedTabs: Tab[] = ['map', 'event', 'feed', 'course', 'my'];

describe('BottomNav contract', () => {
  it('exposes the five primary app tabs in order', () => {
    render(<BottomNav activeTab="event" onChange={vi.fn()} />);

    const items = screen.getAllByRole('button');
    expect(items).toHaveLength(expectedTabs.length);
    expect(items.map((item) => item.getAttribute('data-tab-key'))).toEqual(expectedTabs);
    expect(screen.getByRole('button', { current: 'page' })).toHaveAttribute('data-tab-key', 'event');
  });

  it('emits the selected tab key without owning routing policy', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<BottomNav activeTab="map" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '행사' }));

    expect(onChange).toHaveBeenCalledWith('event');
  });
});
