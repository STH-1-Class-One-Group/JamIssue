import { AppSettingsPanel, type AppSettingsPanelProps } from './app-settings/AppSettingsPanel';

export type GlobalSettingsMenuProps = AppSettingsPanelProps;

export function GlobalSettingsMenu(props: GlobalSettingsMenuProps) {
  return <AppSettingsPanel {...props} />;
}
