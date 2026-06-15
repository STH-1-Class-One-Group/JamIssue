import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setVisible(false), 1100);
    const unmountTimer = window.setTimeout(onDone, 1400);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [onDone]);

  return (
    <div className={visible ? 'app-splash' : 'app-splash app-splash--hidden'} data-testid="app-splash">
      <div className="app-splash__mark" aria-hidden="true">
        <span>J</span>
      </div>
      <p className="app-splash__eyebrow">DAEJEON LOCAL GUIDE</p>
      <p className="app-splash__title">JAM ISSUE</p>
    </div>
  );
}
