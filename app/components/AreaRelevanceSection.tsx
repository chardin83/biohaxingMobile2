import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import ShowAllButton from '@/app/(tabs)/dashboard/area/[areaId]/details/ShowAllButton';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import { tips } from '@/locales/tips';

type AreaRelevanceSectionProps = {
  tip: typeof tips[number] | undefined;
  areaId: string;
  showAllAreas: boolean;
  setShowAllAreas: React.Dispatch<React.SetStateAction<boolean>>;
  effectiveTipId: string | null;
  addTipView: (areaId: string, tipId: string) => number;
  styles: { [key: string]: any };
  colors: any;
};

const AreaRelevanceSection: React.FC<AreaRelevanceSectionProps> = ({
  tip,
  areaId,
  showAllAreas,
  setShowAllAreas,
  effectiveTipId,
  addTipView,
  styles,
  colors,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  if (!tip?.areas?.length) return null;
  return (
    <>
      <ThemedText type="subtitle" style={[styles.relevanceHeading, { color: colors.textPrimary }]}>
        {t('common:goalDetails.relevance')}
      </ThemedText>
      {(showAllAreas ? tip.areas : tip.areas.filter(a => a.id === areaId)).map(a => {
        const areaTitle = t(`areas:${a.id}.title`);
        const isCurrentArea = a.id === areaId;
        const appBoxContent = (
          <AppBox title={areaTitle} key={a.id}>
            <ThemedText type="explainer" style={styles.descriptionText}>
              {t(`tips:${a.descriptionKey}`)}
            </ThemedText>
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
            setShowAllAreas(v => {
              const next = !v;
              if (next && effectiveTipId && tip?.areas?.length) {
                tip.areas.forEach(a => {
                  if (a.id !== areaId) {
                    const xpGained = addTipView(a.id, effectiveTipId);
                    if (xpGained > 0) {
                      console.log(`🎉 You gained ${xpGained} XP for viewing tip in area ${a.id} via Show All`);
                    }
                  }
                });
              }
              return next;
            });
          }}
          style={styles.showAllButton}
          textStyle={styles.showAllText}
          accentColor={colors.accentDefault}
        />
      )}
    </>
  );
};

export default AreaRelevanceSection;