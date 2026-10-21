import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { refundFreePhotoAnalysis, reserveFreePhotoAnalysis } from '@/services/nutrition/photoAnalysisQuota';

import { useFreePhotoAnalysesRemaining } from '../useFreePhotoAnalysesRemaining';

it('updates access after the last trial is used and after a failed analysis refunds it', async () => {
  await AsyncStorage.setItem('premiumTrialPhotoAnalysesUsed', '2');
  const { result } = renderHook(() => useFreePhotoAnalysesRemaining());
  await waitFor(() => expect(result.current).toBe(1));

  await act(async () => {
    await reserveFreePhotoAnalysis();
  });
  await waitFor(() => expect(result.current).toBe(0));

  await act(async () => {
    await refundFreePhotoAnalysis();
  });
  await waitFor(() => expect(result.current).toBe(1));
});
