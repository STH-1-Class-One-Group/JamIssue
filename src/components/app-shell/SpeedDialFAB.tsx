/*
 * File: SpeedDialFAB.tsx
 * Purpose: Render an expandable floating action button from caller-provided actions.
 * Primary Responsibility: Own the presentation and open/close interaction for quick actions.
 * Design Intent: Keep action wiring in the composition layer while this component stays route/API agnostic.
 * Non-Goals: This component does not decide menu IA, read router history, fetch data, or import icon libraries.
 * Dependencies: React state and caller-provided callbacks.
 */
import { useState, type ReactNode } from 'react';

export interface FABAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

export interface SpeedDialFABProps {
  actions: FABAction[];
  ariaLabel?: string;
  hidden?: boolean;
}

export function SpeedDialFAB({
  actions,
  ariaLabel = '지도 빠른 작업',
  hidden = false,
}: SpeedDialFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const availableActions = actions.filter((action) => action.id && action.label);

  if (hidden || availableActions.length === 0) {
    return null;
  }

  const handleActionClick = async (action: FABAction) => {
    if (action.disabled) {
      return;
    }

    await action.onClick();
    setIsOpen(false);
  };

  return (
    <div className={isOpen ? 'speed-dial-fab is-open' : 'speed-dial-fab'} data-speed-dial-fab="root">
      {isOpen ? (
        <div className="speed-dial-fab__menu" role="menu" aria-label={`${ariaLabel} 목록`}>
          {availableActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="speed-dial-fab__action"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => void handleActionClick(action)}
            >
              <span className="speed-dial-fab__action-icon" aria-hidden="true">
                {action.icon ?? '•'}
              </span>
              <span className="speed-dial-fab__action-label">{action.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="speed-dial-fab__trigger"
        aria-expanded={isOpen}
        aria-label={isOpen ? `${ariaLabel} 닫기` : `${ariaLabel} 열기`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span aria-hidden="true">{isOpen ? '×' : '+'}</span>
      </button>
    </div>
  );
}
