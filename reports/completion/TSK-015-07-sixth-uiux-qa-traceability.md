# TSK-015-07 6차 UI/UX QA Traceability

Scope-ID: `TSK-015-07`
Issue: [#497](https://github.com/STH-1-Class-One-Group/JamIssue/issues/497)
Parent Issue: [#490](https://github.com/STH-1-Class-One-Group/JamIssue/issues/490)
Branch: `sixth-uiux-qa-traceability`
Status: PR 준비 중

## 목적

6차 UI/UX 바텀드로워, 하단 네비게이션, PWA/iOS 아이콘 개편 결과를 Wiki, repo docs, UI/UX QA matrix, release candidate, parent/child issue evidence로 추적 가능하게 정리한다.

## 포함 근거

| Child | PR | Merge SHA | 요약 |
| --- | --- | --- | --- |
| `TSK-015-01` | [#498](https://github.com/STH-1-Class-One-Group/JamIssue/pull/498) | `c8cf656aac2d229ae8cf5fc37bc007ff1c179fa8` | 6차 UI/UX audit baseline |
| `TSK-015-02` | [#499](https://github.com/STH-1-Class-One-Group/JamIssue/pull/499) | `5e4e90b0346cdcaa1b1911af87104f2c4233452c` | drawer state model |
| `TSK-015-03` | [#500](https://github.com/STH-1-Class-One-Group/JamIssue/pull/500) | `3fda7885b295586c0e069b61c549b2eb20538c33` | shared drawer shell redesign |
| `TSK-015-04` | [#501](https://github.com/STH-1-Class-One-Group/JamIssue/pull/501) | `64e2b82079371f18a4b60677dcdde3e25d607c33` | bottom nav icon pill |
| `TSK-015-05` | [#502](https://github.com/STH-1-Class-One-Group/JamIssue/pull/502) | `0fb872248a35ad06bdc1d02ddefc6a975550e428` | PWA app icon brand assets |
| `TSK-015-06` | [#503](https://github.com/STH-1-Class-One-Group/JamIssue/pull/503) | `7053f575ac82378e7d506a0e28b2a28719f534b1` | drawer/nav CSS policy cleanup |

## Architecture Boundary Gate

- Responsibility map: 문서는 `MapBottomSheet`, `BottomNav`, PWA asset build policy의 owner와 완료 근거만 기록한다.
- Dependency direction: parent roadmap -> child issue -> PR -> validation evidence -> release candidate note 흐름으로 정리한다.
- Test seam: docs link/readback, UTF-8 integrity, required local validation, PR checks, issue evidence를 완료 근거로 사용한다.
- Scope map: repo docs, Wiki clone, release candidate note, UI/UX QA matrix, issue evidence만 포함한다.
- Architecture risk: 구현 증거 없이 평가 문구만 남는 위험이 있으므로 PR URL, merge SHA, CI/검증 명령 근거 중심으로 기록한다.

## 검증 계획

완료 전 아래 명령을 실행하고 결과를 #497과 PR에 기록한다.

```powershell
npm.cmd run check:numeric-literals
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run test:regression
npm.cmd run test:e2e
npm.cmd run build
git diff --check
```

추가로 touched files UTF-8 integrity check와 Wiki repo 링크/readback을 확인한다.
