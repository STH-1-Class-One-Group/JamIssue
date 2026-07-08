# JamIssue 배포 런북

기준 브랜치: `main`

이 문서는 공개 Web Front 저장소에서 수행하는 검증과 preview 배포 경계를 정리합니다. Production 배포와 production smoke는 이 공개 저장소의 책임이 아니며, 별도 private 저장소/CI에서 소유합니다. 이 문서에는 private 저장소 이름, URL, secret을 기록하지 않습니다.

## 1. 현재 운영 경계

```text
Public Web Front repository
-> GitHub Actions
-> frontend build validation
-> Cloudflare Pages preview deploy only

Private deployment repository
-> production deploy
-> production smoke
```

운영 기준:
- 공개 저장소는 PR 또는 수동 실행에서 preview 배포만 수행합니다.
- 공개 저장소의 `main` push는 production 배포를 수행하지 않습니다.
- production domain과 production smoke 증거는 private 배포 경로에서 관리합니다.
- API 운영 진입점은 Cloudflare Worker이며, Web Front는 Worker API만 소비합니다.

## 2. GitHub Actions 워크플로

### `ci.yml`

- `npm ci`
- `npm run check:numeric-literals`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:regression`
- `npm run build`

### `cloudflare-pages.yml`

- Pages 프로젝트명: `daejeon-jamissue-pages`
- PR에서는 preview 배포를 수행합니다.
- 수동 실행도 `preview-*` branch 이름으로만 배포합니다.
- Cloudflare Pages project의 `production_branch`를 생성하거나 변경하지 않습니다.
- `main` branch를 production 배포 branch로 사용하지 않습니다.

### Production 배포와 smoke

- 이 공개 저장소에는 production deploy workflow를 두지 않습니다.
- 이 공개 저장소에는 production smoke workflow를 두지 않습니다.
- Production 배포와 production smoke는 private 저장소/CI 책임입니다.
- 공개 저장소의 workflow, docs, issue, PR에는 private 저장소 identifier나 secret을 기록하지 않습니다.

## 3. 공개 저장소 설정 위치

### GitHub Repository Secrets

위치:
`GitHub > Repository > Settings > Secrets and variables > Actions > Repository secrets`

```env
CLOUDFLARE_API_TOKEN=<Cloudflare API token for preview deploy>
CLOUDFLARE_ACCOUNT_ID=<Cloudflare account id>
PUBLIC_SUPABASE_ANON_KEY=<public anon key>
```

### GitHub Repository Variables

위치:
`GitHub > Repository > Settings > Secrets and variables > Actions > Repository variables`

```env
PUBLIC_APP_BASE_URL=https://api.daejeon.jamissue.com
PUBLIC_NAVER_MAP_CLIENT_ID=<NAVER_MAP_CLIENT_ID>
PUBLIC_SUPABASE_URL=<Supabase public URL>
```

## 4. 수동 검증 명령

프론트엔드 검증:

```powershell
cd D:\JamIssue
npm.cmd ci
npm.cmd run check:numeric-literals
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run test:regression
npm.cmd run build
git diff --check
```

Preview 배포 경로 확인:

```powershell
cd D:\JamIssue
rg -n "production_branch|CF_PAGES_BRANCH|wrangler pages deploy|production-smoke|SMOKE_BASE_URL" .github docs scripts test
```

기대값:
- `.github/workflows/cloudflare-pages.yml`에는 `CF_PAGES_BRANCH: preview-*` 정책만 있어야 합니다.
- `.github/workflows/cloudflare-pages.yml`에는 `production_branch` patch가 없어야 합니다.
- `.github/workflows/production-smoke.yml`은 없어야 합니다.
- 공개 저장소 문서에는 private 저장소 이름, URL, secret이 없어야 합니다.

## 5. Config hardening 기준

운영 값, 좌표, 시간, 용량, 레이아웃 수치는 raw number로 production code에 직접 추가하지 않습니다. 새 수치가 필요하면 아래 중 하나로 분류합니다.

| 영역 | 기준 위치 |
| --- | --- |
| 지도 좌표/마커 | `src/config/mapConfig.ts` |
| UI token과 visual config | `src/config/uiTokenConfig.ts`, `src/styles/tokens.css` |
| 프론트 runtime limit | `src/config/runtimeLimitConfig.ts` |
| Worker 운영 limit | private deployment/API owner |
| 허용 예외 | `config/numeric-literal-allowlist.json` |

허용 예외를 추가할 때는 category와 reason을 남깁니다. 새 production numeric literal은 `npm.cmd run check:numeric-literals`에서 분류되지 않으면 실패해야 합니다.

## 6. 장애 대응 기준

### Preview 배포가 실패할 때

확인 순서:
1. `cloudflare-pages` workflow의 build 단계가 통과했는지 확인합니다.
2. `CLOUDFLARE_API_TOKEN`과 `CLOUDFLARE_ACCOUNT_ID`가 공개 저장소 preview 배포에 필요한 권한을 갖는지 확인합니다.
3. workflow가 `preview-*` branch로 배포하는지 확인합니다.
4. production branch patch나 production smoke를 공개 저장소에서 복구하려고 하지 않습니다.

### Production 배포 또는 production smoke가 필요할 때

확인 순서:
1. private 배포 저장소/CI의 runbook을 사용합니다.
2. 공개 저장소에서 production deploy workflow를 다시 만들지 않습니다.
3. 공개 저장소 issue/PR/docs에 private 저장소 secret이나 identifier를 기록하지 않습니다.
