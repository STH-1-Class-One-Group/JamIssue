# App Bootstrap Refactor Postmortem

## 배경

`App.tsx`를 여러 hook과 stage 컴포넌트로 분리한 뒤, 배포 환경에서 다음 증상이 섞여서 나타났다.

- 초기 응답이 10초 이상 지연됨
- 지도 장소, 축제, 커뮤니티 데이터가 비어 보임
- 네이버 로그인과 알림 연결이 불안정하게 보임
- 어떤 시점에는 일부 API만 붙고, 어떤 시점에는 전체 앱이 초기화되지 않은 것처럼 보임

겉으로는 API 장애처럼 보였지만, 실제 원인은 `App` 분리 이후 생긴 부트스트랩 사이드 이펙트와 effect 의존성 변화였다.

## 실제 원인

### 1. 초기 부트스트랩이 느린 데이터 요청까지 함께 기다림

리팩토링 이후 초기 앱 진입이 `map-bootstrap`뿐 아니라 축제 목록까지 한 번에 기다리는 구조와 비슷한 체감이 생겼다.
축제/공공행사 데이터는 외부 소스를 경유할 수 있어 응답 편차가 컸고, 이 지연이 초기 화면 준비 전체를 끌어내렸다.

영향:

- 첫 진입이 느려짐
- 사용자는 "앱이 아예 안 붙는다"고 느끼기 쉬움

### 2. App 분리 이후 callback identity가 자주 바뀌며 bootstrap effect와 강하게 결합됨

`refreshMyPageForUser`, `resetReviewCaches`, `goToTab`, 에러 핸들러 같은 함수들이 `App.tsx`에서 분리된 hook들로 이동하면서,
각 hook의 state 의존성에 따라 함수 identity가 바뀔 수 있는 구조가 됐다.

이 상태에서 bootstrap effect가 이 함수들을 직접 의존성 배열에 물고 있으면 다음 문제가 생긴다.

- 초기 effect가 실행됨
- 중간에 state 변경으로 관련 callback identity가 바뀜
- cleanup이 먼저 실행되며 `active = false`가 됨
- 이어지는 재실행/재진입 타이밍에 따라 bootstrap이 불안정해짐

특히 한 번만 실행하도록 넣었던 `hasBootstrappedRef` 가드는
"불필요한 재부팅 방지"에는 도움이 됐지만,
초기 실행이 cleanup으로 취소된 뒤에는 다음 실행까지 막아버릴 수 있었다.

그 결과:

- `map-bootstrap` 결과가 state에 안정적으로 반영되지 않음
- `providers`가 기본값에 머물 수 있음
- `sessionUser`/`myPage`가 비어 보여 로그인/알림이 끊긴 것처럼 보임
- 지도 장소/알림/마이페이지가 같은 축에서 함께 흔들림

즉, 개별 컴포넌트 연결 누락이라기보다
`App` 분리 이후 bootstrap effect와 callback 생명주기가 서로 너무 강하게 엮인 것이 핵심 원인이었다.

## 수정 내용

### 1. 초기 화면과 축제 로드를 분리

초기 부트스트랩에서는 `getMapBootstrap()`만 우선 완료해 앱을 먼저 띄우고,
`getFestivals()`는 백그라운드로 분리했다.

효과:

- 지도/세션/provider가 먼저 붙음
- 느린 축제 데이터가 첫 화면 전체를 막지 않음

### 2. 1회 bootstrap 가드를 제거하고, 최신 callback을 ref로 추적

`src/hooks/useAppBootstrapLifecycle.ts`에서 다음 방식으로 구조를 바꿨다.

- `hasBootstrappedRef` 제거
- `refreshMyPageForUser`
- `resetReviewCaches`
- `goToTab`
- `formatErrorMessage`
- `reportBackgroundError`

위 함수들은 effect dependency로 직접 묶지 않고 `useRef`로 최신 참조만 따라가게 변경했다.

이렇게 바꾸면:

- bootstrap effect는 mount 기준으로 안정적으로 실행됨
- callback identity가 바뀌어도 bootstrap 자체가 취소/봉인되지 않음
- cleanup 때문에 첫 실행이 무효화돼도 다음 실행이 막히지 않음

정리하면 "재실행 억제"를 ref 가드로 해결하려 하지 않고,
"effect가 참조하는 함수 안정성"을 ref로 분리해 lifecycle 충돌을 없앴다.

## 결과

배포 확인 기준으로 현재는 다음 상태로 정리됐다.

- API는 개별적으로 정상 응답함
- 지도/로그인/알림이 모두 다시 연결됨
- 초기 진입 체감도 개선됨

## 교훈

`App.tsx`를 분리할 때는 렌더 책임만 나누는 것으로 끝나지 않는다.
특히 bootstrap, auth hydration, route sync, notification 연결처럼 "앱 시작 시점"에 묶인 effect는
callback identity 변화와 cleanup 타이밍까지 같이 설계해야 한다.

앞으로 비슷한 리팩토링에서는 다음 원칙을 유지한다.

- 초기 부트스트랩은 가장 작은 필수 데이터만 기다린다
- 느린 보조 데이터는 백그라운드로 분리한다
- mount 성격의 effect에 잦게 변하는 callback을 직접 dependency로 물리지 않는다
- 재실행 방지는 ref 가드보다, effect 입력 안정화로 먼저 해결한다
