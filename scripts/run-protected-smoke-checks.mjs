import {
  assert,
  fetchJson,
  loadRuntimeConfig,
  runCheck,
  runSmokeSuite,
  scriptEntryMatches,
} from "./smoke/shared.mjs";

export function getProtectedAuthHeaders() {
  const token = process.env.SMOKE_AUTH_BEARER_TOKEN || "";
  if (!token) {
    throw new Error("SMOKE_AUTH_BEARER_TOKEN is required for protected smoke checks");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export function createProtectedSmokeChecks({ apiBaseUrl }) {
  const authHeaders = getProtectedAuthHeaders();

  return [
    { name: "api-auth-me-authenticated", run: () => runCheck("api-auth-me-authenticated", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/auth/me`, {
        headers: authHeaders,
      });
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(json?.isAuthenticated === true, "session should be authenticated");
      assert(Boolean(json?.user?.id), "authenticated user id is missing");
    }) },
    { name: "api-my-summary-authenticated", run: () => runCheck("api-my-summary-authenticated", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/my/summary`, {
        headers: authHeaders,
      });
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json?.stamps), "my summary stamps array is missing");
      assert(Array.isArray(json?.reviews), "my summary reviews array is missing");
      assert(Array.isArray(json?.notifications), "my summary notifications array is missing");
    }) },
    { name: "api-my-notifications-authenticated", run: () => runCheck("api-my-notifications-authenticated", async () => {
      const { response, json } = await fetchJson(`${apiBaseUrl}/api/my/notifications`, {
        headers: authHeaders,
      });
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(Array.isArray(json), "notifications response is not an array");
    }) },
  ];
}

export async function main() {
  const { appConfigResult, runtimeConfig, apiBaseUrl } = await loadRuntimeConfig();
  return runSmokeSuite({
    suiteName: "protected",
    checks: createProtectedSmokeChecks({ apiBaseUrl, appConfigResult }),
    runtimeConfig,
    appConfigResult,
    apiBaseUrl,
  });
}

if (scriptEntryMatches(import.meta.url, process.argv[1])) {
  main().catch((error) => {
    console.error("[smoke] fatal error", error);
    process.exitCode = 1;
  });
}
