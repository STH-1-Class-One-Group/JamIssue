# JamIssue Web Front

`STH-1-Class-One-Group/JamIssue`는 JamIssue Web Front 공개 저장소입니다.

## 현재 배포 경계

이 저장소는 production 웹 배포 저장소가 아닙니다.

- 이 저장소에서 확인할 수 있는 배포 결과는 Cloudflare Pages preview와 build validation입니다.
- production deploy와 production smoke는 이관된 private repo/CI가 소유합니다.
- 이 공개 저장소의 `main` push는 production 웹을 배포하지 않습니다.
- private repo 이름, URL, secret은 이 공개 저장소 문서와 issue/PR에 기록하지 않습니다.

따라서 이 저장소만 보고 production 웹 화면을 확인하는 흐름은 지원하지 않습니다. 운영 반영 여부는 private 배포 경로의 release/CI evidence를 기준으로 확인해야 합니다.

## 서비스 책임

| 영역 | 이 저장소의 책임 |
| --- | --- |
| Web Front source | 사용자-facing React Web Front |
| Build validation | lint, typecheck, test, build |
| Preview deploy | PR/manual preview branch 배포 |
| Consumer contract | Web Front가 소비하는 API client와 DTO |

이 저장소가 소유하지 않는 영역:

- production deploy
- production smoke
- Backend/API provider implementation
- Cloudflare Worker runtime ownership
- DB schema/migration
- OAuth/backend runtime secret
- service-role 작업
- 관리자 서비스 운영

## API Contract 기준

이 저장소는 backend를 구현하지 않습니다. Web Front가 소비하는 API 계약만 보유합니다.

- API client: [src/api](src/api)
- Consumer-side DTO/type: [src/types.ts](src/types.ts), [src/types](src/types)
- API base URL 설정: [src/config](src/config)
- API contract 소유권 문서: [docs/api-contract-ownership.md](docs/api-contract-ownership.md)

Provider-side API contract, Worker handler, DB row/schema, migration, OAuth runtime contract는 private provider repo/CI에서 확정한 뒤 이 저장소가 소비합니다.

## Runtime Configuration

주요 public env:

```env
PUBLIC_APP_BASE_URL=
PUBLIC_NAVER_MAP_CLIENT_ID=
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

이 저장소에는 public client env만 둡니다. service-role key, OAuth secret, Worker runtime secret, DB migration credential은 저장하지 않습니다.

## Cloudflare Pages

- Public repo workflow: preview-only
- Preview branch pattern: `preview-*`
- Production branch mutation: not owned here
- Production smoke: not owned here

관련 문서:

- [docs/growgardens-deploy-runbook.md](docs/growgardens-deploy-runbook.md)

## Local Commands

```powershell
npm.cmd ci
npm.cmd run check:numeric-literals
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run build
git diff --check
```

## 문서

- Web Front 문서 안내: [docs/README.md](docs/README.md)
- 배포 경계: [docs/growgardens-deploy-runbook.md](docs/growgardens-deploy-runbook.md)
- API contract 소유권: [docs/api-contract-ownership.md](docs/api-contract-ownership.md)
- Wiki: [JamIssue Wiki](https://github.com/STH-1-Class-One-Group/JamIssue/wiki)
