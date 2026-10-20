import React from 'react';
import { ScrollView } from 'react-native';

import type { IdentifiedFood } from '@/types/nutrition/nutritionAnalysis';

import { AnalysisScanner } from './AnalysisScanner';
import { IngredientList } from './IngredientList';

export function IngredientAnalysisScanner({ ingredients, height = 260, active = true }: { ingredients: IdentifiedFood[]; height?: number; active?: boolean }) {
  return (
    <AnalysisScanner height={height} active={active}>
      <ScrollView style={{ flex: 1 }}>
        <IngredientList ingredients={ingredients} style={{ minHeight: height }} />
      </ScrollView>
    </AnalysisScanner>
  );
}
