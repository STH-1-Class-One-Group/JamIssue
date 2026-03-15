# JamIssue Nginx 로컬 프록시

이 프로젝트에서 Nginx는 두 역할을 함께 맡습니다.

- `http://127.0.0.1:8000` 단일 진입점 제공
- React 정적 파일 서빙 + FastAPI `/api` 프록시

## 포트 구성

- Nginx: `127.0.0.1:8000`
- FastAPI: `127.0.0.1:8001`
- 프론트 정적 파일: `infra/nginx/site` 디렉터리

## 프록시 규칙

- `/api/*` -> FastAPI (`127.0.0.1:8001`)
- `/assets/*` -> 정적 번들 파일
- `/icons/*` -> 앱 아이콘
- 그 외 경로 -> `index.html` fallback

## 준비물

1. `scripts/install-local-nginx.ps1` 로 로컬 nginx 바이너리 다운로드
2. `npm run build` 로 프론트 정적 파일 생성
3. FastAPI 실행 후 nginx 시작

실제로는 [start-local-stack.ps1](/D:/Code305/JamIssue/scripts/start-local-stack.ps1) 이 위 순서를 자동으로 처리합니다.