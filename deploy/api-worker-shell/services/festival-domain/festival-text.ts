/*
 * File: festival-text.ts
 * Purpose: Extract text fields and decide whether festival payloads belong to the configured area.
 * Primary Responsibility: Own field alias lookup, city keyword fallback, and district derivation.
 * Design Intent: Keep locality and text policy separate from date and DTO mapping.
 * Non-Goals: This file does not parse dates, generate IDs, or build API responses.
 * Dependencies: None.
 */
export function readObjectPayload(payload: unknown) {
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
}

export function readMergedExternalIds(payload: unknown) {
  const mergedExternalIds = readObjectPayload(payload).mergedExternalIds;
  return Array.isArray(mergedExternalIds) ? mergedExternalIds : [];
}

export function readFestivalText(payload: object | null | undefined, keys: string[]) {
  const record = (payload ?? {}) as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return null;
}

export function getTargetFestivalCityKeyword(env: { APP_PUBLIC_EVENT_CITY_KEYWORD?: unknown }) {
  const cityKeyword = String(env.APP_PUBLIC_EVENT_CITY_KEYWORD || '대전').trim();
  return cityKeyword || '대전';
}

function getTargetFestivalAreaKeywords(cityKeyword: string) {
  const normalized = String(cityKeyword || '').trim();
  const keywords = new Set(normalized ? [normalized] : []);
  if (normalized.includes('대전')) {
    ['대전광역시', '동구', '중구', '서구', '유성구', '대덕구'].forEach((keyword) => keywords.add(keyword));
  }
  return [...keywords];
}

export function isFestivalRowInTargetArea(payload: object, cityKeyword: string) {
  const haystack = [
    readFestivalText(payload, ['district', 'signguNm']),
    readFestivalText(payload, ['title', 'eventTitle', 'fstvlNm', 'eventNm']),
    readFestivalText(payload, ['venueName', 'venue_name', 'fstvlCo', 'opar']),
    readFestivalText(payload, ['roadAddress', 'road_address', 'rdnmadr']),
    readFestivalText(payload, ['address', 'lnmadr']),
  ]
    .filter(Boolean)
    .join(' ');
  return getTargetFestivalAreaKeywords(cityKeyword).some((keyword) => haystack.includes(keyword));
}

export function deriveImportedFestivalDistrict(payload: object, cityKeyword: string) {
  const explicit = readFestivalText(payload, ['district', 'signguNm']);
  if (explicit) {
    return explicit;
  }
  const combined = [
    readFestivalText(payload, ['roadAddress', 'road_address', 'rdnmadr']),
    readFestivalText(payload, ['address', 'lnmadr']),
    readFestivalText(payload, ['venueName', 'venue_name', 'fstvlCo', 'opar']),
  ]
    .filter(Boolean)
    .join(' ');
  const districtMatch = combined.match(/([가-힣]+구)/);
  return districtMatch?.[1] || cityKeyword;
}
