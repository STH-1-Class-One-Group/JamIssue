import { useMemo, useState, type ReactNode } from 'react';
import {
  UNDATED_ACTIVITY_KEY,
  getActivityMonthKey,
  getInitialActivityDateKey,
  groupActivitiesByDate,
} from './activityDate';
import type { ActivityEntry } from './activityViewTypes';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const CALENDAR_COLUMN_COUNT = 7;
const MONTH_STEP = 1;

function createMonthDays(monthKey: string) {
  const [yearText, monthText] = monthKey.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - MONTH_STEP;
  const firstDate = new Date(year, monthIndex, 1);
  const lastDate = new Date(year, monthIndex + MONTH_STEP, 0);
  const leadingBlankCount = firstDate.getDay();
  const totalCells = Math.ceil((leadingBlankCount + lastDate.getDate()) / CALENDAR_COLUMN_COUNT) * CALENDAR_COLUMN_COUNT;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - leadingBlankCount + 1;
    if (dayNumber < 1 || dayNumber > lastDate.getDate()) {
      return null;
    }
    return `${monthKey}-${String(dayNumber).padStart(2, '0')}`;
  });
}

function shiftMonth(monthKey: string, amount: number) {
  const [yearText, monthText] = monthKey.split('-');
  const next = new Date(Number(yearText), Number(monthText) - MONTH_STEP + amount, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + MONTH_STEP).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string) {
  const [yearText, monthText] = monthKey.split('-');
  return `${yearText}.${monthText}`;
}

function formatDayLabel(dateKey: string) {
  const day = Number(dateKey.slice(8, 10));
  return Number.isNaN(day) ? dateKey : String(day);
}

interface ActivityCalendarViewProps {
  entries: ActivityEntry[];
  emptyState: ReactNode;
  loadMoreSlot?: ReactNode;
}

export function ActivityCalendarView({ entries, emptyState, loadMoreSlot }: ActivityCalendarViewProps) {
  const grouped = useMemo(() => groupActivitiesByDate(entries), [entries]);
  const initialDateKey = useMemo(() => getInitialActivityDateKey(entries), [entries]);
  const [monthKey, setMonthKey] = useState(() => getActivityMonthKey(initialDateKey) ?? new Date().toISOString().slice(0, 7));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(() => initialDateKey);
  const monthDays = useMemo(() => createMonthDays(monthKey), [monthKey]);
  const selectedEntries = selectedDateKey ? (grouped[selectedDateKey] ?? []) : [];
  const undatedEntries = grouped[UNDATED_ACTIVITY_KEY] ?? [];

  if (entries.length === 0) {
    return (
      <div className="activity-calendar-view" data-activity-view="calendar">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="activity-calendar-view" data-activity-view="calendar">
      <div className="activity-calendar-view__toolbar">
        <button type="button" className="activity-calendar-view__nav" onClick={() => setMonthKey((current) => shiftMonth(current, -MONTH_STEP))}>
          이전 달
        </button>
        <strong className="activity-calendar-view__month">{formatMonthLabel(monthKey)}</strong>
        <button type="button" className="activity-calendar-view__nav" onClick={() => setMonthKey((current) => shiftMonth(current, MONTH_STEP))}>
          다음 달
        </button>
      </div>

      <div className="activity-calendar-view__grid" role="grid" aria-label="활동 달력">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="activity-calendar-view__weekday" aria-hidden="true">
            {label}
          </span>
        ))}
        {monthDays.map((dateKey, index) => {
          if (!dateKey) {
            return <span key={`empty-${index}`} className="activity-calendar-view__day activity-calendar-view__day--empty" />;
          }
          const count = grouped[dateKey]?.length ?? 0;
          const isSelected = selectedDateKey === dateKey;
          return (
            <button
              key={dateKey}
              type="button"
              className={isSelected ? 'activity-calendar-view__day is-selected' : 'activity-calendar-view__day'}
              aria-pressed={isSelected}
              onClick={() => setSelectedDateKey(dateKey)}
            >
              <span>{formatDayLabel(dateKey)}</span>
              {count > 0 ? <span className="activity-calendar-view__marker" aria-label={`활동 ${count}개`} /> : null}
            </button>
          );
        })}
      </div>

      <div className="activity-calendar-view__selected-list">
        <p className="activity-calendar-view__selected-title">
          {selectedDateKey ? `${selectedDateKey} 활동` : '날짜를 선택해 주세요'}
        </p>
        <div className="review-stack">
          {selectedEntries.length > 0
            ? selectedEntries.map((entry) => (
              <div key={entry.id} className="activity-calendar-view__selected-item" data-activity-kind={entry.kind}>
                {entry.renderCalendarItem ? entry.renderCalendarItem() : entry.renderListItem()}
              </div>
            ))
            : <p className="empty-copy">선택한 날짜에 활동이 없어요.</p>}
        </div>
      </div>

      {undatedEntries.length > 0 ? (
        <div className="activity-calendar-view__undated">
          <p className="activity-calendar-view__selected-title">날짜 미분류</p>
          <div className="review-stack">
            {undatedEntries.map((entry) => (
              <div key={entry.id} className="activity-calendar-view__selected-item" data-activity-kind={entry.kind}>
                {entry.renderCalendarItem ? entry.renderCalendarItem() : entry.renderListItem()}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {loadMoreSlot}
    </div>
  );
}
