import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MapBottomSheet } from '../../src/components/map-stage/MapBottomSheet';

describe('MapBottomSheet', () => {
  it('expands from peek on handle click without collapsing', () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();

    render(
      <MapBottomSheet
        ariaLabel="테스트 시트"
        drawerState="peek"
        sheetState="peek"
        onExpand={onExpand}
        onCollapse={onCollapse}
        onClose={vi.fn()}
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
        onClose={vi.fn()}
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

  it('owns one close control and only shows minimize from the shared control rail in full mode', () => {
    const onClose = vi.fn();

    render(
      <MapBottomSheet
        ariaLabel="테스트 시트"
        drawerState="full"
        sheetState="full"
        onExpand={vi.fn()}
        onCollapse={vi.fn()}
        onClose={onClose}
      >
        <button type="button">본문 액션</button>
      </MapBottomSheet>,
    );

    fireEvent.click(screen.getByRole('button', { name: '시트 닫기' }));

    expect(screen.getAllByRole('button', { name: '시트 닫기' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: '시트 최소화' })).toHaveLength(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
