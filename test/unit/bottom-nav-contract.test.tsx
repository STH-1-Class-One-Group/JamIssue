import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BottomNav } from '../../src/components/BottomNav';
import type { Tab } from '../../src/types/core';

const expectedTabs: Tab[] = ['map', 'event', 'feed', 'course', 'my'];

describe('BottomNav contract', () => {
  it('exposes the five primary app tabs in order with icon, label, and active pill structure', () => {
    render(<BottomNav activeTab="event" onChange={vi.fn()} />);

    const items = screen.getAllByRole('button');
    expect(items).toHaveLength(expectedTabs.length);
    expect(items.map((item) => item.getAttribute('data-tab-key'))).toEqual(expectedTabs);

    for (const item of items) {
      expect(item.querySelector('.bottom-nav__icon')).not.toBeNull();
      expect(item.querySelector('.bottom-nav__label')).not.toBeNull();
    }

    const activeItem = screen.getByRole('button', { current: 'page' });
    expect(activeItem).toHaveAttribute('data-tab-key', 'event');
    expect(activeItem.querySelector('.bottom-nav__active-pill')).not.toBeNull();
  });

  it('emits the selected tab key without owning routing policy', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<BottomNav activeTab="map" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '행사' }));

    expect(onChange).toHaveBeenCalledWith('event');
  });
});
