import type { Supplement } from '@/app/domain/Supplement';

type SupplementWarning = Readonly<{
  key: string;
  supplementIds: readonly string[];
}>;

// Add entries here to show further warnings in every supplement entry flow.
export const supplementWarnings: readonly SupplementWarning[] = [{ key: 'zinc', supplementIds: ['zinc', 'zincPicolinate', 'zincBisglycinate', 'zincCitrate'] }];

export function getSupplementWarningKeys(supplement: Supplement | null | undefined): string[] {
  if (!supplement) return [];
  const ids = new Set<string>();
  const collect = (item: Supplement) => {
    ids.add(item.id);
    item.components?.forEach(collect);
  };
  collect(supplement);
  return supplementWarnings.filter(warning => warning.supplementIds.some(id => ids.has(id))).map(warning => warning.key);
}
