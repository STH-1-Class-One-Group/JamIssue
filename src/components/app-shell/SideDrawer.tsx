import { useEffect, useState, type ReactNode } from 'react';
import { ChromeDrawerShell } from './ChromeDrawerShell';
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
      <div className="side-drawer__content chrome-drawer-stack" data-side-drawer-slot="content" data-testid="side-drawer-content">
        {items.length > 0 && (
          <div className="side-drawer__menu" role="menu" aria-label="보조 기능">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeItem?.id === item.id ? 'side-drawer__menu-item is-active' : 'side-drawer__menu-item'}
                role="menuitem"
                aria-current={activeItem?.id === item.id ? 'page' : undefined}
                onClick={() => handleSelectItem(item)}
              >
                {item.icon && <span className="side-drawer__menu-icon" aria-hidden="true">{item.icon}</span>}
                <span className="side-drawer__menu-copy">
                  <span className="side-drawer__menu-label">
                    {item.label}
                    {item.badgeCount && item.badgeCount > 0 ? (
                      <span className="side-drawer__menu-badge" aria-hidden="true">{item.badgeCount}</span>
                    ) : null}
                  </span>
                  <span className="side-drawer__menu-description">{item.description}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        {activeItem ? (
          itemContent ?? (
            <section className="chrome-drawer-section side-drawer__detail" aria-label={`${activeItem.label} 상세`}>
              <h2>{activeItem.label}</h2>
              <p>{activeItem.description}</p>
            </section>
          )
        ) : null}
        {children}
      </div>
    </ChromeDrawerShell>
  );
}
