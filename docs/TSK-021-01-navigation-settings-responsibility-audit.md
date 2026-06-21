# TSK-021-01 Navigation / Settings Responsibility Audit

Scope-ID: TSK-021-01
Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/621
Parent Issue: https://github.com/STH-1-Class-One-Group/JamIssue/issues/620
Branch: navigation-settings-responsibility-audit
Status: audit baseline

## 목적

앱 내비게이션, 마이페이지, 계정 설정, 앱 설정, 햄버거 메뉴, 지도 표시 설정의 책임을 구현 전에 분리해 둔다. 이 문서는 TSK-021 하위 구현 PR이 기능을 추가할 때 어느 컴포넌트가 어떤 책임을 가져야 하는지 판단하는 기준이다.

## 현재 코드 기준

| 책임 | 현재 소유 코드 | 현재 역할 | TSK-021 기준 |
| --- | --- | --- | --- |
| 1차 화면 전환 | `src/components/BottomNav.tsx` | `지도 / 행사 / 피드 / 코스 / 마이` 5개 탭과 `onChange(tab)`만 소유 | 설정, 관리자, 알림, 피드백, 프로필 편집을 하단 탭에 추가하지 않는다 |
| 상단 앱 크롬 | `src/components/app-shell/AppCapsule.tsx`, `src/components/AppTopNavigation.tsx` | 햄버거, 중앙 slot, 뒤로가기, `GlobalSettingsMenu` action을 조립 | 탭별 center control을 주입하되 계정 설정이나 앱 설정 내용을 직접 소유하지 않는다 |
| 전역 앱 설정 진입 | `src/components/GlobalSettingsMenu.tsx` | 알람과 피드백 진입을 제공 | TSK-021-04에서 앱 표시 설정과 알림 범위를 받을 수 있는 `AppSettingsPanel` 경계로 확장한다 |
| 햄버거 메뉴 | `src/components/app-shell/SideDrawer.tsx`, `src/components/AppTopNavigation.tsx` | 비어 있는 side drawer shell만 제공 | 하단 탭 중복 메뉴가 아니라 secondary/admin/dev/help 진입만 다룬다 |
| 마이페이지 대시보드 | `src/components/MyPagePanel.tsx`, `src/components/my-page/MyPageOverviewSection.tsx`, `src/components/my-page/MyPageTabContent.tsx` | 내 기록 헤더, 방문 통계, 스탬프/피드/댓글/코스 탭, admin lazy panel을 조립 | 개인 활동/통계/컬렉션 대시보드가 중심이며 앱 표시 설정을 소유하지 않는다 |
| 계정 설정 | `src/components/my-page/MyPageAccountSection.tsx`, `src/components/my-page/MyPageSettingsSection.tsx` | 프로필명, 아바타, 소셜 연결, 로그아웃을 다룬다 | 계정/프로필 관리만 포함한다. 지도/KTO 표시, 알림 범위, 피드백은 앱 설정으로 보낸다 |
| 지도 표시 설정 | 현재 명시 경계 없음 | KTO/curated 표시 정책이 map state와 UI control에 흩어질 수 있음 | TSK-021-05에서 `AppPreferences`/`MapPreferences`로 분리한다 |

## 책임 Matrix

| 기능 | BottomNav | My Page | Account Settings | App Settings | Hamburger | Map Preferences |
| --- | --- | --- | --- | --- | --- | --- |
| 지도/행사/피드/코스/마이 전환 | 소유 | 제외 | 제외 | 제외 | 제외 | 제외 |
| 방문 통계/스탬프/피드/댓글/코스 기록 | 제외 | 소유 | 제외 | 제외 | 제외 | 제외 |
| 프로필명/아바타/소셜 연결/로그아웃 | 제외 | 진입만 제공 | 소유 | 제외 | 제외 | 제외 |
| 알람/피드백 | 제외 | 제외 | 제외 | 소유 | 제외 | 제외 |
| KTO ON 시 curated 포함 여부 | 제외 | 제외 | 제외 | 진입 제공 | 제외 | 소유 |
| 관리자/개발자 보조 진입 | 제외 | 제외 | 제외 | 제외 | 조건부 소유 | 제외 |

## 후속 Child Routing

| Child | 책임 |
| --- | --- |
| TSK-021-02 | 마이페이지를 활동/통계 대시보드 우선 구조로 정리 |
| TSK-021-03 | 프로필/아바타/소셜/로그아웃 계정 설정 경계 분리 |
| TSK-021-04 | 전역 앱 설정 패널과 알람/피드백 진입 재배치 |
| TSK-021-05 | `showCuratedWithTourism` 등 지도 표시 preference 구현 |
| TSK-021-06 | 햄버거 secondary/admin/dev 메뉴 정책 구현 |
| TSK-021-07 | 경계 회귀 E2E와 문서 추적성 정리 |

## Architecture Boundary Evidence

Responsibility map: BottomNav는 1차 탭만, My Page는 개인 활동/통계만, Account Settings는 계정/프로필만, App Settings는 앱 환경 설정만, Hamburger는 보조 진입만, Map Preferences는 지도 표시 정책만 소유한다.

Dependency direction: app shell은 owner-local panel을 호출하고, My Page는 my-page 데이터와 account settings만 조립한다. settings panel은 primary tab definition을 import하지 않는다.

Validation seam: `test/unit/navigation-settings-responsibility-source-quality.test.ts`가 코드 경계를 정적 readback으로 검증한다.

Scope map: TSK-021-01은 문서와 source-quality guard만 다룬다. 사용자 동작 변경은 TSK-021-02 이후 child issue에서 처리한다.

Architecture risk: 계정 설정, 앱 설정, 알림, 지도 표시 설정, 햄버거 메뉴를 한 컴포넌트에 모으면 God component가 생기고 My Page가 계정 설정과 앱 설정을 모두 흡수하게 된다.
