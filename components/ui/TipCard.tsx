import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import CheckIcon from '@/assets/icons/check.svg';
import PlayIcon from '@/assets/icons/play.svg';
import ProhibitionIcon from '@/assets/icons/prohibition.svg';
import SearchIcon from '@/assets/icons/search.svg';
import StarIcon from '@/assets/icons/star.svg';
import { ThemedText } from '@/components/ThemedText';
import Badge from '@/components/ui/Badge';
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
  const { colors } = useTheme();

  const isStarted = tipProgress.xp > 0;
  const isCompleted = tipProgress.progress >= 1;

  const verdict = tipProgress.verdict;
  const isPositive = isPositiveVerdict(verdict);
  const isNegative = isNegativeVerdict(verdict);

  const iconColor = colors.accentStrong;
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
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.accentVeryWeak,
        },
        pressed && {
          backgroundColor: colors.overlayLight,
          borderColor: colors.accentMedium,
        },
        isCompleted && {
          borderColor: colors.accentMedium,
          backgroundColor: colors.accentVeryWeak,
        },
        isPositive && {
          borderColor: colors.successDefault,
          backgroundColor: colors.successWeak,
          borderWidth: 2,
        },
        isNegative && {
          borderColor: colors.warmDefault,
          backgroundColor: colors.warmWeak,
          borderWidth: 2,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.tipHeader}>
        <View style={styles.tipHeaderLeft}>
          <View style={styles.tipTitleRow}>
            {verdictIcon && <View style={styles.inlineIcon}>{verdictIcon}</View>}
            {!verdictIcon && isCompleted && (
              <ThemedText style={styles.fallbackIcon}>✅</ThemedText>
            )}
            <ThemedText type="title3">
              {t(`tips:${tip.title}`)}
            </ThemedText>
          </View>
          <ThemedText type="default">
            {t(`tips:${tip.descriptionKey}`)}
          </ThemedText>
        </View>

        {isStarted && (
          <Badge
            style={{ backgroundColor: colors.accentWeak, borderColor: colors.accentMedium }}
          >
            <ThemedText type="caption">
              {tipProgress.xp} XP
            </ThemedText>
          </Badge>
        )}
      </View>

      {/* Progress bar */}
      {isStarted && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.textWeak }]}>
            <View
              style={[styles.progressFill, { width: `${tipProgress.progress * 100}%`, backgroundColor: colors.accentDefault }]}
            />
          </View>
          <ThemedText style={[styles.progressText, { color: colors.textMuted }]}>
            {tipProgress.askedQuestions}/3 {t('common:goalDetails.questionsExplored')}
          </ThemedText>
        </View>
      )}

      <ThemedText style={[styles.tapHint, { color: colors.accentDefault }]}>
        {isStarted ? t('common:goalDetails.continueExploring') : t('common:goalDetails.startExploring')}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tipSection: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
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
  fallbackIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 11,
    marginTop: 4,
  },
  tapHint: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
