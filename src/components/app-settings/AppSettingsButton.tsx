export interface AppSettingsButtonProps {
  isOpen: boolean;
  onOpen: () => void;
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="review-action-button__svg" aria-hidden="true">
      <path
        d="M10.23 4.23a1 1 0 0 1 1-.73h1.54a1 1 0 0 1 1 .73l.24.85a6.9 6.9 0 0 1 1.43.59l.78-.43a1 1 0 0 1 1.2.18l1.08 1.08a1 1 0 0 1 .18 1.2l-.43.78c.24.45.44.92.59 1.43l.85.24a1 1 0 0 1 .73 1v1.54a1 1 0 0 1-.73 1l-.85.24a6.9 6.9 0 0 1-.59 1.43l.43.78a1 1 0 0 1-.18 1.2l-1.08 1.08a1 1 0 0 1-1.2.18l-.78-.43a6.9 6.9 0 0 1-1.43.59l-.24.85a1 1 0 0 1-1 .73h-1.54a1 1 0 0 1-1-.73l-.24-.85a6.9 6.9 0 0 1-1.43-.59l-.78.43a1 1 0 0 1-1.2-.18l-1.08-1.08a1 1 0 0 1-.18-1.2l.43-.78a6.9 6.9 0 0 1-.59-1.43l-.85-.24a1 1 0 0 1-.73-1v-1.54a1 1 0 0 1 .73-1l.85-.24a6.9 6.9 0 0 1 .59-1.43l-.43-.78a1 1 0 0 1 .18-1.2l1.08-1.08a1 1 0 0 1 1.2-.18l.78.43c.45-.24.92-.44 1.43-.59z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function AppSettingsButton({
  isOpen,
  onOpen,
}: AppSettingsButtonProps) {
  return (
    <button
      type="button"
      className={isOpen ? 'secondary-button icon-button global-settings-menu__trigger is-complete' : 'secondary-button icon-button global-settings-menu__trigger'}
      onClick={onOpen}
      aria-label="앱 설정 열기"
      title="앱 설정 열기"
      aria-expanded={isOpen}
    >
      <GearIcon />
    </button>
  );
}
