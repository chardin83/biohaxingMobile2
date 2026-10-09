import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { CardLinkList } from '@/components/ui/CardLinkList';
import type { IconSymbolName } from '@/components/ui/icon-symbol-map';
import XPBadge from '@/components/ui/XPBadge';
import type { AIPromptKey } from '@/constants/AIPrompts';
import { getInsightQuestionXP, INSIGHT_QUESTION_TYPES, type InsightQuestionType } from '@/constants/tipXP';

const insightLabels: Record<InsightQuestionType, { titleKey: string; iconName: IconSymbolName }> = {
  studies: { titleKey: 'whatStudiesExist', iconName: 'book' },
  experts: { titleKey: 'whoAreTheExperts', iconName: 'person' },
  risks: { titleKey: 'whatAreTheRisks', iconName: 'warning' },
};

export default function CriticalThinkingSection({ askedQuestions, onPress }: Readonly<{ askedQuestions: readonly string[]; onPress: (questionKey: AIPromptKey) => void }>) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <ThemedText type="title3">{t('common:tipDetails.criticalThinking')}</ThemedText>
      <CardLinkList rows={INSIGHT_QUESTION_TYPES.map(questionType => {
        const xp = getInsightQuestionXP(askedQuestions, questionType);
        return {
          key: questionType,
          title: t(`common:tipDetails.${insightLabels[questionType].titleKey}`),
          iconName: insightLabels[questionType].iconName,
          onPress: () => onPress(`insights.${questionType}`),
          accessory: <XPBadge amount={xp} showPlus checked={xp === 0} />,
        };
      })} />
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: 12, marginBottom: 20 } });
