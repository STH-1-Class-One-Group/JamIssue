import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MapBottomSheet } from '../../src/components/map-stage/MapBottomSheet';

describe('MapBottomSheet', () => {
  it('expands from partial on handle click without collapsing', () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();

    render(
      <MapBottomSheet
        ariaLabel="테스트 시트"
        drawerState="partial"
        sheetState="peek"
        onExpand={onExpand}
        onCollapse={onCollapse}
      >
        <p>content</p>
      </MapBottomSheet>,
    );

    fireEvent.click(screen.getByRole('button', { name: '시트 확장' }));

    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onCollapse).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '시트 최소화' })).not.toBeInTheDocument();
  });

  it('keeps full sheets stable on handle click and uses an explicit minimize control', () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();

    render(
      <MapBottomSheet
        ariaLabel="테스트 시트"
        drawerState="full"
        sheetState="full"
        onExpand={onExpand}
        onCollapse={onCollapse}
      >
        <p>content</p>
      </MapBottomSheet>,
    );

    fireEvent.click(screen.getByRole('button', { name: '시트 확장됨' }));
    expect(onExpand).not.toHaveBeenCalled();
    expect(onCollapse).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '시트 최소화' }));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});
