import type { ReactNode } from 'react';

export type SecondaryMenuItemId = 'usage-guide' | 'admin-tools';

export type SecondaryMenuItem = {
  id: SecondaryMenuItemId;
  label: string;
  description: string;
  icon?: ReactNode;
};

export type SecondaryMenuCapabilities = {
  canOpenAdminTools?: boolean;
  isAdmin?: boolean;
};

const primaryNavigationLabels = new Set(['지도', '행사', '피드', '코스', '마이']);
const appSettingsLabels = new Set(['알림', '피드백', '지도 표시', '설정']);
const accountSettingsLabels = new Set(['프로필 설정', '사진 변경', '사진 삭제', '로그아웃', '소셜 계정']);

export function resolveSecondaryMenuItems({
  canOpenAdminTools = false,
  isAdmin = false,
}: SecondaryMenuCapabilities = {}): SecondaryMenuItem[] {
  const items: SecondaryMenuItem[] = [
    {
      id: 'usage-guide',
      label: '이용 안내',
      description: '하단 탭은 주요 화면 이동, 톱니바퀴는 앱 설정, 마이페이지는 내 기록과 계정 관리를 담당합니다.',
    },
  ];

  if (isAdmin && canOpenAdminTools) {
    items.push({
      id: 'admin-tools',
      label: '관리 도구',
      description: '관리자에게만 노출되는 보조 진입점입니다.',
    });
  }

  return items;
}

export function isReservedPrimaryOrSettingsLabel(label: string): boolean {
  return primaryNavigationLabels.has(label) || appSettingsLabels.has(label) || accountSettingsLabels.has(label);
}
