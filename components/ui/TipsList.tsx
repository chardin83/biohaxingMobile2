import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { tips } from '@/locales/tips';
import { NEGATIVE_VERDICTS, POSITIVE_VERDICTS, VerdictValue } from '@/types/verdict';

import TipCard from './TipCard';

interface TipsListProps {
  areaId: string;
  title: string;
}

export default function TipsList({ areaId, title }: Readonly<TipsListProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const { viewedTips } = useStorage();
  const [showAllTips, setShowAllTips] = React.useState(false);

  const tipsRaw = tips.filter(tip => tip.areas.some(area => area.id === areaId));

  const positiveVerdicts = React.useMemo(() => new Set(POSITIVE_VERDICTS), []);
  const negativeVerdicts = React.useMemo(() => new Set(NEGATIVE_VERDICTS), []);

  const getVerdictScore = (verdict: string | undefined): number => {
    if (!verdict) {
      return 1;
    }
    if (positiveVerdicts.has(verdict as VerdictValue)) {
      return 2;
    }
    if (negativeVerdicts.has(verdict as VerdictValue)) {
      return 0;
    }
    return 1;
  };

  // Sortera tips: positiva → neutrala → negativa
  const sortedTips = React.useMemo(() => {
    return [...tipsRaw].sort((a, b) => {
      const aViewed = viewedTips?.find(v => v.mainGoalId === areaId && v.tipId === a.id);
      const bViewed = viewedTips?.find(v => v.mainGoalId === areaId && v.tipId === b.id);

      const aVerdict = aViewed?.verdict;
      const bVerdict = bViewed?.verdict;

      const aScore = getVerdictScore(aVerdict);
      const bScore = getVerdictScore(bVerdict);

      return bScore - aScore;
    });
  }, [tipsRaw, viewedTips, areaId]);

  // Filtrera tips: dölj "not interested"-liknande om inte "show all"
  const visibleTips = React.useMemo(() => {
    if (showAllTips) {
      return sortedTips;
    }
    return sortedTips.filter(tip => {
      const viewedTip = viewedTips?.find(v => v.mainGoalId === areaId && v.tipId === tip.id);
      return viewedTip?.verdict ? !negativeVerdicts.has(viewedTip.verdict as VerdictValue) : true;
    });
  }, [sortedTips, showAllTips, viewedTips, areaId]);

  const hiddenTipsCount = sortedTips.length - visibleTips.length;

  const getTipProgress = (tipId: string) => {
    const viewedTip = viewedTips?.find(v => v.mainGoalId === areaId && v.tipId === tipId);

    if (!viewedTip) {
      return { xp: 0, progress: 0, askedQuestions: 0, verdict: undefined };
    }

    const maxQuestions = 3;
    const progress = Math.min(viewedTip.askedQuestions.length / maxQuestions, 1);

    return {
      xp: viewedTip.xpEarned,
      progress,
      askedQuestions: viewedTip.askedQuestions.length,
      verdict: viewedTip.verdict,
    };
  };

  const handleTipPress = (tipIndex: number) => {
    const tip = sortedTips[tipIndex];

    if (tip) {
      router.push({
        pathname: `/(goal)/${areaId}/details` as any,
        params: {
          tipId: tip.id,
        },
      });
    }
  };

  return (
    <Card title={t(title)} style={{ marginTop: 16 }}>
      {visibleTips.map((tip, index) => {
        const tipProgress = getTipProgress(tip.id);

        return <TipCard key={tip.id} tip={tip} tipProgress={tipProgress} onPress={() => handleTipPress(index)} />;
      })}

      {hiddenTipsCount > 0 && (
        <Pressable style={styles.showAllButton} onPress={() => setShowAllTips(!showAllTips)}>
          <Text style={styles.showAllText}>
            {showAllTips
              ? t('common:tips.hideNotInterested', 'Hide not interested')
              : t('common:tips.showAll', { defaultValue: 'Show all ({{count}} hidden)', count: hiddenTipsCount })}
          </Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  showAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.dark.textWeak,
  },
  showAllText: {
    color: Colors.dark.accentDefault,
    fontSize: 14,
    fontWeight: '600',
  },
});
