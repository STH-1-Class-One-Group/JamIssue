import { formatDateTime } from '../lib/dates';
import { jsonResponse } from '../lib/http';
import { readSessionUser } from './auth';
import {
  loadAdminSummaryRows,
  loadPlaceReviewRows,
  loadPublicDataSource,
  updateAdminPlaceVisibility,
} from './admin-domain/repository';
import type { WorkerEnv, WorkerJsonRecord } from '../types';
import type { WorkerAdminServiceDeps } from './admin-domain/contracts';

export function createAdminService({ normalizePlaceCategory }: WorkerAdminServiceDeps) {
  async function requireAdmin(request: Request, env: WorkerEnv) {
    const sessionUser = await readSessionUser(request, env);
    if (!sessionUser || !sessionUser.isAdmin) {
      return { response: jsonResponse(403, { detail: '관리자만 접근할 수 있어요.' }, env, request) };
    }
    return { sessionUser };
  }

  async function buildAdminSummary(env: WorkerEnv) {
    const { userCount, placeCount, reviewCount, commentCount, stampCount, placeRows, feedRows } = await loadAdminSummaryRows(env);
    const reviewCountByPosition = new Map<string, number>();
    for (const row of feedRows ?? []) {
      const key = String(row.position_id);
      reviewCountByPosition.set(key, (reviewCountByPosition.get(key) ?? 0) + 1);
    }
    return {
      userCount,
      placeCount,
      reviewCount,
      commentCount,
      stampCount,
      sourceReady: true,
      places: (placeRows ?? []).map((row) => ({
        id: row.slug,
        name: row.name,
        district: row.district,
        category: normalizePlaceCategory(String(row.category), row.slug ? String(row.slug) : undefined),
        isActive: Boolean(row.is_active),
        isManualOverride: Boolean(row.is_manual_override),
        reviewCount: reviewCountByPosition.get(String(row.position_id)) ?? 0,
        updatedAt: formatDateTime(row.updated_at),
      })),
    };
  }

  async function handleAdminSummary(request: Request, env: WorkerEnv) {
    const auth = await requireAdmin(request, env);
    if (auth.response) {
      return auth.response;
    }
    return jsonResponse(200, await buildAdminSummary(env), env, request);
  }

  async function handleAdminPlaceVisibility(request: Request, env: WorkerEnv, placeId: string) {
    const auth = await requireAdmin(request, env);
    if (auth.response) {
      return auth.response;
    }

    const payload = await request.json().catch(() => null) as WorkerJsonRecord | null;
    const body: WorkerJsonRecord = {};
    if (typeof payload?.isActive === 'boolean') {
      body.is_active = payload.isActive;
    }
    if (typeof payload?.isManualOverride === 'boolean') {
      body.is_manual_override = payload.isManualOverride;
    }
    body.updated_at = new Date().toISOString();

    const updatedRow = await updateAdminPlaceVisibility(env, placeId, body);
    if (!updatedRow) {
      return jsonResponse(404, { detail: '장소를 찾을 수 없어요.' }, env, request);
    }

    const reviewRows = await loadPlaceReviewRows(env, updatedRow.position_id as string | number);
    return jsonResponse(
      200,
      {
        id: updatedRow.slug,
        name: updatedRow.name,
        district: updatedRow.district,
        category: normalizePlaceCategory(String(updatedRow.category), updatedRow.slug ? String(updatedRow.slug) : undefined),
        isActive: Boolean(updatedRow.is_active),
        isManualOverride: Boolean(updatedRow.is_manual_override),
        reviewCount: (reviewRows ?? []).length,
        updatedAt: formatDateTime(updatedRow.updated_at),
      },
      env,
      request,
    );
  }

  async function handleAdminImportPublicData(request: Request, env: WorkerEnv) {
    const auth = await requireAdmin(request, env);
    if (auth.response) {
      return auth.response;
    }
    const source = await loadPublicDataSource(env, 'jamissue-public-event-feed');
    return jsonResponse(
      200,
      {
        importedPlaces: 0,
        importedCourses: 0,
        importedEvents: 0,
        mode: 'scheduled',
        detail: '공공 행사는 GitHub Actions 주간 작업으로 처리돼요.',
        importedAt: source?.last_imported_at ?? null,
      },
      env,
      request,
    );
  }

  return { handleAdminImportPublicData, handleAdminPlaceVisibility, handleAdminSummary };
}
