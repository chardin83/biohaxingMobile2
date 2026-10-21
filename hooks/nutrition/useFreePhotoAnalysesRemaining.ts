import { useEffect, useState } from 'react';

import { getFreePhotoAnalysesRemaining, subscribePhotoAnalysisQuota } from '@/services/nutrition/photoAnalysisQuota';

export function useFreePhotoAnalysesRemaining(): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () =>
      getFreePhotoAnalysesRemaining()
        .then(value => {
          if (active) setRemaining(value);
        })
        .catch(console.error);
    const unsubscribe = subscribePhotoAnalysisQuota(() => {
      void refresh();
    });
    void refresh();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  return remaining;
}
