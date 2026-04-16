interface MyPageLoadErrorProps {
  myPageError: string;
  onRetry: () => Promise<void>;
}

export function MyPageLoadError({ myPageError, onRetry }: MyPageLoadErrorProps) {
  return (
    <section className="sheet-card stack-gap">
      <div>
        <p className="eyebrow">MY PAGE</p>
        <h3>기록을 아직 불러오지 못했어요</h3>
        <p className="section-copy">{myPageError}</p>
      </div>
      <button type="button" className="primary-button route-submit-button" onClick={() => void onRetry()}>
        다시 불러오기
      </button>
    </section>
  );
}
