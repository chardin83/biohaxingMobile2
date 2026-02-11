import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { GoldenGlowButton } from '@/components/ui/GoldenGlowButton';
import { Loading } from '@/components/ui/Loading';
import { tips } from '@/locales/tips';
import { createPlan } from '@/services/gptServices';

export default function CreatePlanScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation(['common', 'plan']);
  const { plans, tempPlans, setTempPlans, setPlans, myGoals, myLevel } = useStorage();

  const [loading, setLoading] = React.useState(false);

  const newSupplementCount = useMemo(
    () => (tempPlans?.supplements ?? []).reduce((acc, p) => acc + (p.supplements?.length ?? 0), 0),
    [tempPlans]
  );

  if (loading) {
    return <Loading />;
  }
  const newTrainingCount = tempPlans?.training?.length ?? 0;
  const newNutritionCount = tempPlans?.nutrition?.length ?? 0;
  const newOtherCount = tempPlans?.other?.length ?? 0;

  const renderList = (items: string[]) =>
    items.length ? (
      items.map((item, idx) => (
        <ThemedText key={`${item}-${idx}`} type="default" style={styles.listItem}>
          • {item}
        </ThemedText>
      ))
    ) : (
      <ThemedText type="default" style={styles.muted}>
        {t('plan.none', { defaultValue: 'Inget' })}
      </ThemedText>
    );

  const newSupplementItems = tempPlans
    ? (tempPlans.supplements ?? []).flatMap(plan =>
        (plan.supplements ?? []).map(sup => `${sup.name} (${plan.name} ${plan.prefferedTime})`)
      )
    : [];
  const existingSupplementItems = (plans.supplements ?? []).flatMap(plan =>
    (plan.supplements ?? []).map(sup => `${sup.name} (${plan.name} ${plan.prefferedTime})`)
  );

  const tipTitleById = (id?: string) => {
    if (!id) return t('plan.untitled', { defaultValue: 'Utan titel' });
    const tip = tips.find(candidate => candidate.id === id);
    return t(`tips:${id}.title`, { defaultValue: tip?.title ?? id });
  };

  const newTrainingItems = tempPlans ? (tempPlans.training ?? []).map(tip => tipTitleById(tip.tipId)) : [];
  const existingTrainingItems = (plans.training ?? []).map(tip => tipTitleById(tip.tipId));

  const newNutritionItems = tempPlans ? (tempPlans.nutrition ?? []).map(tip => tipTitleById(tip.tipId)) : [];
  const existingNutritionItems = (plans.nutrition ?? []).map(tip => tipTitleById(tip.tipId));

  const newOtherItems = tempPlans ? (tempPlans.other ?? []).map(tip => tipTitleById(tip.tipId)) : [];
  const existingOtherItems = (plans.other ?? []).map(tip => tipTitleById(tip.tipId));

  const handleAccept = () => {
    if (tempPlans) {
      setPlans(tempPlans);
    }
    setTempPlans(null);
    router.push('/(tabs)/plan');
  };

  const handleCancel = () => {
    setTempPlans(null);
    router.push('/(tabs)/plan');
  };

  const handleCreatePlan = () => {
    setLoading(true);
      const locale = i18n.language?.startsWith('sv') ? 'sv' : 'en';
      createPlan(plans, myGoals, myLevel, locale)
        .then(res => setTempPlans(res.plans))
        .finally(() => setLoading(false));
  };

  return (
    <Container background="gradient">
      <Card style={styles.card}>
        {tempPlans == null ? (
          <GoldenGlowButton
            style={{ marginBottom: 24 }}
            title="✨ Skapa AI-plan"
            onPress={handleCreatePlan}
          />
        ) : (
          <>
            {/* Visa reason överst */}
            {tempPlans.reasonSummary && (
              <ThemedText type="default" style={styles.reasonText}>
                {tempPlans.reasonSummary}
              </ThemedText>
            )}
            {/* Collapsible-sektioner och godkänn/avbryt-knappar */}
            <Collapsible
              title={t('plan.aiSupplements', {
                defaultValue: `${newSupplementCount} nya kosttillskott`,
              })}
              contentStyle={styles.collapsibleContent}
            >
              <ThemedText type="defaultSemiBold">{t('plan.new', { defaultValue: 'Nya' })}</ThemedText>
              {renderList(newSupplementItems)}
              <ThemedText type="defaultSemiBold" style={styles.sectionSpacer}>
                {t('plan.existing', { defaultValue: 'Befintliga' })}
              </ThemedText>
              {renderList(existingSupplementItems)}
            </Collapsible>
            <Collapsible
              title={t('plan.aiTraining', {
                defaultValue: `${newTrainingCount} träningsplaner`,
              })}
              contentStyle={styles.collapsibleContent}
            >
              <ThemedText type="defaultSemiBold">{t('plan.new', { defaultValue: 'Nya' })}</ThemedText>
              {renderList(newTrainingItems)}
              <ThemedText type="defaultSemiBold" style={styles.sectionSpacer}>
                {t('plan.existing', { defaultValue: 'Befintliga' })}
              </ThemedText>
              {renderList(existingTrainingItems)}
            </Collapsible>
            <Collapsible
              title={t('plan.aiNutrition', {
                defaultValue: `${newNutritionCount} nutritionstips`,
              })}
              contentStyle={styles.collapsibleContent}
            >
              <ThemedText type="defaultSemiBold">{t('plan.new', { defaultValue: 'Nya' })}</ThemedText>
              {renderList(newNutritionItems)}
              <ThemedText type="defaultSemiBold" style={styles.sectionSpacer}>
                {t('plan.existing', { defaultValue: 'Befintliga' })}
              </ThemedText>
              {renderList(existingNutritionItems)}
            </Collapsible>
            <Collapsible
              title={t('plan.aiOther', {
                defaultValue: `${newOtherCount} övriga tips`,
              })}
              contentStyle={styles.collapsibleContent}
            >
              <ThemedText type="defaultSemiBold">{t('plan.new', { defaultValue: 'Nya' })}</ThemedText>
              {renderList(newOtherItems)}
              <ThemedText type="defaultSemiBold" style={styles.sectionSpacer}>
                {t('plan.existing', { defaultValue: 'Befintliga' })}
              </ThemedText>
              {renderList(existingOtherItems)}
            </Collapsible>

            <View style={styles.buttonRow}>
              <AppButton title={t('plan.acceptAIPlan', { defaultValue: 'Godkänn AI‑plan' })} onPress={handleAccept} />
              <AppButton title={t('general.cancel', { defaultValue: 'Avbryt' })} onPress={handleCancel} variant="secondary" />
            </View>
          </>
        )}
      </Card>
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 60,
    marginHorizontal: 16,
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  collapsibleContent: {
    marginLeft: 0,
  },
  listItem: {
    marginTop: 4,
  },
  muted: {
    opacity: 0.7,
    marginTop: 4,
  },
  sectionSpacer: {
    marginTop: 12,
  },
  buttonRow: {
    marginTop: 16,
    gap: 10,
  },
  reasonText: {
    marginBottom: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.85,
  },
});