# ??꾩왋?덉뒋 MVP

???愿愿묎컼, ?뱁엳 20~30? ?ъ꽦???源껋쑝濡???紐⑤컮???곗꽑 ?ы뻾 ?뱀빋?낅땲??  
?꾩옱 濡쒖뺄 援ъ“??`React ?뺤쟻 踰덈뱾 + Nginx + FastAPI + portable MySQL` ?낅땲??

## ?꾩옱 ?꾪궎?띿쿂

- 吏꾩엯?? `http://localhost:8000`
- ?꾨줎?몄뿏?? React + TypeScript ?뺤쟻 踰덈뱾
- ?꾨줉???뺤쟻 ?쒕튃: Nginx
- ?깆꽌踰? FastAPI + SQLAlchemy
- ?곗씠?곕쿋?댁뒪: portable MySQL 8.4
- 吏?? NAVER Maps JavaScript API v3
- 濡쒓렇?? NAVER OAuth

## ?꾩옱 援ы쁽 踰붿쐞

- ????쒖젙 吏???먯깋
- 移댄뀒怨좊━蹂??μ냼 蹂닿린
- 肄붿뒪 異붿쿇 ??- ?μ냼 ?곸꽭 ?쒗듃
- ?꾧린, ?볤?, ?대?吏 ?낅줈??- ?꾩옣 諛섍꼍 ?ㅽ꺃???곷┰
- 濡쒓렇????留덉씠?섏씠吏
- 愿由ъ옄 ?μ냼 ?몄텧 ?쒖뼱? 怨듦났 ?곗씠???ш??몄삤湲?
## PRD 以???곹깭

吏???ㅻ쭔 ?ｋ뒗?ㅺ퀬 ?쒗뭹???꾩꽦?섎뒗 ?곹깭???꾨떃?덈떎.  
?꾩옱 援ы쁽??PRD? ?대뵒源뚯? 留욌뒗吏???꾨옒 臾몄꽌???뺣━?덉뒿?덈떎.

- [PRD 以???먭?](D:/Code305/JamIssue/docs/prd-compliance.md)

## 鍮좊Ⅸ 濡쒖뺄 ?ㅽ뻾

泥섏쓬 ??踰덈쭔 以鍮?

```powershell
cd D:/Code305/JamIssue
npm.cmd install
powershell -ExecutionPolicy Bypass -File D:/Code305/JamIssue/scripts/install-local-nginx.ps1
powershell -ExecutionPolicy Bypass -File D:/Code305/JamIssue/scripts/install-local-mysql.ps1
```

?됱냼 ?ㅽ뻾:

```powershell
powershell -ExecutionPolicy Bypass -File D:/Code305/JamIssue/scripts/dev.ps1 start
powershell -ExecutionPolicy Bypass -File D:/Code305/JamIssue/scripts/dev.ps1 status
powershell -ExecutionPolicy Bypass -File D:/Code305/JamIssue/scripts/dev.ps1 logs
powershell -ExecutionPolicy Bypass -File D:/Code305/JamIssue/scripts/dev.ps1 stop
```

?뺤쟻 ?꾨줎?몃쭔 ?ㅼ떆 鍮뚮뱶????

```powershell
npm.cmd run build
```

## ?섍꼍 蹂??
猷⑦듃 [`.env`](D:/Code305/JamIssue/.env) ?먮뒗 釉뚮씪?곗?濡??몄텧?섏뼱???섎뒗 媛믩쭔 ?〓땲??

```bash
PUBLIC_APP_BASE_URL=http://localhost:8000
PUBLIC_NAVER_MAP_CLIENT_ID=YOUR_NAVER_MAP_CLIENT_ID
```

諛깆뿏??[backend/.env](D:/Code305/JamIssue/backend/.env) ?먮뒗 ?쒕쾭 ?꾩슜 媛믪쓣 ?〓땲??

```bash
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=8001
APP_CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
APP_FRONTEND_URL=http://localhost:8000
APP_SESSION_SECRET=CHANGE_ME_LOCAL_SESSION_SECRET
APP_SESSION_HTTPS=false
APP_DATABASE_URL=mysql+pymysql://jamissue:jamissue@127.0.0.1:3306/jamissue?charset=utf8mb4
APP_NAVER_LOGIN_CLIENT_ID=YOUR_NAVER_LOGIN_CLIENT_ID
APP_NAVER_LOGIN_CLIENT_SECRET=YOUR_NAVER_LOGIN_CLIENT_SECRET
APP_NAVER_LOGIN_CALLBACK_URL=http://localhost:8000/api/auth/naver/callback
```
운영 대시보드는 `APP_ADMIN_USER_IDS` 에 지정한 사용자 ID에게만 보입니다. 개발환경이라고 자동 노출되지 않습니다.

## ?ㅼ씠踰?Maps API ?좏깮

?꾩옱 PRD? 援ы쁽 湲곗??쇰줈??`Dynamic Map` 留?諛쒓툒諛쏆쑝硫??⑸땲??

- 吏湲??깆뿉???ㅼ젣濡??곕뒗 吏??湲곕뒫
  - ????쒖젙 ?명꽣?숉떚釉?吏???뚮뜑留?  - 留덉빱 ?쒖떆
  - ?μ냼 ?좏깮
- 吏湲??뱀옣 ?꾩슂 ?녿뒗 ??ぉ
  - `Static Map`
  - `Directions 5`
  - `Directions 15`
  - `Geocoding`
  - `Reverse Geocoding`

利? ?ㅼ씠踰?Cloud ?뚮옯?쇱뿉??Maps Application??留뚮뱾 ?뚮뒗 ?곗꽑 `Dynamic Map` 留??좏깮?섎㈃ ?⑸땲??

二쇱쓽:

- 吏???ㅻ뒗 猷⑦듃 [`.env`](D:/Code305/JamIssue/.env) ??`PUBLIC_NAVER_MAP_CLIENT_ID` ???ｌ뒿?덈떎.
- ?꾩옱 鍮뚮뱶 ?ㅽ겕由쏀듃??`PUBLIC_NAVER_MAP_CLIENT_ID` ? `NAVER_MAP_CLIENT_ID` ?????쎌뒿?덈떎.
- ?ㅼ씠踰?濡쒓렇?몄슜 `Client ID / Client Secret` ? [backend/.env](D:/Code305/JamIssue/backend/.env) ??`APP_NAVER_LOGIN_CLIENT_ID`, `APP_NAVER_LOGIN_CLIENT_SECRET` ???ｌ뒿?덈떎.
- 吏???ㅼ? 濡쒓렇???ㅻ뒗 ?쒕줈 ?ㅻⅨ ?⑸룄?낅땲??
- `NAVER_MAP_SECRET` 媛믪? Dynamic Map ?뚮뜑留곸뿉???ъ슜?섏? ?딆뒿?덈떎.
- `127.0.0.1` ?먮뒗 `localhost` 瑜??깅줉??媛쒕컻??吏???ㅻ뒗 釉뚮씪?곗??먯꽌 吏곸젒 ?곕뒗 ?ㅼ씠誘濡? 鍮꾨?泥섎읆 痍④툒?????놁뒿?덈떎.
- 媛쒕컻??吏???ㅼ? ?댁쁺??吏???ㅻ뒗 諛섎뱶??遺꾨━?섏꽭??
- 媛쒕컻???ㅻ뒗 `localhost/127.0.0.1` ?꾩슜 ?깆쑝濡쒕쭔 諛쒓툒?섍퀬, ?ъ슜???쒗븳怨??뚮┝???④퍡 ?ㅼ젙?섎뒗 ?몄씠 ?덉쟾?⑸땲??
- ?댁쁺???ㅻ뒗 ?ㅼ젣 ?쒕퉬???꾨찓?몃쭔 ?깅줉??蹂꾨룄 ?깆쑝濡?諛쒓툒?댁빞 ?⑸땲??

## 二쇱슂 臾몄꽌

- [backend/README.md](D:/Code305/JamIssue/backend/README.md)
- [infra/nginx/README.md](D:/Code305/JamIssue/infra/nginx/README.md)
- [backend/sql/schema.sql](D:/Code305/JamIssue/backend/sql/schema.sql)

## ?꾩옱 API 踰붿쐞

- `GET /api/health`
- `GET /api/auth/me`
- `GET /api/auth/providers`
- `GET /api/auth/naver/login`
- `GET /api/auth/naver/callback`
- `POST /api/auth/logout`
- `GET /api/bootstrap`
- `GET /api/places`
- `GET /api/places/{place_id}`
- `GET /api/courses`
- `GET /api/reviews`
- `POST /api/reviews`
- `GET /api/reviews/{review_id}/comments`
- `POST /api/reviews/{review_id}/comments`
- `POST /api/reviews/upload`
- `GET /api/my/summary`
- `GET /api/stamps`
- `POST /api/stamps/toggle`
- `GET /api/admin/summary`
- `PATCH /api/admin/places/{place_id}`
- `POST /api/admin/import/public-data`

## ?ㅼ쓬 鍮뚮뱶???곗꽑?쒖쐞

1. README? ?듭떖 ?낆뒪?몃쭅 ?뺣━
2. 怨듦났?곗씠???ㅼ뿰???대뙌??異붽?
3. ?ㅼ씠踰???濡쒓렇???쒓났??援ы쁽
4. ?뚯뒪??踰붿쐞? ?댁쁺 愿痢≪꽦 ?뺣?
