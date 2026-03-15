# FastAPI 앱서버

JamIssue 백엔드 앱서버입니다.
브라우저는 직접 8001 포트를 보지 않고, 항상 Nginx 진입점 `http://127.0.0.1:8000` 을 통해 접근합니다.

## 역할

- 장소, 후기, 스탬프, 코스 데이터 제공
- 네이버 OAuth 로그인 처리
- MySQL 기반 데이터 저장 및 조회

## 데이터베이스 기준

- 기본 드라이버: `mysql+pymysql`
- 기본 URL: `mysql+pymysql://jamissue:jamissue@127.0.0.1:3306/jamissue?charset=utf8mb4`
- 스키마 파일: [schema.sql](D:/Code305/JamIssue/backend/sql/schema.sql)
- 로컬 MySQL 런타임: [scripts/install-local-mysql.ps1](D:/Code305/JamIssue/scripts/install-local-mysql.ps1)

## 실행 방식

이 프로젝트는 `.venv\Scripts\python.exe` 를 직접 실행하지 않고,
베이스 Python 3.14 인터프리터로 [run_appserver.py](D:/Code305/JamIssue/backend/run_appserver.py) 를 실행하는 방식을 사용합니다.
이 스크립트가 `.venv/Lib/site-packages` 를 우선 경로에 추가해 의존성을 읽습니다.

## 준비

1. [backend/.env.example](D:/Code305/JamIssue/backend/.env.example) 를 복사해 `backend/.env` 생성
2. 베이스 Python 3.14 준비
3. `backend/.venv/Lib/site-packages` 에 의존성 설치

예시:

```powershell
C:/Users/PC/AppData/Local/Programs/Python/Python314/python.exe -m pip install -r D:/Code305/JamIssue/backend/requirements.txt --target D:/Code305/JamIssue/backend/.venv/Lib/site-packages
```

직접 실행 예시:

```powershell
C:/Users/PC/AppData/Local/Programs/Python/Python314/python.exe D:/Code305/JamIssue/backend/run_appserver.py
```

## 제공 API

- `GET /api/health`
- `GET /api/auth/me`
- `GET /api/auth/naver/login`
- `GET /api/auth/naver/callback`
- `POST /api/auth/logout`
- `GET /api/bootstrap`
- `GET /api/places`
- `GET /api/places/{place_id}`
- `GET /api/courses`
- `GET /api/reviews`
- `POST /api/reviews`
- `GET /api/stamps`
- `POST /api/stamps/toggle`