# JamIssue Web Front

`STH-1-Class-One-Group/JamIssue`는 MSA 전환을 위해 분리된 JamIssue Web Front 서비스 레포입니다.

이 레포는 사용자가 접속하는 React 기반 Web Front와 Cloudflare Pages 배포를 담당합니다. Backend API 구현, Cloudflare Worker, DB schema/migration, 관리자 서비스, provider-side API contract의 정본은 별도 서비스 레포인 `ClarusIubar/JamIssue_admin`에서 관리합니다.

## MSA 서비스 분리 기준

| 서비스 | 소유 범위 |
| --- | --- |
| Web Front service | 사용자-facing React Web Front, Cloudflare Pages, public env, consumer-side API contract |
| Backend/API service | Cloudflare Worker/API 구현, OAuth/session, provider-side API contract, runtime secret |
| Admin/Data service | 관리자 기능, DB schema/migration, 데이터 운영, service-role 작업 |

`SPA`는 이 레포의 프론트 구현 형태입니다. 레포의 소유권과 아키텍처 기준은 `Web Front service`입니다.

## 이 레포가 소유하는 것

- 공개 Web Front service
- 사용자-facing React UI
- Cloudflare Pages 배포 설정
- public client environment 설정
- Web Front build, typecheck, lint, smoke, UI test
- API consumer-side compatibility 확인
- 프론트가 기대하는 API request/response 타입

## 이 레포가 소유하지 않는 것

- Backend API 구현
- Cloudflare Worker 배포
- Supabase schema/migration
- Supabase service-role 작업
- OAuth/backend runtime secret
- 관리자 서비스
- provider-side API contract test

위 항목은 `ClarusIubar/JamIssue_admin`에서 관리합니다.

## API Contract 기준

이 레포에는 backend 구현이 없습니다. 대신 Web Front가 소비하는 API 계약만 남아 있습니다.

- API client: [src/api](src/api)
- Consumer-side DTO/type: [src/types.ts](src/types.ts), [src/types](src/types)
- API base URL 설정: [src/config](src/config)
- API contract 소유권 문서: [docs/api-contract-ownership.md](docs/api-contract-ownership.md)

Provider-side API contract, Worker handler, DB row/schema, migration, OAuth runtime contract는 `ClarusIubar/JamIssue_admin`이 정본입니다.

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

이 레포에는 public client env만 둡니다. service-role key, OAuth secret, Worker runtime secret, DB migration credential은 저장하지 않습니다.

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

- Web Front 개발/배포/운영 문서: [docs/README.md](docs/README.md)
- Web Front Wiki: [JamIssue Wiki](https://github.com/STH-1-Class-One-Group/JamIssue/wiki)
- Backend/API/Worker/DB/admin 문서: [`ClarusIubar/JamIssue_admin` Wiki](https://github.com/ClarusIubar/JamIssue_admin/wiki)
- Backend/API 완료 evidence: [`ClarusIubar/JamIssue_admin` issue tree](https://github.com/ClarusIubar/JamIssue_admin/issues)

관련 이관 이슈:

- [`#10 기존 Web Front 레포의 backend/provider 코드 제거`](https://github.com/ClarusIubar/JamIssue_admin/issues/10)
