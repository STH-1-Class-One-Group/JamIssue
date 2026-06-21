import { useState, type ReactNode } from 'react';
import type { SecondaryMenuItem, SecondaryMenuItemId } from './secondaryMenu';

export interface SideDrawerProps {
  children?: ReactNode;
  isOpen: boolean;
  items?: readonly SecondaryMenuItem[];
  onClose: () => void;
  onSelectItem?: (itemId: SecondaryMenuItemId) => void;
}

export function SideDrawer({
  children,
  isOpen,
  items = [],
  onClose,
  onSelectItem,
}: SideDrawerProps) {
  const [activeItemId, setActiveItemId] = useState<SecondaryMenuItemId | null>(items[0]?.id ?? null);

  if (!isOpen) {
    return null;
  }

  const activeItem = items.find((item) => item.id === activeItemId) ?? items[0] ?? null;

  const handleSelectItem = (item: SecondaryMenuItem) => {
    setActiveItemId(item.id);
    onSelectItem?.(item.id);
  };

  return (
    <div className="side-drawer" data-side-drawer="root">
      <button
        type="button"
        className="side-drawer__overlay"
        aria-label="보조 메뉴 닫기"
        onClick={onClose}
      />
      <aside
        className="side-drawer__panel"
        role="dialog"
        aria-label="보조 메뉴"
        aria-modal="true"
      >
        <div className="side-drawer__control-row">
          <button
            type="button"
            className="side-drawer__close"
            aria-label="보조 메뉴 닫기"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="side-drawer__content" data-side-drawer-slot="content" data-testid="side-drawer-content">
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
                    <span className="side-drawer__menu-label">{item.label}</span>
                    <span className="side-drawer__menu-description">{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {activeItem && (
            <section className="side-drawer__detail" aria-label={`${activeItem.label} 상세`}>
              <h2>{activeItem.label}</h2>
              <p>{activeItem.description}</p>
            </section>
          )}
          {children}
        </div>
      </aside>
    </div>
  );
}
