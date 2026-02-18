import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet,View } from 'react-native';
import { Icon } from 'react-native-paper';

import ShowAllButton from '@/app/(tabs)/dashboard/area/[areaId]/details/ShowAllButton';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import { areas } from '@/locales/areas';
import { tips } from '@/locales/tips';


type AreaRelevanceSectionProps = {
  tip: typeof tips[number] | undefined;
  areaId: string;
  showAllAreas: boolean;
  setShowAllAreas: React.Dispatch<React.SetStateAction<boolean>>;
  effectiveTipId: string | null;
  addTipView: (areaId: string, tipId: string) => number;
  colors: any;
};

const AreaRelevanceSection: React.FC<AreaRelevanceSectionProps> = ({
  tip,
  areaId,
  showAllAreas,
  setShowAllAreas,
  effectiveTipId,
  addTipView,
  colors,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const prevShowAllRef = useRef(showAllAreas);

  useEffect(() => {
    const wasShowingAll = prevShowAllRef.current;
    if (!wasShowingAll && showAllAreas && effectiveTipId && tip?.areas?.length) {
      tip.areas.forEach(a => {
        if (a.id !== areaId) {
          const xpGained = addTipView(a.id, effectiveTipId);
          if (xpGained > 0) {
            console.log(`🎉 You gained ${xpGained} XP for viewing tip in area ${a.id} via Show All`);
          }
        }
      });
    }
    prevShowAllRef.current = showAllAreas;
  }, [showAllAreas, effectiveTipId, tip?.areas, areaId, addTipView]);

  if (!tip?.areas?.length) return null;
  return (
    <>
      <View style={styles.rowWithGap}>
        <ThemedText type="subtitle" style={[styles.relevanceHeading, { color: colors.textPrimary }]}>
          {t('common:goalDetails.relevance')}
        </ThemedText>
      </View>
      {(showAllAreas ? tip.areas : tip.areas.filter(a => a.id === areaId)).map(a => {
        const areaTitle = t(`areas:${a.id}.title`);
        const isCurrentArea = a.id === areaId;
        const areaMeta = areas.find(ar => ar.id === a.id);
        const appBoxContent = (
          <AppBox title={areaTitle} key={a.id}>
            <View style={styles.rowWithGap}>
              {areaMeta?.icon ? (
                <Icon source={areaMeta.icon} size={16} color={colors.primary} />
              ) : null}
              <ThemedText type="explainer" style={styles.descriptionText}>
                {t(`tips:${a.descriptionKey}`)}
              </ThemedText>
            </View>
          </AppBox>
        );
        if (isCurrentArea) {
          return appBoxContent;
        }
        return (
          <Pressable
            key={a.id}
            onPress={() => {
              router.replace({
                pathname: `/dashboard/area/${a.id}/details` as any,
                params: { prevAreaId: areaId, tipId: effectiveTipId },
              });
            }}
            accessibilityRole="button"
          >
            {appBoxContent}
          </Pressable>
        );
      })}
      {tip.areas.length > 1 && (
        <ShowAllButton
          showAll={showAllAreas}
          onPress={() => {
            setShowAllAreas(v => !v);
          }}
          style={styles.showAllButton}
          textStyle={styles.showAllText}
          accentColor={colors.accentDefault}
        />
      )}
    </>
  );
};


const styles = StyleSheet.create({
  relevanceHeading: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  rowWithGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  descriptionText: {
    paddingBottom: 8,
    paddingRight: 20
  },
  showAllButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    marginTop: -6,
    marginBottom: 20,
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '600',
  },

});

export default AreaRelevanceSection;