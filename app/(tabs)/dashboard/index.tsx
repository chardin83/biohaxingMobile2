import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Smart from '@/assets/images/level1_small.png';
import AppCard from '@/components/ui/AppCard';
import Container from '@/components/ui/Container';
import ProgressBarWithLabel from '@/components/ui/ProgressbarWithLabel';
import { levels } from '@/constants/XP';
import { areas } from '@/locales/areas';
import { tips } from '@/locales/tips';
import { POSITIVE_VERDICTS, VerdictValue } from '@/types/verdict';

import { useStorage } from '../../context/StorageContext';

export default function DashboardScreen() {
  const { t } = useTranslation(['common', 'areas', 'levels']);
  const { myGoals, myXP, myLevel, viewedTips, plans } = useStorage();
  const router = useRouter();
  const { colors } = useTheme();

  const nextLevel = levels.find(l => l.level === myLevel + 1);
  const xpMax = nextLevel?.requiredXP ?? levels.find(l => l.level === myLevel)?.requiredXP ?? 0;
  const progressText = `${myXP} / ${xpMax} XP`;
  const levelTitle = levels.find(o => o.level === myLevel)?.titleKey;

  const positiveVerdictsSet = React.useMemo(() => new Set(POSITIVE_VERDICTS), []);

  // Hitta favorit-markerade tips för ett specifikt område
  const getFavoriteTipsForArea = (areaId: string) => {
    return (
      viewedTips
        ?.filter(
          tip => tip.mainGoalId === areaId && tip.verdict && positiveVerdictsSet.has(tip.verdict as VerdictValue)
        )
        .map(tip => {
          const tipDetails = tips.find(tipObj => tipObj.id === tip.tipId);
          return tipDetails ? t(`tips:${tipDetails.title}`) : null;
        })
        .filter(Boolean) || []
    );
  };

  return (
    <Container
      background="gradient"
      gradientKey="sunrise"
      gradientLocations={colors.gradients?.sunrise?.locations1 as any}
      centerContent
    >
      <Text style={[styles.appTitle, { color: colors.accentStrong }]}>{t('common:dashboard.appTitle')}</Text>

      <View style={styles.imageWrapper}>
        <Image source={Smart} style={styles.image} resizeMode="cover" />
        <Text
          style={[
            styles.levelOverlay,
            {
              color: colors.textWhite,
              textShadowColor: colors.accentStrong,
            },
          ]}
        >
          {t('common:dashboard.level')} {myLevel}
        </Text>
      </View>

      <Text style={[styles.title, { color: colors.accentStrong }]}>{t(`levels:${levelTitle}`)}</Text>
      <ProgressBarWithLabel progress={myXP / xpMax} label={progressText} />

      {areas
        .filter(item => myGoals.includes(item.id))
        .map(item => {
          const areaId = item.id;
          const favoriteTipsList = getFavoriteTipsForArea(areaId);
          const description =
            favoriteTipsList.length > 0 ? `${favoriteTipsList.join('\n')}` : t('common:dashboard.noFavorites');
          const areaXP =
            viewedTips?.filter(tip => tip.mainGoalId === areaId).reduce((sum, tip) => sum + (tip.xpEarned || 0), 0) ||
            0;
          const hasAnyTipInArea = [...plans.training, ...plans.nutrition].some(entry => entry.mainGoalId === areaId);

          return (
            <AppCard
              key={areaId}
              icon={item.icon}
              title={t(`areas:${item.id}.title`)}
              description={description}
              isActive={hasAnyTipInArea}
              xp={areaXP}
              onPress={() =>
                router.push({
                  pathname: '/dashboard/area/[areaId]',
                  params: { areaId },
                })
              }
            />
          );
        })}

      <View style={styles.editLinkRow}>
        <TouchableOpacity
          onPress={() => router.push('/(manage)/areas')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.editButtonText, { color: colors.accentStrong }]}>
            {t('common:dashboard.editAreas')}
          </Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  appTitle: {
    fontSize: 24,
    marginVertical: 10,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  levelOverlay: {
    position: 'absolute',
    bottom: 22,
    fontSize: 25,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    borderRadius: 6,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  editLinkRow: {
    width: '100%',
    alignItems: 'flex-end',
    paddingRight: 20,
    marginTop: 12,
    marginBottom: 24,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
