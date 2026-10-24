/** Synchronous FNV-1a-style 64-bit checksum of Unicode code points, for change detection. */
export function stringChecksum(value: string): string {
  let hash = BigInt('14695981039346656037');
  const prime = BigInt('1099511628211');
  for (const character of value) {
    // eslint-disable-next-line no-bitwise -- XOR is part of the FNV-1a algorithm.
    hash ^= BigInt(character.codePointAt(0)!);
    hash = BigInt.asUintN(64, hash * prime);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, '0')}`;
}
