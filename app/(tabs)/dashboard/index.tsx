import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable,StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import DarkSmart from '@/assets/images/dark_orange.png';
import LightSmart from '@/assets/images/light_teal2.png';
import { ThemedText } from '@/components/ThemedText';
import AppCard from '@/components/ui/AppCard';
import Container from '@/components/ui/Container';
import { InfoButtonWithText } from '@/components/ui/InfoButtonWithText';
import ProgressBarWithLabel from '@/components/ui/ProgressbarWithLabel';
import { levels } from '@/constants/XP';
import { areas } from '@/locales/areas';
import { tips } from '@/locales/tips';
import { POSITIVE_VERDICTS, VerdictValue } from '@/types/verdict';

import { useStorage } from '../../context/StorageContext';

// Helper function to add areaIds to the supplementAreasMap
function addAreaIdsToSupplementMap(
  map: Map<string, Set<string>>,
  refId: string,
  areaIds: string[]
) {
  if (!map.has(refId)) map.set(refId, new Set<string>());
  const set = map.get(refId)!;
  areaIds.forEach(id => set.add(id));
}

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
    tips.forEach(tip => {
      map.set(tip.id, new Set((tip.areas || []).map(a => a.id)));
    });
    return map;
  }, []);

  const getFavoriteTipsForArea = React.useCallback((areaId: string) => {
    return tips
      .filter(tip => (tip.areas || []).some(a => a.id === areaId))
      .filter(tip => {
        const v = viewedTips?.find(vt => vt.mainGoalId === areaId && vt.tipId === tip.id);
        return v?.verdict && positiveVerdictsSet.has(v.verdict as VerdictValue);
      })
      .map(tip => t(`tips:${tip.id}.title`));
  }, [t, viewedTips, positiveVerdictsSet]);

  // Ny: karta från supplement-id till områden (härleds från tips)
    const supplementAreasMap = React.useMemo(() => {
      const map = new Map<string, Set<string>>();
      tips.forEach(tip => {
        const areaIds = (tip.areas || []).map(a => a.id);
        (tip.supplements || []).forEach(ref => {
          if (!ref?.id) return;
          addAreaIdsToSupplementMap(map, ref.id, areaIds);
        });
      });
      return map;
    }, []);
  
    const getPlannedTipsForArea = React.useCallback((areaId: string) => {
      // Tips från planer
      const plannedTipIds = [
        ...plans.training,
        ...plans.nutrition,
        ...plans.other,
      ]
        .map(entry => entry.tipId)
        .filter(Boolean);
  
      // Tips från supplements
      const supplementTipIds = (plans.supplements || [])
        .flatMap(plan =>
          (plan.supplements || [])
            .map(entry => entry?.supplement?.id)
            .filter(Boolean)
            .flatMap(supId => {
              // Hämta tips som har detta supplement och täcker areaId
              const areaSet = supplementAreasMap.get(supId);
              if (areaSet?.has(areaId)) {
                // Hitta alla tips som har detta supplement och areaId
                return tips
                  .filter(
                    tip =>
                      (tip.supplements || []).some(s => s.id === supId) &&
                      (tip.areas || []).some(a => a.id === areaId)
                  )
                  .map(tip => tip.id);
              }
              return [];
            })
        );
  
      // Slå ihop och ta bort dubbletter
      const allTipIds = Array.from(new Set([...plannedTipIds, ...supplementTipIds]));
  
      return allTipIds
        .map(tipId => t(`tips:${tipId}.title`));
    }, [plans, t, supplementAreasMap]);

 /* useEffect(() => {
    setMyXP(600); // Sätt en hög XP för att testa nivå 3
  }, [setMyXP]);*/

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
  
  const [activeTab, setActiveTab] = React.useState<'coverage' | 'progress'>('progress');

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

      <ThemedText type="title3" style={[styles.title, { color: colors.accentStrong }]} uppercase>{t(`levels:${levelTitle}`)}</ThemedText>

      <View style={styles.progressRow}>
        <View style={styles.progressBarWrap}>
          
        <InfoButtonWithText infoTextKey="dashboard.xpInfo">
          <ProgressBarWithLabel progress={myXP / xpMax} label={progressText} height={12} />
        </InfoButtonWithText>
        </View>
      </View>

      {/* Tabbar under progressbaren */}
      <View style={styles.tabBarRow}>
        
        <Pressable onPress={() => setActiveTab('progress')}>
          <ThemedText type="defaultSemiBold"
            style={{
              color: activeTab === 'progress' ? colors.accentStrong : colors.textMuted
            }}
          >
            {t('common:dashboard.myProgress')}
          </ThemedText>
        </Pressable>
        <Pressable onPress={() => setActiveTab('coverage')}>
          <ThemedText type="defaultSemiBold"
            style={{
              color: activeTab === 'coverage' ? colors.accentStrong : colors.textMuted
            }}
          >
            {t('common:dashboard.checkCoverage')}
          </ThemedText>
        </Pressable>
      </View>

      {areas
        .filter(item => myGoals.includes(item.id))
        .map(item => {
          const areaId = item.id;
          const favoriteTipsList = getFavoriteTipsForArea(areaId);
          const plannedTipsList = getPlannedTipsForArea(areaId);

          let description = '';
          if (activeTab === 'coverage') {
            description = plannedTipsList.length > 0
              ? plannedTipsList.join('\n')
              : t('common:dashboard.noPlanned');
          } else {
            description = favoriteTipsList.length > 0
              ? favoriteTipsList.join('\n')
              : t('common:dashboard.noFavorites');
          }
          const areaXP =
            viewedTips?.filter(tip => tip.mainGoalId === areaId).reduce((sum, tip) => sum + (tip.xpEarned || 0), 0) ||
            0;

          const hasAnyGoalInArea = [...plans.training, ...plans.nutrition, ...plans.other].some(entry => {
            const areaIds = tipAreasMap.get(entry.tipId);
            return areaIds?.has(areaId);
          });

          const hasAnySupplementInArea = (plans.supplements || []).some(plan =>
            (plan.supplements || []).some(entry => {
              const supId = entry?.supplement?.id;
              if (!supId) return false;
              const areaSet = supplementAreasMap.get(supId);
              return areaSet?.has(areaId) ?? false;
            })
          );

          const hasAnyTipInArea = hasAnyGoalInArea || hasAnySupplementInArea;

          // Visa checkIcon när coverage-tabben är aktiv, annars XP
          const isActiveForCard = activeTab === 'coverage' ? hasAnyTipInArea : false;
          const xpForCard = activeTab === 'coverage' ? undefined : areaXP;

          return (
            <AppCard
              key={areaId}
              icon={item.icon}
              title={t(`areas:${item.id}.title`)}
              description={description}
              isActive={isActiveForCard}
              xp={xpForCard}
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
          <ThemedText style={[styles.editButtonText, { color: colors.accentStrong }]}>
            {t('common:dashboard.editAreas')}
          </ThemedText>
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
    fontWeight: 'bold',
    marginBottom: 10,
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
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarWrap: {
    flex: 1,
  },
  infoButton: {
    position: 'absolute',
    right: 0,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontWeight: '700',
  },
  infoText: {
    marginTop: 6,
  },
  tabBarRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
    gap: 10
    // 'gap' is not supported in all React Native versions, so use marginRight on children if needed
  },
});
