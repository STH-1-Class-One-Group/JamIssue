import {
  assert,
  fetchJson,
  loadRuntimeConfig,
  runCheck,
  runSmokeSuite,
  scriptEntryMatches,
} from './smoke/shared';
import {
  getProtectedWriteAuthHeaders,
  getProtectedWriteSmokeConfig,
  getProtectedWriteSmokeSkipReason,
} from './smoke/protected-write';

interface CreatedReviewPayload {
  id?: string;
}

function hasReviewId(payload: unknown): payload is CreatedReviewPayload {
  return Boolean(payload && typeof payload === 'object' && 'id' in payload);
}

export function createProtectedWriteSmokeChecks({ apiBaseUrl, env = process.env }) {
  const authHeaders = getProtectedWriteAuthHeaders(env);
  const jsonHeaders = {
    ...authHeaders,
    'content-type': 'application/json',
  };
  const config = getProtectedWriteSmokeConfig(env);

  return [
    {
      name: 'api-review-write-roundtrip',
      run: () => runCheck('api-review-write-roundtrip', async () => {
        let reviewId: string | null = null;

        try {
          const { response: createReviewResponse, json: createReviewJson } = await fetchJson(`${apiBaseUrl}/api/reviews`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({
              placeId: config.placeId,
              stampId: config.stampId,
              body: config.reviewBody,
              mood: '혼자서',
              imageUrl: null,
            }),
          });
          assert(createReviewResponse.status === 201, `expected review create 201, received ${createReviewResponse.status}`);
          assert(hasReviewId(createReviewJson) && Boolean(createReviewJson.id), 'created review id is missing');
          reviewId = String(createReviewJson.id);

          const { response: createCommentResponse, json: createCommentJson } = await fetchJson(`${apiBaseUrl}/api/reviews/${reviewId}/comments`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ body: config.commentBody }),
          });
          assert(createCommentResponse.status === 200, `expected comment create 200, received ${createCommentResponse.status}`);
          assert(Array.isArray(createCommentJson), 'created comment thread response is not an array');
        } finally {
          if (reviewId) {
            const { response: deleteReviewResponse } = await fetchJson(`${apiBaseUrl}/api/reviews/${reviewId}`, {
              method: 'DELETE',
              headers: authHeaders,
            });
            assert(deleteReviewResponse.status === 200, `expected review cleanup 200, received ${deleteReviewResponse.status}`);
          }
        }
      }),
    },
  ];
}

export async function runProtectedWriteSmokeSuite({
  env = process.env,
  loadRuntimeConfigImpl = loadRuntimeConfig,
  runSmokeSuiteImpl = runSmokeSuite,
} = {}) {
  const skipReason = getProtectedWriteSmokeSkipReason(env);
  if (skipReason) {
    const payload = {
      suite: 'protected-write',
      skipped: true,
      reason: skipReason,
      checkedAt: new Date().toISOString(),
      endpoints: ['api-review-write-roundtrip'],
    };
    console.log(JSON.stringify(payload, null, 2));
    return payload;
  }

  const { appConfigResult, runtimeConfig, apiBaseUrl } = await loadRuntimeConfigImpl();
  return runSmokeSuiteImpl({
    suiteName: 'protected-write',
    checks: createProtectedWriteSmokeChecks({ apiBaseUrl, env }),
    runtimeConfig,
    appConfigResult,
    apiBaseUrl,
  });
}

export async function main() {
  return runProtectedWriteSmokeSuite();
}

if (scriptEntryMatches(import.meta.url, process.argv[1])) {
  main().catch((error) => {
    console.error('[smoke] fatal error', error);
    process.exitCode = 1;
  });
}
