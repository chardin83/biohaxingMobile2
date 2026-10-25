type PlanTipReference = { tipId?: unknown; id?: unknown; title?: unknown; name?: unknown };
type CatalogTip = { id: string; title: string };

// AI row IDs are not necessarily catalog IDs. Resolve a real catalog reference
// before persisting a plan; never guess a tip from its position in the catalog.
export function resolvePlanTip<T extends CatalogTip>(
  value: PlanTipReference | string,
  catalog: readonly T[],
  translatedTitle: (tip: T) => string
): T | undefined {
  const entry = typeof value === 'string' ? { tipId: value } : value;
  if (!entry || typeof entry !== 'object') return undefined;
  const references = [entry.tipId, entry.id].filter((reference): reference is string => typeof reference === 'string');
  for (const reference of references) {
    const match = catalog.find(tip => tip.id === reference.trim());
    if (match) return match;
  }
  const normalize = (text: string) => text.trim().toLocaleLowerCase();
  const labels = [entry.title, entry.name, ...references].filter((label): label is string => typeof label === 'string').map(normalize);
  const matches = catalog.filter(tip => labels.includes(normalize(tip.title)) || labels.includes(normalize(translatedTitle(tip))));
  return matches.length === 1 ? matches[0] : undefined;
}
