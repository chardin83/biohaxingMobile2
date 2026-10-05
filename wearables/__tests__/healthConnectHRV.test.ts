import { readRecords } from 'react-native-health-connect';

import { HealthConnectAdapter } from '../healthConnectAdapter';

jest.mock('react-native-health-connect', () => ({
  SdkAvailabilityStatus: { SDK_AVAILABLE: 3 },
  getSdkStatus: jest.fn().mockResolvedValue(3),
  initialize: jest.fn().mockResolvedValue(true),
  readRecords: jest.fn(),
}));
jest.mock('@/app/context/storage/userProfile/userProfileStore', () => ({ getUserProfile: jest.fn() }));

describe('Health Connect HRV import', () => {
  it('reads subsequent pages and retains all sample timestamps', async () => {
    const read = jest.mocked(readRecords);
    read.mockResolvedValueOnce({
      records: [{ time: '2026-10-05T10:00:00+02:00', heartRateVariabilityMillis: 40 }] as any,
      pageToken: 'next-page',
    });
    read.mockResolvedValueOnce({
      records: [{ time: '2026-10-05T10:05:00+02:00', heartRateVariabilityMillis: 45 }] as any,
    });
    const range = { start: '2026-10-05T00:00:00Z', end: '2026-10-06T00:00:00Z' };

    const samples = await new HealthConnectAdapter().getHRV(range);

    expect(read).toHaveBeenCalledTimes(2);
    expect(read).toHaveBeenNthCalledWith(2, 'HeartRateVariabilityRmssd', expect.objectContaining({ pageToken: 'next-page', ascendingOrder: true }));
    expect(samples).toEqual([
      expect.objectContaining({ recordedAt: '2026-10-05T08:00:00.000Z', rmssdMs: 40 }),
      expect.objectContaining({ recordedAt: '2026-10-05T08:05:00.000Z', rmssdMs: 45 }),
    ]);
  });
});
