# Worker-first POC

브랜치: `codex/worker-first-poc`

## 목적

Cloudflare Free Worker에서 FastAPI 전체를 직접 올리지 않고도,
Supabase 기반 읽기 API를 Worker가 직접 처리할 수 있는지 확인한다.

## 현재 구조

```text
Cloudflare Pages
-> Cloudflare Worker
-> Supabase REST
```

현재 POC는 읽기 API를 Worker가 직접 처리한다.
아직 옮기지 않은 쓰기/로그인 엔드포인트는 추후 선택적으로 FastAPI origin으로 넘길 수 있다.

## 현재 Worker가 직접 처리하는 엔드포인트

- `GET /api/health`
- `GET /api/auth/providers`
- `GET /api/auth/me`
- `GET /api/bootstrap`
- `GET /api/reviews`
- `GET /api/community-routes`
- `GET /api/banner/events`

## 현재 확인된 동작

- `https://api.jamissue.growgardens.app/api/health`
  - 정상 응답
- `https://api.jamissue.growgardens.app/api/auth/me`
  - 비로그인 세션 정상 응답
- `https://api.jamissue.growgardens.app/api/bootstrap`
  - Supabase 장소 / 후기 / 코스 실제 응답
- `https://api.jamissue.growgardens.app/api/community-routes?sort=popular`
  - 정상 응답

## 현재 일부러 비워둔 것

- 세션 로그인 완료
- 후기 작성 / 댓글 작성 / 좋아요 쓰기
- 스탬프 적립
- 관리자 수정

즉, 이 브랜치는 완성 배포본이 아니라 읽기 중심 실험 브랜치다.

## 장점

- Worker 무료 플랜에서도 실제 데이터 읽기 API를 확인할 수 있다.
- 프론트가 더 이상 shell 응답이 아니라 실제 장소 데이터를 받을 수 있다.
- 팀 기준 FastAPI 구조와 별개로, Worker-first 가능 범위를 실험할 수 있다.

## 단점

- 로그인과 쓰기 기능은 아직 비어 있다.
- FastAPI 기준 메인 아키텍처와는 다르므로, 이 브랜치를 그대로 운영 구조로 확정하면 안 된다.

## 다음 실험 후보

1. 네이버 로그인만 Worker에서 직접 처리 가능한지 확인
2. 후기 작성 1개 API만 Worker로 먼저 옮겨보기
3. 좋아요/스탬프 쓰기 API를 Worker에서 처리 가능한지 확인
4. 한계가 명확해지면 FastAPI 기준 메인 구조와 역할 분담 재정리
