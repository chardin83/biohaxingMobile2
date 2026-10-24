import { getWeightedGlycemicIndex, normalizeGlycemicIndex } from '../glycemicIndex';
import { scaleNutritionComposition } from '../nutritionComposition';
import { extractStructuredAnalysis } from '../analyzeNutrition';
import { buildBarcodeEnrichmentInput, getAiEstimatedBarcodeNutrients } from '../barcodeAnalysis';

const nutrition = { name: 'Food', calories: 100, protein: 2, carbohydrates: 20, fat: 1, fiber: 3, glycemicIndex: 45 };

it('keeps GI unchanged when scaling portions', () => {
  expect(scaleNutritionComposition(nutrition, 2).glycemicIndex).toBe(45);
});

it('weights known GI by carbohydrates and excludes unknown values', () => {
  expect(getWeightedGlycemicIndex([{ carbohydrates: 10, glycemicIndex: 40 }, { carbohydrates: 30, glycemicIndex: 60 }, { carbohydrates: 100 }])).toBe(55);
  expect(getWeightedGlycemicIndex([{ carbohydrates: 0, glycemicIndex: 40 }])).toBeUndefined();
  expect(normalizeGlycemicIndex(-1)).toBeUndefined();
  expect(normalizeGlycemicIndex(Infinity)).toBeUndefined();
  expect(normalizeGlycemicIndex(110)).toBe(110);
});

it('reads GI from AI nutrition and nutritionDetails responses', () => {
  expect(extractStructuredAnalysis({ nutrition }, null)?.glycemicIndex).toBe(45);
  expect(extractStructuredAnalysis({ nutrition: { calories: 100 }, nutritionDetails: { glycemicIndex: 52 } }, null)?.glycemicIndex).toBe(52);
});

it('passes barcode GI without portion scaling and marks only missing GI as estimated', () => {
  const context = { product: { barcode: '123', name: 'Food', nutrition: { glycemicIndex: 45 } }, amount: 200, productType: 'food' as const };
  expect(buildBarcodeEnrichmentInput(context).knownNutritionPer100.glycemicIndex).toBe(45);
  expect(getAiEstimatedBarcodeNutrients(context, nutrition)).not.toContain('glycemicIndex');
  expect(getAiEstimatedBarcodeNutrients({ ...context, product: { ...context.product, nutrition: {} } }, nutrition)).toContain('glycemicIndex');
});

it('calculates coverage by carbohydrate amount, preserving missing versus genuine zero GI', () => {
  const { getGlycemicIndexSummary } = require('../glycemicIndex');
  expect(getGlycemicIndexSummary([{ carbohydrates: 20, glycemicIndex: 50 }, { carbohydrates: 80 }, { carbohydrates: 0 }])).toMatchObject({ glycemicIndex: 50, coverage: 20 });
  expect(getGlycemicIndexSummary([{ carbohydrates: 20 }])).toMatchObject({ glycemicIndex: undefined, coverage: 0 });
  expect(getGlycemicIndexSummary([{ carbohydrates: 0 }])).toMatchObject({ glycemicIndex: undefined, coverage: undefined });
  expect(getGlycemicIndexSummary([{ carbohydrates: 20, glycemicIndex: 0 }])).toMatchObject({ glycemicIndex: 0, coverage: 100 });
  expect(getGlycemicIndexSummary([{ carbohydrates: NaN, glycemicIndex: 50 }, { carbohydrates: -1 }, { carbohydrates: 20, glycemicIndex: -2 }])).toMatchObject({ glycemicIndex: undefined, coverage: 0 });
});

it('includes days without any GI in period coverage, excluding outside and future dates', () => {
  const { getGlycemicIndexCoverage } = require('../glycemicIndex');
  const points = [
    { date: '2026-10-01', knownCarbohydrates: 1000, totalCarbohydrates: 1000 },
    { date: '2026-10-22', knownCarbohydrates: 20, totalCarbohydrates: 20 },
    { date: '2026-10-23', knownCarbohydrates: 0, totalCarbohydrates: 80 },
    { date: '2026-10-24', knownCarbohydrates: 1000, totalCarbohydrates: 1000 },
  ];
  expect(getGlycemicIndexCoverage(points, '2026-10-17', '2026-10-23')).toBe(20);
  expect(getGlycemicIndexCoverage([], '2026-10-17', '2026-10-23')).toBeUndefined();
});
