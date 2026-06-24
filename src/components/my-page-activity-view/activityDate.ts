import type { ActivityEntry } from './activityViewTypes';

export const UNDATED_ACTIVITY_KEY = 'undated';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const SHORT_DATE_PATTERN = /(\d{1,2})\s*[.\-/]\s*(\d{1,2})/;

function padDatePart(value: string) {
  return value.padStart(2, '0');
}

export function normalizeActivityDateKey(value: string | null | undefined, fallbackYear = new Date().getFullYear()) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const isoMatch = trimmed.match(ISO_DATE_PATTERN);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const shortMatch = trimmed.match(SHORT_DATE_PATTERN);
  if (shortMatch) {
    return `${fallbackYear}-${padDatePart(shortMatch[1])}-${padDatePart(shortMatch[2])}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

export function getActivityMonthKey(dateKey: string | null) {
  return dateKey ? dateKey.slice(0, 7) : null;
}

export function groupActivitiesByDate(entries: ActivityEntry[]) {
  return entries.reduce<Record<string, ActivityEntry[]>>((groups, entry) => {
    const key = entry.dateKey ?? UNDATED_ACTIVITY_KEY;
    groups[key] = groups[key] ? [...groups[key], entry] : [entry];
    return groups;
  }, {});
}

export function getInitialActivityDateKey(entries: ActivityEntry[]) {
  return entries.find((entry) => entry.dateKey)?.dateKey ?? null;
}
