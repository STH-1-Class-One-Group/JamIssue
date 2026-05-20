# JamIssue Web Front

`STH-1-Class-One-Group/JamIssue`는 JamIssue의 공개 Web Front SPA 레포입니다.

이 레포는 사용자가 접속하는 React 기반 Web Front와 Cloudflare Pages 배포만 담당합니다. Backend API, Cloudflare Worker, DB schema/migration, 관리자 페이지, provider-side API contract의 정본은 `ClarusIubar/JamIssue_admin`입니다.

## 이 레포가 소유하는 것

- 공개 Web Front SPA
- 사용자-facing React UI
- Cloudflare Pages 배포 설정
- public client environment 설정
- Web Front build, typecheck, smoke, UI 테스트
- API consumer-side compatibility 확인

## 이 레포가 소유하지 않는 것

- Backend API 구현
- Cloudflare Worker 배포
- Supabase schema/migration
- Supabase service-role 작업
- OAuth/backend runtime secret
- 관리자 페이지
- provider-side API contract test

위 항목은 `ClarusIubar/JamIssue_admin`에서 관리합니다.

## Runtime Configuration

운영 API base URL:

```env
PUBLIC_APP_BASE_URL=https://api.daejeon.jamissue.com
```

`PUBLIC_APP_BASE_URL`은 이름에 `APP`이 들어가지만, 현재 Web Front에서는 API base URL로 사용합니다.

선택 public env:

```env
PUBLIC_NAVER_MAP_CLIENT_ID=
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

이 레포에는 public client env만 둡니다. service-role key, OAuth secret, Worker runtime secret, DB migration credential은 두지 않습니다.

## Cloudflare

- Pages project: `daejeon-jamissue-pages`
- Production domain: `https://daejeon.jamissue.com`
- Backend API: `https://api.daejeon.jamissue.com`

API/Worker 배포 대상은 이 레포가 아니라 `ClarusIubar/JamIssue_admin`입니다.

## Local Commands

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run smoke:public
```

## 문서 기준

- Web Front 개발/배포/SPA 운영 문서: [이 레포의 Wiki](https://github.com/STH-1-Class-One-Group/JamIssue/wiki)
- Backend/API/Worker/DB/admin 문서: [`ClarusIubar/JamIssue_admin` Wiki](https://github.com/ClarusIubar/JamIssue_admin/wiki)
- 이관 이슈와 완료 evidence: [`ClarusIubar/JamIssue_admin` issue tree](https://github.com/ClarusIubar/JamIssue_admin/issues)

관련 이관 이슈:

- [`#10 기존 Web Front 레포의 backend/provider 코드 제거`](https://github.com/ClarusIubar/JamIssue_admin/issues/10)
