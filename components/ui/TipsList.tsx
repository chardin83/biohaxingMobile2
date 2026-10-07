import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { Collapsible } from '@/components/Collapsible';
import { Card } from '@/components/ui/Card';
import { XP_FOR_CHAT_QUESTION, XP_FOR_VERDICT, XP_FOR_VIEW } from '@/constants/XP';
import { tips } from '@/locales/tips';
import { NEGATIVE_VERDICTS, POSITIVE_VERDICTS, VerdictValue } from '@/types/verdict';

import { ThemedText } from '../ThemedText';
import TipCard from './TipCard';

interface TipsListProps {
  areaId: string;
}

export default function TipsList({ areaId }: Readonly<TipsListProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { viewedTips, myLevel, nutritionXpClaims } = useStorage();
  const [showAllTips, setShowAllTips] = React.useState(false);

  const tipsRaw = tips.filter(tip => tip.areas.some(area => area.id === areaId));

  const positiveVerdicts = React.useMemo(() => new Set(POSITIVE_VERDICTS), []);
  const negativeVerdicts = React.useMemo(() => new Set(NEGATIVE_VERDICTS), []);

  const getVerdictScore = React.useCallback(
    (verdict: string | undefined): number => {
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
    },
    [positiveVerdicts, negativeVerdicts]
  );

  // Sortera tips: positiva → neutrala → negativa
  const sortedTips = React.useMemo(() => {
    return [...tipsRaw].sort((a, b) => {
      const aViewed = viewedTips?.find(v => v.tipId === a.id);
      const bViewed = viewedTips?.find(v => v.tipId === b.id);

      const aVerdict = aViewed?.verdict;
      const bVerdict = bViewed?.verdict;

      const aScore = getVerdictScore(aVerdict);
      const bScore = getVerdictScore(bVerdict);

      return bScore - aScore;
    });
  }, [tipsRaw, viewedTips, getVerdictScore]);

  const previewTips = React.useMemo(() => sortedTips.filter(tip => (tip.level ?? 1) <= myLevel + 1), [sortedTips, myLevel]);
  const lockedLevelCounts = new Map<number, number>();
  sortedTips.forEach(tip => {
    const level = tip.level ?? 1;
    if (level > myLevel + 1) lockedLevelCounts.set(level, (lockedLevelCounts.get(level) ?? 0) + 1);
  });
  const lockedLevels = [...lockedLevelCounts.entries()].sort(([a], [b]) => a - b);

  // Filtrera tips: dölj "not interested"-liknande om inte "show all"
  const visibleTips = React.useMemo(() => {
    if (showAllTips) {
      return previewTips;
    }
    return previewTips.filter(tip => {
      if ((tip.level ?? 1) > myLevel) return true;
      const viewedTip = viewedTips?.find(v => v.tipId === tip.id);
      return viewedTip?.verdict ? !negativeVerdicts.has(viewedTip.verdict) : true;
    });
  }, [showAllTips, previewTips, viewedTips, negativeVerdicts, myLevel]);

  const tipsByLevel = new Map<number, typeof visibleTips>();
  visibleTips.forEach(tip => {
    const level = tip.level ?? 1;
    const group = tipsByLevel.get(level) ?? [];
    group.push(tip);
    tipsByLevel.set(level, group);
  });
  const visibleLevels = [...tipsByLevel.entries()].sort(([a], [b]) => a - b);

  const hiddenTipsCount = previewTips.length - visibleTips.length;

  const getTipProgress = (tipId: string) => {
    const viewedTip = viewedTips?.find(v => v.tipId === tipId);

    const nutritionXpRaw = Object.values(nutritionXpClaims ?? {}).reduce((sum, claim) => {
      if (claim.tipId !== tipId) {
        return sum;
      }
      const xp = Number.isFinite(claim.xp) ? claim.xp : 0;
      return sum + xp;
    }, 0);

    const nutritionXp = nutritionXpRaw;
    const educationXp = viewedTip?.xpEarned ?? 0;
    const totalXp = educationXp + nutritionXp;

    if (!viewedTip) {
      return {
        xp: totalXp,
        educationXp,
        nutritionXp,
        progress: 0,
        askedQuestions: 0,
        verdict: undefined,
      };
    }

    const maxEducationXp = XP_FOR_VIEW + XP_FOR_CHAT_QUESTION * 3 + XP_FOR_VERDICT;
    const progress = Math.min(educationXp / maxEducationXp, 1);

    return {
      xp: totalXp,
      educationXp,
      nutritionXp,
      progress,
      askedQuestions: viewedTip.askedQuestions.length,
      verdict: viewedTip.verdict,
    };
  };

  const handleTipPress = (tipId: string) => {
    router.push({
      pathname: '/dashboard/area/[areaId]/details',
      params: { areaId, tipId },
    });
  };

  return (
    <Card title={`${t('tipsList.title')} (${sortedTips.length} ${t('general.countSuffix')})`} style={globalStyles.marginTop16}>
      {visibleLevels.map(([level, levelTips]) => {
        let label = '';
        if (level === myLevel) {
          label = t('tipsList.yourLevel');
        } else if (level === myLevel + 1) {
          label = t('tipsList.exploreNextLevel');
        }
        const title = `${t('tipsList.levelTitle', { level })}`;

        return (
          <Card key={`${myLevel}-${level}`}>
            <Collapsible
              title={title}
              titleType="title3"
              initialCollapsed={level !== myLevel}
              contentStyle={styles.levelContent}
              rightContent={
                <View style={styles.levelRightContent}>
                  <ThemedText type="defaultSemiBold" style={{ color: colors.primary }}>
                    {label}
                  </ThemedText>
                  <ThemedText type="explainer"> {levelTips.length}st</ThemedText>
                </View>
              }
            >
              {levelTips.map(tip => (
                <TipCard
                  key={tip.id}
                  tip={tip}
                  tipProgress={getTipProgress(tip.id)}
                  onPress={() => handleTipPress(tip.id)}
                  areaId={areaId}
                  locked={myLevel < (tip.level ?? 1)}
                />
              ))}
            </Collapsible>
          </Card>
        );
      })}

      {previewTips.some(tip => {
        if ((tip.level ?? 1) > myLevel) return false;
        const viewedTip = viewedTips?.find(v => v.tipId === tip.id);
        return viewedTip?.verdict && negativeVerdicts.has(viewedTip.verdict);
      }) && (
        <Pressable style={[styles.showAllButton, { borderTopColor: colors.textWeak }]} onPress={() => setShowAllTips(!showAllTips)}>
          <ThemedText type="defaultSemiBold" style={[{ color: colors.accentDefault }]}>
            {showAllTips ? t('tipsList.hideNotInterested') : t('tipsList.showAll', { count: hiddenTipsCount })}
          </ThemedText>
        </Pressable>
      )}
      <Card>
        <Collapsible title={t('tipsList.lockedLevels')} titleType="title3" initialCollapsed={true} contentStyle={styles.levelContent}>
          {lockedLevels.map(([level, count]) => (
            <Card key={level} style={styles.lockedLevelCard}>
              <ThemedText type="title3">🔒 {t('tipsList.levelTitle', { level })}</ThemedText>
              <ThemedText style={{ color: colors.textMuted }}>{t('tipsList.lockedTips', { count })}</ThemedText>
            </Card>
          ))}
        </Collapsible>
      </Card>
    </Card>
  );
}

const styles = StyleSheet.create({
  levelContent: { marginLeft: 0, marginTop: 12 },
  levelRightContent: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  showAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  lockedLevelCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
