import { ToggleSwitch } from '../common/ToggleSwitch';
import type { ActivityViewMode } from './activityViewTypes';

interface ActivityViewToggleProps {
  mode: ActivityViewMode;
  onChange: (mode: ActivityViewMode) => void;
}

export function ActivityViewToggle({ mode, onChange }: ActivityViewToggleProps) {
  return (
    <ToggleSwitch
      checked={mode === 'calendar'}
      label="달력 보기"
      size="sm"
      className="activity-view-toggle"
      onChange={(checked) => onChange(checked ? 'calendar' : 'list')}
    />
  );
}
