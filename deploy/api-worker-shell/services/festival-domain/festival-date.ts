/*
 * File: festival-date.ts
 * Purpose: Own festival date parsing, window calculation, and active-period checks.
 * Primary Responsibility: Keep date policy reusable across import and response mapping.
 * Design Intent: Make date semantics readable without opening the larger mapper facade.
 * Non-Goals: This file does not normalize text payloads or map DTOs.
 * Dependencies: Worker runtime config and Seoul date helpers.
 */
import { WorkerFestivalRuntimeConfig } from '../../config/runtime';
import { toSeoulDateKey } from '../../lib/dates';

export function isFestivalOngoingInSeoul(startsAt: string, endsAt: string, nowValue = Date.now()) {
  if (!startsAt || !endsAt) {
    return false;
  }
  const startDateKey = toSeoulDateKey(startsAt);
  const endDateKey = toSeoulDateKey(endsAt);
  const nowDateKey = toSeoulDateKey(nowValue);
  return startDateKey <= nowDateKey && endDateKey >= nowDateKey;
}

export function parseFestivalDate(value: unknown, endOfDay = false) {
  if (!value) {
    return null;
  }
  const text = String(value).trim();
  if (!text) {
    return null;
  }
  if (/^\d{8}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6));
    const day = Number(text.slice(6, 8));
    const date = new Date(Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
    parsed.setUTCHours(23, 59, 59, 0);
  }
  return parsed;
}

export function getFestivalWindowEnd(now: number) {
  return new Date(now + WorkerFestivalRuntimeConfig.windowMs);
}
