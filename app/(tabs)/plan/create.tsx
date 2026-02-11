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

  const renderList = (items: string[], emoji: string = '✨') =>
    items.length ? (
      items.map((item, idx) => (
        <ThemedText key={`${item}-${idx}`} type="default" style={styles.listItem}>
          {emoji} {item}
        </ThemedText>
      ))
    ) : (
      <ThemedText type="default" style={styles.muted}>
        {t('createPlan.none')}
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
    if (!id) return t('createPlan.untitled');
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
        <GoldenGlowButton
          style={styles.noMarginBottom}
          title={t('createPlan.createAIPlan')}
          onPress={handleCreatePlan}
          accessibilityLabel={t('createPlan.createAIPlanLabel')}
          accessibilityRole="button"
          accessibilityHint={
            tempPlans
              ? t('createPlan.createAIPlanHint')
              : undefined
          }
          disabled={!!tempPlans || loading}
        />
        {loading && <Loading />}
        {tempPlans && (
          <ThemedText type="caption" style={styles.captionInfo}>
            {t('createPlan.createAIPlanHint')}
          </ThemedText>
        )}
        {tempPlans && (
          <>
            {tempPlans.reasonSummary && (
              <ThemedText
                type="default"
                style={styles.reasonText}
                accessibilityLabel={`AI-planens sammanfattning: ${tempPlans.reasonSummary}`}
              >
                {tempPlans.reasonSummary}
              </ThemedText>
            )}
            <Collapsible
              title={t('createPlan.aiSupplements', { count: newSupplementCount })}
              contentStyle={styles.collapsibleContent}
              accessibilityLabel={t('createPlan.aiSupplementsLabel')}
            >
              <ThemedText type="defaultSemiBold">{t('createPlan.new')}</ThemedText>
              {renderList(newSupplementItems, '✨')}
              <ThemedText type="defaultSemiBold" style={styles.sectionSpacer}>
                {t('createPlan.existing')}
              </ThemedText>
              {renderList(existingSupplementItems, '•')}
            </Collapsible>
            <Collapsible
              title={t('createPlan.aiTraining', { count: newTrainingCount })}
              contentStyle={styles.collapsibleContent}
              accessibilityLabel={t('createPlan.aiTrainingLabel')}
            >
              <ThemedText type="defaultSemiBold">{t('createPlan.new')}</ThemedText>
              {renderList(newTrainingItems)}
              <ThemedText type="defaultSemiBold" style={styles.sectionSpacer}>
                {t('createPlan.existing')}
              </ThemedText>
              {renderList(existingTrainingItems, '•')}
            </Collapsible>
            <Collapsible
              title={t('createPlan.aiNutrition', { count: newNutritionCount })}
              contentStyle={styles.collapsibleContent}
              accessibilityLabel={t('createPlan.aiNutritionLabel')}
            >
              <ThemedText type="defaultSemiBold">{t('createPlan.new')}</ThemedText>
              {renderList(newNutritionItems)}
              <ThemedText type="defaultSemiBold" style={styles.sectionSpacer}>
                {t('createPlan.existing')}
              </ThemedText>
              {renderList(existingNutritionItems, '•')}
            </Collapsible>
            <Collapsible
              title={t('createPlan.aiOther', { count: newOtherCount })}
              contentStyle={styles.collapsibleContent}
              accessibilityLabel={t('createPlan.aiOtherLabel')}
            >
              <ThemedText type="defaultSemiBold">{t('createPlan.new')}</ThemedText>
              {renderList(newOtherItems)}
              <ThemedText type="defaultSemiBold" style={styles.sectionSpacer}>
                {t('createPlan.existing')}
              </ThemedText>
              {renderList(existingOtherItems, '•')}
            </Collapsible>

            <View style={styles.buttonRow}>
              <AppButton
                title={t('createPlan.acceptAIPlan')}
                onPress={handleAccept}
              />
              <AppButton
                title={t('general.cancel')}
                onPress={handleCancel}
                variant="secondary"
              />
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
  noMarginBottom: {
    marginBottom: 0,
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
  captionInfo: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 12,
  },
});