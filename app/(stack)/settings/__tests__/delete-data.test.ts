import { pruneCustomSupplementReferences } from '../delete-data';

describe('pruneCustomSupplementReferences', () => {
  it('removes custom multivitamin entries from all supplement plans', () => {
    const plans = {
      supplements: [
        {
          name: 'Morning',
          prefferedTime: '08:00',
          notify: false,
          supplements: [
            {
              supplement: { id: 'vitamin-d', name: 'Vitamin D', quantity: '1', unit: 'µg' },
              startedAt: '2024-01-01',
              createdBy: 'user',
              planName: 'Morning',
              prefferedTime: '08:00',
              notify: false,
            },
            {
              supplement: {
                id: 'custom-1',
                name: 'My Multivitamin',
                quantity: '1',
                unit: 'tablet',
                components: [{ id: 'vitamin-d', name: 'Vitamin D', quantity: '1', unit: 'µg' }],
              },
              startedAt: '2024-01-01',
              createdBy: 'user',
              planName: 'Morning',
              prefferedTime: '08:00',
              notify: false,
            },
          ],
        },
      ],
      training: [],
      nutrition: [],
      other: [],
      reasonSummary: { text: '', createdAt: '' },
    };

    const customSupplements = [
      { id: 'custom-1', name: 'My Multivitamin', quantity: '1', unit: 'tablet', components: [{ id: 'vitamin-d', name: 'Vitamin D', quantity: '1', unit: 'µg' }] },
    ];

    const result = pruneCustomSupplementReferences(plans, customSupplements);

    expect(result.supplements[0].supplements).toHaveLength(1);
    expect(result.supplements[0].supplements[0].supplement.id).toBe('vitamin-d');
  });
});
