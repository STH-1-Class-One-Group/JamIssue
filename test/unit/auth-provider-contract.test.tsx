import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildProviderAuthUrl, getProviderLinkUrl, getProviderLoginUrl } from '../../src/api/authClient';
import { ProviderButtons } from '../../src/components/ProviderButtons';
import { MyPageSettingsSection } from '../../src/components/my-page/MyPageSettingsSection';
import type { AuthProvider, SessionUser } from '../../src/types/auth';

const API_BASE_URL = 'https://api.example.test';
const FRONTEND_RETURN_URL = 'https://daejeon.jamissue.com/?tab=my';
const KAKAO_LABEL = '\uCE74\uCE74\uC624';
const NAVER_LABEL = '\uB124\uC774\uBC84';
const CONNECTED_LABEL = '\uC5F0\uACB0\uB428';
const SOCIAL_ACCOUNT_LABEL = '\uC18C\uC15C \uACC4\uC815';
const LINK_ACCOUNT_LABEL = '\uACC4\uC815 \uC5F0\uB3D9';

const kakaoProvider: AuthProvider = {
  key: 'kakao',
  label: 'Kakao',
  isEnabled: true,
  loginUrl: '/api/auth/kakao/login',
  linkUrl: '/api/auth/kakao/link',
};

const naverProvider: AuthProvider = {
  key: 'naver',
  label: 'Naver',
  isEnabled: true,
  loginUrl: '/api/auth/naver/login',
  linkUrl: '/api/auth/naver/link',
};

const sessionUser: SessionUser = {
  id: 'user-1',
  nickname: 'tester',
  email: null,
  provider: 'kakao',
  linkedProviders: ['kakao'],
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: '2026-05-29T00:00:00.000Z',
};

function renderSettingsSection({
  user = sessionUser,
  providers = [kakaoProvider, naverProvider],
  onLinkProvider = vi.fn(),
}: {
  user?: SessionUser;
  providers?: AuthProvider[];
  onLinkProvider?: (provider: AuthProvider) => void;
} = {}) {
  render(
    <MyPageSettingsSection
      sessionUser={user}
      providers={providers}
      nickname={user.nickname}
      showSettings
      profileCompletedAt={user.profileCompletedAt}
      profileSaving={false}
      profileError={null}
      onLinkProvider={onLinkProvider}
      onNicknameChange={vi.fn()}
      onClose={vi.fn()}
      onSubmit={async () => undefined}
    />,
  );
}

beforeEach(() => {
  window.__JAMISSUE_CONFIG__ = {
    apiBaseUrl: API_BASE_URL,
  };
});

describe('auth provider contract', () => {
  it('builds login and account-link URLs from provider-supplied contract URLs', () => {
    expect(getProviderLoginUrl(kakaoProvider, FRONTEND_RETURN_URL)).toBe(
      `${API_BASE_URL}/api/auth/kakao/login?next=https%3A%2F%2Fdaejeon.jamissue.com%2F%3Ftab%3Dmy`,
    );
    expect(getProviderLinkUrl(naverProvider, FRONTEND_RETURN_URL)).toBe(
      `${API_BASE_URL}/api/auth/naver/link?next=https%3A%2F%2Fdaejeon.jamissue.com%2F%3Ftab%3Dmy`,
    );
    expect(getProviderLinkUrl({ ...naverProvider, linkUrl: null }, FRONTEND_RETURN_URL)).toBeNull();
  });

  it('preserves absolute provider origins while adding the return URL', () => {
    expect(buildProviderAuthUrl('https://oauth.example.test/auth/link?prompt=login', FRONTEND_RETURN_URL)).toBe(
      'https://oauth.example.test/auth/link?prompt=login&next=https%3A%2F%2Fdaejeon.jamissue.com%2F%3Ftab%3Dmy',
    );
  });
});

describe('provider login and account-link controls', () => {
  it('uses enabled provider loginUrl availability for guest login buttons', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    const missingLoginUrl = { ...naverProvider, loginUrl: null };

    render(<ProviderButtons providers={[kakaoProvider, missingLoginUrl]} onLogin={onLogin} />);

    await user.click(screen.getByRole('button', { name: `${KAKAO_LABEL}\uB85C \uB85C\uADF8\uC778` }));

    expect(onLogin).toHaveBeenCalledWith(kakaoProvider);
    expect(screen.getByRole('button', { name: `${NAVER_LABEL} \uC900\uBE44 \uC911` })).toBeDisabled();
  });

  it('shows linked providers and account-link buttons from linkedProviders contract', async () => {
    const user = userEvent.setup();
    const onLinkProvider = vi.fn();

    renderSettingsSection({ onLinkProvider });

    expect(screen.getByText(KAKAO_LABEL)).toBeInTheDocument();
    expect(screen.getByText(CONNECTED_LABEL)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(KAKAO_LABEL) })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: new RegExp(`${NAVER_LABEL}.*${LINK_ACCOUNT_LABEL}`) }));

    expect(onLinkProvider).toHaveBeenCalledWith(naverProvider);
  });

  it('shows connected account state even when provider list has no linkable rows yet', () => {
    renderSettingsSection({ providers: [] });

    expect(screen.getByLabelText(`\uC5F0\uACB0\uB41C ${SOCIAL_ACCOUNT_LABEL}`)).toBeInTheDocument();
    expect(screen.getByText(SOCIAL_ACCOUNT_LABEL)).toBeInTheDocument();
    expect(screen.getByText(KAKAO_LABEL)).toBeInTheDocument();
    expect(screen.getByText(CONNECTED_LABEL)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(LINK_ACCOUNT_LABEL) })).not.toBeInTheDocument();
  });

  it('shows all linked providers without account-link buttons when both providers are linked', () => {
    renderSettingsSection({
      user: { ...sessionUser, linkedProviders: ['kakao', 'naver'] },
    });

    expect(screen.getByText(KAKAO_LABEL)).toBeInTheDocument();
    expect(screen.getByText(NAVER_LABEL)).toBeInTheDocument();
    expect(screen.getAllByText(CONNECTED_LABEL)).toHaveLength(2);
    expect(screen.queryByRole('button', { name: new RegExp(LINK_ACCOUNT_LABEL) })).not.toBeInTheDocument();
  });

  it('hides unlinked account-link providers that have no linkUrl or are disabled', () => {
    renderSettingsSection({
      providers: [
        { ...kakaoProvider, isEnabled: false },
        { ...naverProvider, linkUrl: null },
      ],
    });

    expect(screen.getByText(KAKAO_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(NAVER_LABEL)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(LINK_ACCOUNT_LABEL) })).not.toBeInTheDocument();
  });

});
