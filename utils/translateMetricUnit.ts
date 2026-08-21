type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

function normalizeMetricUnitKey(unit: string): string {
  let unitKey = unit
    .replaceAll('µ', 'u')
    .replaceAll('%', 'percent')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toLowerCase();

  while (unitKey.startsWith('_')) {
    unitKey = unitKey.slice(1);
  }

  while (unitKey.endsWith('_')) {
    unitKey = unitKey.slice(0, -1);
  }

  return unitKey;
}

export function translateMetricUnit(
  unit: string,
  t: TranslateFn,
  keyPrefix = 'units'
): string {
  const unitKey = normalizeMetricUnitKey(unit);
  return t(`${keyPrefix}.${unitKey}`, { defaultValue: unit });
}
