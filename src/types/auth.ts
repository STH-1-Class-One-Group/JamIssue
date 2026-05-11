export type ProviderKey = 'naver' | 'kakao';

export interface SessionUser {
  id: string;
  nickname: string;
  email: string | null;
  provider: string;
  profileImage: string | null;
  isAdmin: boolean;
  profileCompletedAt: string | null;
}

export interface AuthProvider {
  key: ProviderKey;
  label: string;
  isEnabled: boolean;
  loginUrl: string | null;
}

