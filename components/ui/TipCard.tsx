import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import CheckIcon from '@/assets/icons/check.svg';
import PlayIcon from '@/assets/icons/play.svg';
import ProhibitionIcon from '@/assets/icons/prohibition.svg';
import SearchIcon from '@/assets/icons/search.svg';
import StarIcon from '@/assets/icons/star.svg';
import { Colors } from '@/constants/Colors';
import { Tip } from '@/locales/tips';
import { isNegativeVerdict, isPositiveVerdict, VerdictValue } from '@/types/verdict';

type TipVerdict = VerdictValue;

const ICON_SIZE = 22;

interface TipProgress {
  xp: number;
  progress: number;
  askedQuestions: number;
  verdict?: TipVerdict;
}

interface TipCardProps {
  tip: Tip;
  tipProgress: TipProgress;
  onPress: () => void;
}

export default function TipCard({ tip, tipProgress, onPress }: Readonly<TipCardProps>) {
  const { t } = useTranslation();

  const isStarted = tipProgress.xp > 0;
  const isCompleted = tipProgress.progress >= 1;

  const verdict = tipProgress.verdict;
  const isPositive = isPositiveVerdict(verdict);
  const isNegative = isNegativeVerdict(verdict);

  const iconColor = Colors.dark.accentStrong;
  const verdictIconMap: Partial<Record<VerdictValue, React.ReactNode>> = {
    [VerdictValue.Interested]: <StarIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />,
    [VerdictValue.StartNow]: <PlayIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />,
    [VerdictValue.WantMore]: <SearchIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />,
    [VerdictValue.AlreadyWorks]: <CheckIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />,
    [VerdictValue.NotInterested]: <ProhibitionIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />,
    [VerdictValue.NoResearch]: <ProhibitionIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />,
    [VerdictValue.TestedFailed]: <ProhibitionIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />,
  };
  const verdictIcon = verdict ? verdictIconMap[verdict] : undefined;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tipSection,
        pressed && styles.tipPressed,
        isCompleted && styles.tipCompleted,
        isPositive && styles.tipPositive,
        isNegative && styles.tipNegative,
      ]}
      onPress={onPress}
    >
      <View style={styles.tipHeader}>
        <View style={styles.tipHeaderLeft}>
          <View style={styles.tipTitleRow}>
            {verdictIcon && <View style={styles.inlineIcon}>{verdictIcon}</View>}
            {!verdictIcon && isCompleted && <Text style={styles.fallbackIcon}>✅</Text>}
            <Text style={styles.tipTitle}>{t(`tips:${tip.title}`)}</Text>
          </View>
          <Text style={styles.tipDescription}>{t(`tips:${tip.descriptionKey}`)}</Text>
        </View>

        {isStarted && (
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>{tipProgress.xp} XP</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      {isStarted && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${tipProgress.progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {tipProgress.askedQuestions}/3 {t('common:goalDetails.questionsExplored')}
          </Text>
        </View>
      )}

      <Text style={styles.tapHint}>
        {isStarted ? t('common:goalDetails.continueExploring') : t('common:goalDetails.startExploring')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tipSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accentVeryWeak,
  },
  tipPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: Colors.dark.accentMedium,
  },
  tipCompleted: {
    borderColor: Colors.dark.accentMedium,
    backgroundColor: Colors.dark.accentVeryWeak,
  },
  tipPositive: {
    borderColor: Colors.dark.successDefault,
    backgroundColor: Colors.dark.successWeak,
    borderWidth: 2,
  },
  tipNegative: {
    borderColor: Colors.dark.warmDefault,
    backgroundColor: Colors.dark.warmWeak,
    borderWidth: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inlineIcon: {
    marginRight: 6,
  },
  tipTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  fallbackIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tipDescription: {
    color: Colors.dark.textTertiary,
    fontSize: 14,
    lineHeight: 20,
  },
  xpBadge: {
    backgroundColor: Colors.dark.accentWeak,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accentMedium,
  },
  xpText: {
    color: Colors.dark.accentStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.dark.textWeak,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.accentDefault,
  },
  progressText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  tapHint: {
    color: Colors.dark.accentDefault,
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
