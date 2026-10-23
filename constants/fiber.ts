export const FIBER_TYPE_KEYS = [
  'fiber_total',
  'fiber_gel_forming',
  'fiber_non_gel_forming',
  'fiber_fermentable',
] as const;

export type FiberType = typeof FIBER_TYPE_KEYS[number];
export type FiberCategory = Exclude<FiberType, 'fiber_total'>;

// Practical subgroups include both chemical fiber types and source-specific fractions.
// 'psyllium' means the gel-forming fiber fraction from the husk, not whole husk mass.
const FIBER_GEL_FORMING_SUBTYPES = ['beta_glucans', 'pectin', 'psyllium', 'mucilage'] as const;
export type FiberGelForming = (typeof FIBER_GEL_FORMING_SUBTYPES)[number];

const FIBER_NON_GEL_FORMING_SUBTYPES = ['cellulose', 'hemicellulose', 'lignin', 'arabinoxylan'] as const;
export type FiberNonGelForming = (typeof FIBER_NON_GEL_FORMING_SUBTYPES)[number];

const FIBER_FERMENTABLE_SUBTYPES = [
  'resistant_starch',
  'inulin',
  // Combined analytical value, used only when inulin and FOS are not separately measured.
  'inulin_type_fructans',
  'fructooligosaccharides',
  'galactooligosaccharides',
  'pectic_oligosaccharides',
  'beta_glucans',
  'pectin',
  'mucilage',
] as const;
export type FiberFermentable = (typeof FIBER_FERMENTABLE_SUBTYPES)[number];

export type FiberSubtype = FiberGelForming | FiberNonGelForming | FiberFermentable;

export const isFiberTargetTag = (tag: string): tag is FiberType =>
  FIBER_TYPE_KEYS.includes(tag as FiberType);

export const FIBER_CATEGORY_SUBTYPES: Record<FiberCategory, FiberSubtype[]> = {
  fiber_gel_forming: [...FIBER_GEL_FORMING_SUBTYPES],
  fiber_non_gel_forming: [...FIBER_NON_GEL_FORMING_SUBTYPES],
  fiber_fermentable: [...FIBER_FERMENTABLE_SUBTYPES],
};

export const isFiberSubtypeTargetTag = (tag: string): tag is FiberSubtype =>
  Object.values(FIBER_CATEGORY_SUBTYPES).some(subtypes => subtypes.includes(tag as FiberSubtype));
