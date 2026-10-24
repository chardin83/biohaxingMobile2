import { stringChecksum } from '../stringChecksum';

it.each([
  ['', 'cbf29ce484222325'],
  ['a', 'af63dc4c8601ec8c'],
  ['hello', 'a430d84680aabd0b'],
])('matches the FNV-1a 64-bit reference for %s', (input, hex) => {
  expect(stringChecksum(input)).toBe(`fnv1a64:${hex}`);
});

it('handles Swedish text and emoji deterministically with a fixed storage size', () => {
  const input = 'Måltid med sötpotatis 🍽️'.repeat(1000);
  expect(stringChecksum(input)).toMatch(/^fnv1a64:[0-9a-f]{16}$/);
  expect(stringChecksum(input)).toBe(stringChecksum(input));
  expect(stringChecksum(`${input}!`)).not.toBe(stringChecksum(input));
});
