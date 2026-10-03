import { fromDateKey, getAge, toDateKey } from '@/utils/dateUtils';

describe('birthday dates', () => {
  it.each([
    [new Date(2026, 9, 2), 25],
    [new Date(2026, 9, 3), 26],
    [new Date(2026, 9, 4), 26],
    [new Date(2026, 0, 1), 25],
  ])('calculates completed years on %s', (today, expected) => {
    expect(getAge(new Date(2000, 9, 3), today)).toBe(expected);
  });

  it('preserves the local birthday when serializing and loading', () => {
    const birthday = new Date(2000, 9, 3, 23, 30);
    expect(toDateKey(birthday)).toBe('2000-10-03');
    const restored = fromDateKey(toDateKey(birthday));
    expect(restored.getFullYear()).toBe(2000);
    expect(restored.getMonth()).toBe(9);
    expect(restored.getDate()).toBe(3);
  });

  it('handles a leap day birthday', () => {
    expect(getAge(new Date(2000, 1, 29), new Date(2024, 1, 28))).toBe(23);
    expect(getAge(new Date(2000, 1, 29), new Date(2024, 1, 29))).toBe(24);
  });
});
