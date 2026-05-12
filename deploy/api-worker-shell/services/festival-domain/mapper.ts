/*
 * File: mapper.ts
 * Purpose: Provide the public mapper facade for festival-domain callers and tests.
 * Primary Responsibility: Export festival mapper capabilities without exposing internal file layout to callers.
 * Design Intent: Preserve existing imports while large mapping responsibilities live in business-language modules.
 * Non-Goals: This file does not implement mapping policy directly.
 * Dependencies: Festival date, text, import, series, and response mapper modules.
 */
export { parseFestivalDate, getFestivalWindowEnd } from './festival-date';
export { getTargetFestivalCityKeyword } from './festival-text';
export { normalizeImportedFestivalItems, buildFestivalUpsertRows } from './festival-import-mapper';
export { groupFestivalRowsBySeries, isFestivalRowInConfiguredArea } from './festival-series';
export { buildFestivalCard, buildBannerItem } from './festival-response-mapper';
