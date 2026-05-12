/*
 * File: festival-coordinate.ts
 * Purpose: Normalize optional latitude and longitude values.
 * Primary Responsibility: Keep coordinate parsing policy named and reusable.
 * Design Intent: Avoid repeating numeric checks across import and response mapping.
 * Non-Goals: This file does not validate business area membership.
 * Dependencies: None.
 */
export function parseFestivalCoordinate(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}
