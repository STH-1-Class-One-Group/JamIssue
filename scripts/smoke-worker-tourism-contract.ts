/*
 * File: smoke-worker-tourism-contract.ts
 * Purpose: Validate the deployed Worker tourism places public contract.
 * Primary Responsibility: Check `/api/tourism/places` response shape and forbidden field omission.
 * Design Intent: Provide an operator-safe smoke that verifies Front-facing contract readiness without calling KTO/OpenAPI directly.
 * Non-Goals: This script does not mutate data, validate Supabase RLS, or run KTO sync/import operations.
 * Dependencies: Node fetch runtime and deployed JamIssue Worker public API.
 */
const DEFAULT_API_BASE_URL = 'https://api.daejeon.jamissue.com';
const forbiddenFields = ['kto_place_id', 'raw_payload', 'normalized_payload', 'serviceKey', 'service_key'];

interface SmokeFailure {
  field: string;
  detail: string;
}

function assert(condition: unknown, field: string, detail: string, failures: SmokeFailure[]) {
  if (!condition) {
    failures.push({ field, detail });
  }
}

async function main() {
  const apiBaseUrl = process.env.JAMISSUE_API_BASE_URL || DEFAULT_API_BASE_URL;
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/tourism/places?limit=3`;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  const failures: SmokeFailure[] = [];

  assert(response.ok, 'status', `expected 2xx, got ${response.status}`, failures);
  const payload = await response.json() as Record<string, unknown>;

  assert(typeof payload.sourceReady === 'boolean', 'sourceReady', 'must be boolean', failures);
  assert('sourceName' in payload, 'sourceName', 'must be present', failures);
  assert('importedAt' in payload, 'importedAt', 'must be present', failures);
  assert(typeof payload.facets === 'object' && payload.facets !== null, 'facets', 'must be object', failures);
  assert(Array.isArray(payload.items), 'items', 'must be array', failures);

  const facets = payload.facets as Record<string, unknown>;
  assert(Array.isArray(facets.contentTypes), 'facets.contentTypes', 'must be array', failures);
  assert(Array.isArray(facets.ktoFacets), 'facets.ktoFacets', 'must be array', failures);
  assert(Array.isArray(facets.districts), 'facets.districts', 'must be array', failures);

  const serialized = JSON.stringify(payload);
  for (const field of forbiddenFields) {
    assert(!serialized.includes(field), field, 'must not appear in public tourism JSON', failures);
  }

  if (Array.isArray(payload.items) && payload.items.length > 0) {
    const item = payload.items[0] as Record<string, unknown>;
    for (const field of ['id', 'name', 'category', 'district', 'isCurated', 'curatedPlace']) {
      assert(field in item, `items[0].${field}`, 'must be present', failures);
    }
  }

  if (failures.length > 0) {
    console.error(JSON.stringify({ ok: false, url, failures }, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({
    ok: true,
    url,
    sourceReady: payload.sourceReady,
    itemCount: Array.isArray(payload.items) ? payload.items.length : 0,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
