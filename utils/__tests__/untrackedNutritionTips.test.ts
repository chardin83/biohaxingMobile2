import { tips } from '@/locales/tips';
import { isNutritionTipUntracked } from '@/utils/untrackedNutritionTips';

const proteinTip = tips.find(tip => tip.id === 'protein_rotation')!;

it.each([false, true])('keeps goals with missing profile settings untracked regardless of Premium (%s)', premium => {
  expect(isNutritionTipUntracked(proteinTip, undefined, 140, premium)).toBe(true);
  expect(isNutritionTipUntracked(proteinTip, 70, undefined, premium)).toBe(true);
  expect(isNutritionTipUntracked(proteinTip, undefined, undefined, premium)).toBe(true);
  expect(isNutritionTipUntracked(proteinTip, 70, 140, premium)).toBe(false);
});

it('preserves Premium requirements for AI targets', () => {
  const aiTip = tips.find(tip => tip.trackingTargets?.some(target => target.aiInstruction?.trim()))!;
  expect(isNutritionTipUntracked(aiTip, 70, 140, false)).toBe(true);
  expect(isNutritionTipUntracked(aiTip, 70, 140, true)).toBe(false);
});
