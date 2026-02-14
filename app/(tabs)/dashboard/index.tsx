import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import DarkSmart from '@/assets/images/dark_orange.png';
import LightSmart from '@/assets/images/light_teal2.png';
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
  const { colors, dark } = useTheme();

  const Smart = dark ? DarkSmart : LightSmart;

  const nextLevel = levels.find(l => l.level === myLevel + 1);
  const xpMax = nextLevel?.requiredXP ?? levels.find(l => l.level === myLevel)?.requiredXP ?? 0;
  const progressText = `${myXP} / ${xpMax} XP`;
  const levelTitle = levels.find(o => o.level === myLevel)?.titleKey;

  const positiveVerdictsSet = React.useMemo(() => new Set(POSITIVE_VERDICTS), []);

  const tipAreasMap = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    tips.forEach(t => {
      map.set(t.id, new Set((t.areas || []).map(a => a.id)));
    });
    return map;
  }, []);

  // Ny: karta från supplement-id till områden (härleds från tips)
  const supplementAreasMap = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    tips.forEach(t => {
      const areaIds = (t.areas || []).map(a => a.id);
      (t.supplements || []).forEach(ref => {
        if (!ref?.id) return;
        if (!map.has(ref.id)) map.set(ref.id, new Set<string>());
        const set = map.get(ref.id)!;
        areaIds.forEach(id => set.add(id));
      });
    });
    return map;
  }, []);

  /* const clearAllStorage = async () => {
    try {
      await AsyncStorage.multiRemove([
        "plans",
        "viewedTips"
      ]);
      console.log('✅ All storage cleared!');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  };
  
  // Kör denna en gång vid app-start (ta bort sedan!):
  useEffect(() => {
    clearAllStorage();
  }, []);*/

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

      <View style={styles.imageWrapper}>
       <Image source={Smart} style={styles.image} resizeMode="cover" testID="dashboard-image"/>
        <Text
          style={[
            styles.levelOverlay,
            {
              color: colors.textWhite,
              textShadowColor: colors.accentStrong,
            },
          ]}
        >
          {t('general.level').toUpperCase()} {myLevel}
        </Text>
      </View>

      <Text style={[styles.title, { color: colors.accentStrong }]}>{t(`levels:${levelTitle}`)}</Text>
      <ProgressBarWithLabel progress={myXP / xpMax} label={progressText} height={12} />

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

          // Kolla training/nutrition/other via tipAreasMap
          const hasAnyGoalInArea = [...plans.training, ...plans.nutrition, ...plans.other].some(entry => {
            const areaIds = tipAreasMap.get(entry.tipId);
            return areaIds?.has(areaId);
          });

          // Kolla supplements via supplementAreasMap
          const hasAnySupplementInArea = (plans.supplements || []).some(plan =>
            (plan.supplements || []).some(entry => {
              const supId = entry?.supplement?.id;
              if (!supId) return false;
              const areaSet = supplementAreasMap.get(supId);
              return areaSet?.has(areaId) ?? false;
            })
          );

          const hasAnyTipInArea = hasAnyGoalInArea || hasAnySupplementInArea;

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
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'flex-end',
    //overflow: 'hidden', // Lägg till denna rad!
  },
  image: {
     position: 'absolute', // Lägg till denna rad!
     top: 0,
     left: 0,
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
