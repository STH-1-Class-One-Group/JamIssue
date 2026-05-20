# JamIssue Web Front

`STH-1-Class-One-Group/JamIssue`는 JamIssue의 Web Front 전용 레포입니다.

## Ownership

- Cloudflare Pages 기반 운영 Web Front
- 사용자-facing React UI
- Front public env 설정
- Web Front build, typecheck, smoke

## Boundary

Backend/API, Cloudflare Worker, DB schema/migration, service-role operation,
admin-only API와 관리자 페이지는 `ClarusIubar/JamIssue_admin`이 소유합니다.

이 레포는 `JamIssue_admin`이 제공하는 API contract만 소비합니다. backend/provider
구현, Worker 배포 workflow, service-role secret, DB migration은 이 레포에 두지
않습니다.

## Runtime Configuration

운영 API base URL:

```env
PUBLIC_APP_BASE_URL=https://api.daejeon.jamissue.com
```

`PUBLIC_APP_BASE_URL`은 이름은 legacy지만 현재 Web Front에서 API base URL로
사용합니다.

선택 public env:

```env
PUBLIC_NAVER_MAP_CLIENT_ID=
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

## Cloudflare

- Pages project: `daejeon-jamissue-pages`
- Production domain: `https://daejeon.jamissue.com`
- Backend API: `https://api.daejeon.jamissue.com`

`jamissue-web`, `jamissue-api`, `daejeon-jamissue-pages-dev`는 이관 정리 대상입니다.

## Local Commands

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run smoke:public
```

## Source Of Truth

이관 작업의 source of truth는
[`ClarusIubar/JamIssue_admin` issue tree](https://github.com/ClarusIubar/JamIssue_admin/issues)입니다.

관련 child issue:

- [`#10 기존 Web Front 레포의 backend/provider 코드 제거`](https://github.com/ClarusIubar/JamIssue_admin/issues/10)
