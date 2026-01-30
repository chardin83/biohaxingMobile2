import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import CheckIcon from '@/assets/icons/check.svg';
import PlayIcon from '@/assets/icons/play.svg';
import ProhibitionIcon from '@/assets/icons/prohibition.svg';
import SearchIcon from '@/assets/icons/search.svg';
import StarIcon from '@/assets/icons/star.svg';
import AppBox from '@/components/ui/AppBox';
import { VerdictValue } from '@/types/verdict';

const ICON_SIZE = 40;

type Props = {
  currentVerdict?: VerdictValue;
  onVerdictPress: (verdict: VerdictValue) => void;
};

const getMainCategory = (verdict: VerdictValue): 'interested' | 'notInterested' | null => {
  if (['startNow', 'wantMore', 'alreadyWorks'].includes(verdict)) return 'interested';
  if (['noResearch', 'testedFailed'].includes(verdict)) return 'notInterested';
  return null;
};

const getSubOptionLabel = (verdict: VerdictValue, t: any): string => {
  const labels: Record<VerdictValue, string> = {
    interested: '',
    notInterested: '',
    startNow: t('common:goalDetails.verdictStartNow'),
    wantMore: t('common:goalDetails.verdictWantMore'),
    alreadyWorks: t('common:goalDetails.verdictAlreadyWorks'),
    noResearch: t('common:goalDetails.verdictNoResearch'),
    testedFailed: t('common:goalDetails.verdictTestedFailed'),
  };
  return labels[verdict] || '';
};

export default function VerdictSelector({ currentVerdict, onVerdictPress }: Props) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<'interested' | 'notInterested' | null>(null);

  const mainCategory = currentVerdict ? getMainCategory(currentVerdict) : null;
  const showMainCategory = selectedCategory || mainCategory;

  const isSelectedInCategory = (verdict: VerdictValue) => currentVerdict === verdict;

  // För sub-alternativ: anropa callback och stäng vyn
  const getSubOption = (icon: string | React.ReactNode, titleKey: string, verdictValue: VerdictValue, xp = true) => {
    let xpLabel = '';
    if (isSelectedInCategory(verdictValue)) {
      xpLabel = '✓';
    } else if (xp) {
      xpLabel = '+5 XP';
    }

    return (
      <Pressable
        style={[styles.verdictCard, isSelectedInCategory(verdictValue) && styles.verdictCardSelected]}
        onPress={() => {
          onVerdictPress(verdictValue);
          setSelectedCategory(null);
        }}
      >
        <View style={styles.verdictCardContent}>
          {typeof icon === 'string' ? (
            <Text style={styles.verdictCardIcon}>{icon}</Text>
          ) : (
            <View style={styles.iconContainer}>{icon}</View>
          )}
          <View style={styles.verdictCardText}>
            <Text style={styles.verdictCardTitle}>{t(`common:goalDetails.${titleKey}`)}</Text>
          </View>
        </View>
        <Text style={styles.verdictCardXP}>{xpLabel}</Text>
      </Pressable>
    );
  };

  // For displaying category button with sub-option label
  const getCategoryButtonWithLabel = (icon: string, titleKey: string, category: 'interested' | 'notInterested') => {
    const isThisCategory = mainCategory === category;
    const subLabel = isThisCategory && currentVerdict ? getSubOptionLabel(currentVerdict, t) : null;

    return (
      <Pressable
        style={[styles.verdictCard, showMainCategory === category && styles.verdictCardSelected]}
        onPress={() => (selectedCategory ? setSelectedCategory(null) : setSelectedCategory(category))}
      >
        <View style={styles.verdictCardContent}>
          <Text style={styles.verdictCardIcon}>{icon}</Text>
          <View style={styles.verdictCardText}>
            <Text style={styles.verdictCardTitle}>{t(`common:goalDetails.${titleKey}`)}</Text>
            {subLabel && <Text style={styles.subOptionLabel}>{subLabel}</Text>}
          </View>
        </View>
        <Text style={styles.verdictCardXP}>{showMainCategory === category && currentVerdict ? '✓' : '+5 XP'}</Text>
      </Pressable>
    );
  };

  // Initial state: show two main options, optionally with selected sub-option
  if (!selectedCategory) {
    return (
      <AppBox title={t('common:goalDetails.verdict')}>
        {getCategoryButtonWithLabel(
          <StarIcon width={ICON_SIZE} height={ICON_SIZE} color={Colors.dark.accentStrong} />,
          'verdictInterested',
          'interested'
        )}
        {getCategoryButtonWithLabel(
          <ProhibitionIcon width={ICON_SIZE} height={ICON_SIZE} color={Colors.dark.accentStrong} />,
          'verdictNotInterested',
          'notInterested'
        )}
      </AppBox>
    );
  }

  // Interested path: 3 options
  if (selectedCategory === 'interested') {
    return (
      <AppBox title={t('common:goalDetails.verdict')}>
        <Pressable style={styles.backButton} onPress={() => setSelectedCategory(null)}>
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </Pressable>
        {getSubOption(
          <PlayIcon width={ICON_SIZE} height={ICON_SIZE} color={Colors.dark.accentStrong} />,
          'verdictStartNow',
          'startNow'
        )}
        {getSubOption(
          <SearchIcon width={ICON_SIZE} height={ICON_SIZE} color={Colors.dark.accentStrong} />,
          'verdictWantMore',
          'wantMore'
        )}
        {getSubOption(
          <CheckIcon width={ICON_SIZE} height={ICON_SIZE} color={Colors.dark.accentStrong} />,
          'verdictAlreadyWorks',
          'alreadyWorks'
        )}
      </AppBox>
    );
  }

  // Not interested path: 2 options
  if (selectedCategory === 'notInterested') {
    return (
      <AppBox title={t('common:goalDetails.verdict')}>
        <Pressable style={styles.backButton} onPress={() => setSelectedCategory(null)}>
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </Pressable>
        {getSubOption('🤨', 'verdictNoResearch', 'noResearch')}
        {getSubOption('❌', 'verdictTestedFailed', 'testedFailed')}
      </AppBox>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  verdictCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.dark.accentVeryWeak,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accentWeak,
  },
  verdictCardSelected: {
    backgroundColor: Colors.dark.accentWeak,
    borderColor: Colors.dark.accentDefault,
    borderWidth: 2,
  },
  verdictCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  verdictCardIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  verdictCardText: {
    flex: 1,
  },
  verdictCardTitle: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  verdictCardXP: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.dark.accentVeryWeak,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.accentWeak,
  },
  backButtonText: {
    color: Colors.dark.accentStrong,
    fontSize: 14,
    fontWeight: '600',
  },
  subOptionLabel: {
    color: Colors.dark.textLight,
    fontSize: 15,
    fontStyle: 'italic',
    marginLeft: 0,
    marginTop: 3,
    marginBottom: 12,
  },
});
