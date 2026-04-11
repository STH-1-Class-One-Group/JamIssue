import {
  assert,
  fetchJson,
  loadRuntimeConfig,
  runCheck,
  runSmokeSuite,
  scriptEntryMatches,
} from "./smoke/shared.mjs";

export const PROTECTED_SMOKE_ENDPOINTS = [
  {
    name: "api-auth-me-authenticated",
    path: "/api/auth/me",
    assertJson(response, json) {
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(json?.isAuthenticated === true, "session should be authenticated");
      assert(Boolean(json?.user?.id), "authenticated user id is missing");
    },
  },
  {
    name: "api-my-summary-authenticated",
    path: "/api/my/summary",
    assertJson(response, json) {
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json?.stamps), "my summary stamps array is missing");
      assert(Array.isArray(json?.reviews), "my summary reviews array is missing");
      assert(Array.isArray(json?.notifications), "my summary notifications array is missing");
    },
  },
  {
    name: "api-my-notifications-authenticated",
    path: "/api/my/notifications",
    assertJson(response, json) {
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json), "notifications response is not an array");
    },
  },
];

export function isProtectedSmokeEnabled(env = process.env) {
  return Boolean((env.SMOKE_AUTH_BEARER_TOKEN || "").trim());
}

export function getProtectedSmokeSkipReason(env = process.env) {
  if (isProtectedSmokeEnabled(env)) {
    return null;
  }
  return "SMOKE_AUTH_BEARER_TOKEN is not configured";
}

export function getProtectedAuthHeaders(env = process.env) {
  const token = env.SMOKE_AUTH_BEARER_TOKEN || "";
  if (!token) {
    throw new Error("SMOKE_AUTH_BEARER_TOKEN is required for protected smoke checks");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export function createProtectedSmokeChecks({ apiBaseUrl }) {
  const authHeaders = getProtectedAuthHeaders();

  return PROTECTED_SMOKE_ENDPOINTS.map((endpoint) => ({
    name: endpoint.name,
    run: () => runCheck(endpoint.name, async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}${endpoint.path}`, {
        headers: authHeaders,
      });
      endpoint.assertJson(response, json);
    }),
  }));
}

export async function runProtectedSmokeSuite({
  env = process.env,
  loadRuntimeConfigImpl = loadRuntimeConfig,
  runSmokeSuiteImpl = runSmokeSuite,
} = {}) {
  const skipReason = getProtectedSmokeSkipReason(env);
  if (skipReason) {
    const payload = {
      suite: "protected",
      skipped: true,
      reason: skipReason,
      checkedAt: new Date().toISOString(),
      endpoints: PROTECTED_SMOKE_ENDPOINTS.map((endpoint) => endpoint.name),
    };
    console.log(JSON.stringify(payload, null, 2));
    return payload;
  }

  const { appConfigResult, runtimeConfig, apiBaseUrl } = await loadRuntimeConfigImpl();
  return runSmokeSuiteImpl({
    suiteName: "protected",
    checks: createProtectedSmokeChecks({ apiBaseUrl, appConfigResult }),
    runtimeConfig,
    appConfigResult,
    apiBaseUrl,
  });
}

export async function main() {
  return runProtectedSmokeSuite();
}

if (scriptEntryMatches(import.meta.url, process.argv[1])) {
  main().catch((error) => {
    console.error("[smoke] fatal error", error);
    process.exitCode = 1;
  });
}
