import { useEffect, useState } from 'react';
import { getPublicEventBanner } from '../../api/bootstrapClient';
import type { PublicEventBannerResponse } from '../../publicEventTypes';

const INITIAL_DATA: PublicEventBannerResponse = {
  sourceReady: false,
  sourceName: null,
  importedAt: null,
  items: [],
};

export function useRoadmapBannerPreviewData() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [data, setData] = useState<PublicEventBannerResponse>(INITIAL_DATA);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadBanner() {
      try {
        const response = await getPublicEventBanner();
        if (!active) {
          return;
        }
        setData(response);
        setStatus('ready');
      } catch (error) {
        if (!active) {
          return;
        }
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : '행사 일정을 불러오지 못했어요.');
      }
    }

    void loadBanner();
    return () => {
      active = false;
    };
  }, []);

  return { status, data, errorMessage };
}
