import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Notice from '@/components/ui/Notice';
import SettingsCard from '@/components/ui/SettingsCard';
import StepsContainer from '@/components/ui/StepsContainer';
import { calculateEnergyNeeds } from '@/utils/energyNeeds';

export default function NutritionEnergySummary() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation('common');
  const { userProfile } = useStorage();
  const energy = calculateEnergyNeeds(userProfile);
  const pal = energy ? new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1 }).format(energy.pal) : '';

  return (
    <StepsContainer
      title={t('nutritionGoals.summary.title')}
      description={t('nutritionGoals.summary.description')}
      currentStep={3}
      footerHelp={userProfile.biologicalSex === 'intersex' ? t('nutritionGoals.endGuideHelp') : undefined}
      footer={
        <AppButton
          title={t(userProfile.biologicalSex === 'intersex' ? 'nutritionGoals.endGuide' : 'onboarding.continue')}
          variant="primary"
          rightIcon="chevron.right"
          disabled={!energy && userProfile.biologicalSex !== 'intersex'}
          onPress={() => router.push(userProfile.biologicalSex === 'intersex' ? '/settings/nutrition-manual' : '/settings/nutrition-distribution')}
        />
      }
    >
      {energy ? (
        <>
          <SettingsCard>
            <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight }]}>
              <IconSymbol name="flame" size={24} color={colors.primary} />
              <View style={styles.label}>
                <ThemedText type="title3">{t('nutritionGoals.summary.basal')}</ThemedText>
                <ThemedText type="caption">{t('nutritionGoals.summary.basalDescription')}</ThemedText>
              </View>
              <ThemedText type="title3">{energy.basal} kcal</ThemedText>
            </View>
            <View style={styles.row}>
              <IconSymbol name="trainingWalking" size={24} color={colors.primary} />
              <View style={styles.label}>
                <ThemedText type="title3">{t('nutritionGoals.summary.activity')}</ThemedText>
                <ThemedText type="caption">PAL {pal}</ThemedText>
              </View>
              <ThemedText type="title3">+{energy.activity} kcal</ThemedText>
            </View>
          </SettingsCard>
          <SettingsCard style={styles.totalCard}>
            <ThemedText type="title3">{t('nutritionGoals.summary.total')}</ThemedText>
            <ThemedText type="title2" style={{ color: colors.primary }}>
              {energy.total} kcal
            </ThemedText>
            <ThemedText type="caption">{t('nutritionGoals.summary.perDay')}</ThemedText>
          </SettingsCard>
        </>
      ) : null}
      {!energy && userProfile.biologicalSex === 'intersex' && (
        <Notice
          variant="info"
          title={t('nutritionGoals.summary.unsupportedSexTitle')}
          message={t('nutritionGoals.summary.unsupportedSex')}
        />
      )}
    </StepsContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  label: { flex: 1, gap: 4 },
  totalCard: { marginTop: 16, padding: 20, alignItems: 'center', gap: 8 },
});
