import type { AuthProvider, ProviderKey } from '../../types';
import { ProviderButtons } from '../ProviderButtons';

interface MyPageGuestStateProps {
  providers: AuthProvider[];
  onLogin: (provider: ProviderKey) => void;
}

export function MyPageGuestState({ providers, onLogin }: MyPageGuestStateProps) {
  return (
    <>
      <header className="panel-header">
        <p className="eyebrow">MY PAGE</p>
        <h2>로그인하고 기록 이어보기</h2>
        <p>스탬프와 리뷰, 코스를 계정 기준으로 이어보려면 먼저 로그인해 주세요.</p>
      </header>
      <section className="sheet-card stack-gap">
        <ProviderButtons providers={providers} onLogin={onLogin} />
      </section>
    </>
  );
}
