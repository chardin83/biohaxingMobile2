import { Ionicons } from '@expo/vector-icons';
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable,StyleSheet, View } from "react-native";
import { Icon } from 'react-native-paper';

import { Supplement } from "@/app/domain/Supplement";
import { areas } from "@/locales/areas";
import { Tip } from "@/locales/tips";

import { ThemedText } from "../ThemedText";
import AppButton from "../ui/AppButton";
import Badge from "../ui/Badge";
import DiscreetButton from "../ui/DiscreetButton";
import { InfoButtonWithText } from "../ui/InfoButtonWithText";
import ProgressBarWithLabel from "../ui/ProgressbarWithLabel";

function getAreaIconColor(areaId: string, colors: any) {
  switch (areaId) {
    case 'energy':
      return colors.area.energy;
    case 'mind':
      return colors.area.mind;
    case 'philosophy':
      return colors.area.philosophy;
    case 'sleepQuality':
      return colors.area.sleep;
    case 'nervousSystem':
      return colors.area.nervousSystem;
    case 'strength':
      return colors.area.strength;
    case 'digestiveHealth':
      return colors.area.digestiveHealth;
    case 'cardioFitness':
      return colors.area.cardio;
    case 'immuneSystem':
      return colors.area.immuneSystem;
    default:
      return colors.primary;
  }
}

const ICON_SIZE_MAIN = 50;
const ICON_SIZE_SECONDARY = 26;
const ICON_BORDER = 36; // diameter för små ikoner

const VERDICT_ICON_BY_VALUE: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  startNow: 'play-circle-outline',
  interested: 'repeat-outline',
  alreadyWorks: 'checkmark-circle-outline',
  testedFailed: 'close-circle-outline',
  notInterested: 'remove-circle-outline',
};

type DetailsTopSectionProps = {
  areaId: string;
  colors: any;
  tip: Tip | undefined;
  myLevel: number;
  resolvedSupplements: Supplement[];
  titleKey: string | undefined;
  isFavorite: boolean;
  totalXpEarned: number;
  educationXpEarned: number;
  nutritionXpEarned: number;
  infoText: string;
  progress: number;
  progressLabel: string;
  showTopPlanAction: boolean;
  isTipInPlan: boolean;
  planBadgeLabel: string;
  addPlanButtonTitle: string;
  handleAddPlanEntry: () => void;
  showSupplementDiscreetButton: boolean;
  currentVerdict?: string | null;
  onOpenVerdict?: () => void;
};

const DetailsTopSection: React.FC<DetailsTopSectionProps> = ({
  areaId,
  colors,
  tip,
  myLevel,
  resolvedSupplements,
  titleKey,
  isFavorite,
  totalXpEarned,
  educationXpEarned,
  nutritionXpEarned,
  infoText,
  progress,
  progressLabel,
  showTopPlanAction,
  isTipInPlan,
  planBadgeLabel,
  addPlanButtonTitle,
  handleAddPlanEntry,
  showSupplementDiscreetButton,
  currentVerdict,
  onOpenVerdict,
}) => {
  const { t } = useTranslation();

  // Hämta area-objekt för alla areas i tip
  const tipAreas = tip?.areas ?? [];
  const allAreaObjs = tipAreas.map(a => areas.find(ar => ar.id === a.id)).filter(Boolean);

  // Dela upp övriga areas i vänster och höger
  const otherAreas = allAreaObjs.filter(a => a && a.id !== areaId);
  const leftAreas = otherAreas.filter((_, i) => i % 2 === 0);
  const rightAreas = otherAreas.filter((_, i) => i % 2 === 1);

  const mainArea = areas.find(a => a.id === areaId);
  const verdictIconName = currentVerdict ? VERDICT_ICON_BY_VALUE[currentVerdict] : undefined;

  return (
    <View style={styles.topSection}>
      <View style={styles.titleRow}>
           <ThemedText type="title" style={{ color: colors.primary }}>
        {resolvedSupplements[0]?.name ?? t(`tips:${titleKey}`)}
      </ThemedText>
        <ThemedText type="subtitle" style={{ color: colors.primary }} >
          {t(`areas:${areaId}.title`)}
        </ThemedText>
        {onOpenVerdict && (
          <Pressable onPress={onOpenVerdict} style={styles.verdictIconButton}>
            {verdictIconName ? (
              <Ionicons name={verdictIconName} size={20} color={colors.primary} />
            ) : (
              <Icon source="help-circle" size={20} color={colors.primary} />
            )}
          </Pressable>
        )}
      </View>
      <View style={[styles.iconRow, { borderColor: colors.borderLight }]}>
        {/* Vänster små ikoner */}
        <View style={styles.iconColumn}>
          {leftAreas.map(a => (
            a ? (
              <View
                key={a.id}
                style={[
                  styles.iconBorder,
                  {
                    borderColor: colors.borderLight,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <View style={styles.smallIconDim}>
                  <Icon
                    source={a.icon}
                    size={ICON_SIZE_SECONDARY}
                    color={getAreaIconColor(a.id, colors)}
                  />
                </View>
              </View>
            ) : null
          ))}
        </View>
        {/* Stor ikon för aktuell area */}
        <View style={[styles.iconWrapper, { borderColor: colors.borderLight, backgroundColor: colors.background }]}>
          <Icon
            source={mainArea?.icon ?? "help-circle"}
            size={ICON_SIZE_MAIN}
            color={getAreaIconColor(areaId, colors)}
          />
          {tip?.level && (
            <Badge
              style={[
                styles.levelBadge,
                myLevel < tip.level ? styles.levelBadgeLocked : styles.levelBadgeUnlocked,
                { backgroundColor: colors.modalBackground }
              ]}
            >
              <ThemedText type="title3" style={{ color: colors.textLight }} uppercase numberOfLines={1}>
                {myLevel < tip.level ? '🔒 ' : ''}
                {t('general.level')} {tip.level}
              </ThemedText>
            </Badge>
          )}
        </View>
        {/* Höger små ikoner */}
        <View style={styles.iconColumn}>
          {rightAreas.map(a => (
            a ? (
              <View
                key={a.id}
                style={[
                  styles.iconBorder,
                  {
                    borderColor: colors.borderLight,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <View style={styles.smallIconDim}>
                  <Icon
                    source={a.icon}
                    size={ICON_SIZE_SECONDARY}
                    color={getAreaIconColor(a.id, colors)}
                  />
                </View>
              </View>
            ) : null
          ))}
        </View>
      </View>
   
      {isFavorite && (
        <View style={[styles.favoriteChip, { backgroundColor: colors.accentWeak }]}>
          <ThemedText type="caption" style={[styles.favoriteText, { color: colors.primary }]}>
            ★ {t('common:dashboard.favorite', 'Favorite')}
          </ThemedText>
        </View>
      )}
      <ThemedText type="caption">
        {totalXpEarned} XP earned
      </ThemedText>
      <ThemedText type="explainer" style={[styles.xpSplitText, { color: colors.textMuted }]}>
        {t('common:dashboard.xpBreakdown', {
          education: educationXpEarned,
          nutrition: nutritionXpEarned,
        })}
      </ThemedText>
      <View style={styles.progressRow}>
        <View style={styles.progressBarWrap}>
          <InfoButtonWithText infoTextKey={infoText}>
            <ProgressBarWithLabel progress={progress} label={progressLabel} height={12} />
          </InfoButtonWithText>
        </View>
      </View>
      <PlanActionSection
        showTopPlanAction={showTopPlanAction}
        isTipInPlan={isTipInPlan}
        planBadgeLabel={planBadgeLabel}
        showSupplementDiscreetButton={showSupplementDiscreetButton}
        addPlanButtonTitle={addPlanButtonTitle}
        handleAddPlanEntry={handleAddPlanEntry}
        colors={colors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centeredDiscreetButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  topSection: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    gap: 4,
    width: ICON_BORDER,
    minWidth: ICON_BORDER,
  },
  iconBorder: {
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    opacity: 0.7,
    width: ICON_BORDER,
    height: ICON_BORDER,
  },
  smallIconDim: {
    opacity: 0.5,
  },
  iconBorderSize: {
    width: ICON_BORDER,
    height: ICON_BORDER,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  titleRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  verdictIconButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    padding: 6,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -24,
  },
  levelBadgeLocked: {
    minWidth: 120,
    right: -88,
  },
  levelBadgeUnlocked: {
    minWidth: 90,
    right: -55,
  },
  favoriteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 6,
  },
  xpSplitText: {
    marginTop: 2,
    marginBottom: 6,
  },
  favoriteText: {
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 8,
  },
  progressBarWrap: {
    flex: 1,
  },
  planBadgeLabel: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  planActionSection: {
    width: '100%',
    marginTop: 16,
    alignSelf: 'stretch',
  },
  stretch: {
    alignSelf: 'stretch',
  },
});

type PlanActionSectionProps = {
  showTopPlanAction: boolean;
  isTipInPlan: boolean;
  planBadgeLabel: string;
  addPlanButtonTitle: string;
  handleAddPlanEntry: () => void;
  colors: any;
};

function PlanActionSection({
  showTopPlanAction,
  isTipInPlan,
  planBadgeLabel,
  addPlanButtonTitle,
  handleAddPlanEntry,
  colors,
  showSupplementDiscreetButton,
}: Readonly<PlanActionSectionProps & { showSupplementDiscreetButton: boolean }>) {
  if (!showTopPlanAction) return null;
  return (
    <View style={styles.planActionSection}>
      {isTipInPlan ? (
        <>
          <View style={[styles.planBadgeRow, { backgroundColor: colors.accentVeryWeak }]}> 
            <Icon source="check" size={18} color={colors.primary} />
            <ThemedText type="caption" style={[styles.planBadgeLabel, { color: colors.primary }]}> 
              {planBadgeLabel}
            </ThemedText>
          </View>
          {showSupplementDiscreetButton && (
            <View style={styles.centeredDiscreetButton}>
              <DiscreetButton
                title={`+ ${addPlanButtonTitle}`}
                onPress={handleAddPlanEntry}
              />
            </View>
          )}
        </>
      ) : (
        <AppButton
          title={addPlanButtonTitle}
          onPress={handleAddPlanEntry}
          variant="primary"
          style={styles.stretch}
        />
      )}
    </View>
  );
}

export default DetailsTopSection;