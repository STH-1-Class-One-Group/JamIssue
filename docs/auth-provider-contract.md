# Auth Provider Contract

## URL 선택 규칙

Web Front는 `/api/auth/providers` 응답의 provider URL을 다음처럼 구분해 사용한다.

- 비로그인 일반 로그인 버튼은 `loginUrl`만 사용한다.
- 로그인 상태의 계정 연동 UI는 `linkUrl`만 사용한다.
- `linkUrl`이 없거나 provider가 disabled이면 계정 연동 버튼을 노출하지 않는다.
- 이미 연결된 provider는 `SessionUser.linkedProviders`를 기준으로 `연결됨` 상태만 표시하고 연동 액션으로 노출하지 않는다.

## Backend Login Guard

Backend/provider Worker는 로그인된 사용자가 다른 provider의 `/api/auth/{provider}/login`을 호출하는 오사용을 link-mode OAuth state로 방어한다. 같은 provider의 `/login` 재호출은 OAuth를 시작하지 않고 `provider-already-linked` error redirect를 반환한다.

이 guard는 방어막일 뿐 Web Front의 정상 연동 경로가 아니다. Web Front 계정 연동 UI와 action은 계속 `providers[].linkUrl`을 사용해야 한다.
