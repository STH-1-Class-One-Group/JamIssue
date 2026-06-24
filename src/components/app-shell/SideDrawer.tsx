import { useEffect, useState, type ReactNode } from 'react';
import { ChromeDrawerShell } from './ChromeDrawerShell';
import { DrawerSection, DrawerSegmentControl, DrawerStack } from './drawer-kit';
import type { SecondaryMenuItem, SecondaryMenuItemId } from './secondaryMenu';

export interface SideDrawerProps {
  children?: ReactNode;
  initialItemId?: SecondaryMenuItemId;
  isOpen: boolean;
  items?: readonly SecondaryMenuItem[];
  onClose: () => void;
  onSelectItem?: (itemId: SecondaryMenuItemId) => void;
  renderItemContent?: (itemId: SecondaryMenuItemId) => ReactNode;
}

export function SideDrawer({
  children,
  initialItemId,
  isOpen,
  items = [],
  onClose,
  onSelectItem,
  renderItemContent,
}: SideDrawerProps) {
  const [activeItemId, setActiveItemId] = useState<SecondaryMenuItemId | null>(initialItemId ?? items[0]?.id ?? null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!activeItemId || !items.some((item) => item.id === activeItemId)) {
      setActiveItemId(initialItemId ?? items[0]?.id ?? null);
    }
  }, [activeItemId, initialItemId, isOpen, items]);

  const activeItem = items.find((item) => item.id === activeItemId) ?? items[0] ?? null;
  const itemContent = activeItem ? renderItemContent?.(activeItem.id) : null;

  const handleSelectItem = (item: SecondaryMenuItem) => {
    setActiveItemId(item.id);
    onSelectItem?.(item.id);
  };

  return (
    <ChromeDrawerShell
      ariaLabel="보조 메뉴"
      isOpen={isOpen}
      onClose={onClose}
      side="left"
      title={<p className="section-eyebrow">MENU</p>}
    >
      <DrawerStack className="side-drawer__content" data-side-drawer-slot="content" data-testid="side-drawer-content">
        {items.length > 0 ? (
          <DrawerSegmentControl label="보조 기능">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeItem?.id === item.id ? 'drawer-kit-segment-control__item is-active' : 'drawer-kit-segment-control__item'}
                role="menuitem"
                aria-current={activeItem?.id === item.id ? 'page' : undefined}
                onClick={() => handleSelectItem(item)}
              >
                {item.icon ? <span className="drawer-kit-segment-control__icon" aria-hidden="true">{item.icon}</span> : null}
                <span className="drawer-kit-segment-control__label">
                  {item.label}
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="drawer-kit-segment-control__badge" aria-hidden="true">{item.badgeCount}</span>
                  ) : null}
                </span>
              </button>
            ))}
          </DrawerSegmentControl>
        ) : null}
        {activeItem ? (
          itemContent ?? (
            <DrawerSection
              className="side-drawer__detail"
              title={activeItem.label}
              description={activeItem.description}
              aria-label={`${activeItem.label} 상세`}
            />
          )
        ) : null}
        {children}
      </DrawerStack>
    </ChromeDrawerShell>
  );
}
