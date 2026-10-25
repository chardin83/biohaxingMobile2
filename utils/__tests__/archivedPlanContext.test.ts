import type { ArchivedPlansByCategory } from '@/app/context/storage/plans/planTypes';

import { getArchivedPlanContext } from '../archivedPlanContext';

it('provides tried tip and supplement IDs and dates without private comments', () => {
  const entries: ArchivedPlansByCategory = {
    training: [
      {
        tipId: 'daily_walk',
        startedAt: '2026-09-01',
        endedAt: '2026-10-01',
        comment: 'Private note',
        createdBy: 'you',
        editedAt: '',
        editedBy: 'you',
        planCategory: 'training',
      },
    ],
    nutrition: [],
    other: [],
    supplements: [
      {
        supplement: { id: 'magnesium', name: 'Magnesium', quantity: '100', unit: 'mg' },
        startedAt: '2026-09-01',
        endedAt: '2026-10-01',
        createdBy: 'you',
        planName: 'Evening',
        prefferedTime: '21:00',
        notify: false,
      },
    ],
  };
  const context = getArchivedPlanContext(entries);
  expect(context.training).toEqual([{ tipId: 'daily_walk', startedAt: '2026-09-01', endedAt: '2026-10-01' }]);
  expect(context.supplements[0]).toMatchObject({ supplementId: 'magnesium', name: 'Magnesium', endedAt: '2026-10-01' });
  expect(JSON.stringify(context)).not.toContain('Private note');
  expect(context.supplements[0]).not.toHaveProperty('quantity');
});
