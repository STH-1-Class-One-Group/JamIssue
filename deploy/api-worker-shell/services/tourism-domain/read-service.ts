/*
 * File: read-service.ts
 * Purpose: Build public tourism read responses from stored KTO place rows.
 * Primary Responsibility: Parse read options, load source/place rows, and assemble a stable Front contract.
 * Design Intent: Keep public reads database-backed so Front traffic never calls KTO TourAPI directly.
 * Non-Goals: This file does not schedule syncs, update Supabase rows, or expose admin-only status.
 * Dependencies: Tourism repository, mapper, Worker runtime limits, and Supabase limit parser.
 */
import { WorkerTourismRuntimeConfig } from '../../config/runtime';
import { parseListLimit } from '../../lib/supabase';
import type { WorkerEnv } from '../../types';
import type { TourismFacetRow, TourismFacets, TourismPlacesResponse } from './contracts';
import { mapTourismPlace } from './mapper';
import { loadKtoTourismFacetRows, loadKtoTourismPlaces, loadKtoTourismSource } from './repository';

const facetLabels: Record<string, string> = {
  attraction: '관광지',
  culture: '문화시설',
  leports: '레포츠',
  lodging: '숙박',
  restaurant: '음식점',
  shopping: '쇼핑',
};

function readFilter(url: URL, key: string) {
  const value = url.searchParams.get(key)?.trim() ?? '';
  return value.length > 0 ? value : null;
}

function incrementCount<T extends { count: number }>(map: Map<string, T>, key: string, build: () => T) {
  const current = map.get(key);
  if (current) {
    current.count += 1;
    return;
  }
  const created = build();
  created.count = 1;
  map.set(key, created);
}

function sortByKey<T>(values: T[], read: (value: T) => string) {
  return values.sort((left, right) => read(left).localeCompare(read(right), 'ko'));
}

function buildTourismFacets(rows: TourismFacetRow[]): TourismFacets {
  const contentTypes = new Map<string, { id: string; label: string | null; count: number }>();
  const ktoFacets = new Map<string, { key: string; label: string | null; count: number }>();
  const districts = new Map<string, { name: string; count: number }>();

  for (const row of rows ?? []) {
    const contentTypeId = row.content_type_id ? String(row.content_type_id) : '';
    const contentTypeLabel = row.content_type_label ? String(row.content_type_label) : null;
    const ktoFacet = row.kto_facet ? String(row.kto_facet) : '';
    const district = row.district ? String(row.district) : '';

    if (contentTypeId) {
      incrementCount(contentTypes, contentTypeId, () => ({ id: contentTypeId, label: contentTypeLabel, count: 0 }));
    }
    if (ktoFacet) {
      incrementCount(ktoFacets, ktoFacet, () => ({ key: ktoFacet, label: facetLabels[ktoFacet] ?? contentTypeLabel, count: 0 }));
    }
    if (district) {
      incrementCount(districts, district, () => ({ name: district, count: 0 }));
    }
  }

  return {
    contentTypes: sortByKey([...contentTypes.values()], (value) => value.id),
    ktoFacets: sortByKey([...ktoFacets.values()], (value) => value.key),
    districts: sortByKey([...districts.values()], (value) => value.name),
  };
}

function emptyTourismResponse(): TourismPlacesResponse {
  return { sourceReady: false, sourceName: null, importedAt: null, facets: buildTourismFacets([]), items: [] };
}

function isMissingKtoSchemaError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.includes('PGRST205') && (error.message.includes('public.kto_sync_state') || error.message.includes('public.kto_place'));
}

/**
 * Builds the KTO tourism places response for Front consumers.
 *
 * If KTO tables are not present yet, the response remains a 200-compatible
 * empty contract so clients can render an empty state without retry loops.
 */
export async function loadTourismPlaces(env: WorkerEnv, url: URL): Promise<TourismPlacesResponse> {
  try {
    const source = await loadKtoTourismSource(env);
    if (!source) {
      return emptyTourismResponse();
    }
    const [facetRows, rows] = await Promise.all([
      loadKtoTourismFacetRows(env),
      loadKtoTourismPlaces(env, {
        category: readFilter(url, 'category'),
        district: readFilter(url, 'district'),
        ktoContentTypeId: readFilter(url, 'ktoContentTypeId'),
        ktoFacet: readFilter(url, 'ktoFacet'),
        limit: parseListLimit(url, WorkerTourismRuntimeConfig.defaultPlacesLimit, WorkerTourismRuntimeConfig.maxPlacesLimit),
      }),
    ]);
    return {
      sourceReady: rows.length > 0 || Boolean(source.last_success_at || source.last_imported_at),
      sourceName: source.source_name ?? null,
      importedAt: source.last_success_at ?? source.last_imported_at ?? null,
      facets: buildTourismFacets(facetRows),
      items: rows.map(mapTourismPlace),
    };
  } catch (error) {
    if (isMissingKtoSchemaError(error)) {
      return emptyTourismResponse();
    }
    throw error;
  }
}
