import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { PREMIUM_QUOTAS } from '@/constants/Premium';

import AppButton from './AppButton';
import { CloseButton } from './CloseButton';
import DiscreetButton from './DiscreetButton';
import type { IconSymbolName } from './icon-symbol-map';
import { IconSymbol } from './IconSymbol';

export type PremiumPlan = 'monthly' | 'yearly';
type Props = Readonly<{ onStartPremium?: (plan: PremiumPlan) => void; onDismiss?: () => void }>;

export default function PremiumOffer({ onStartPremium, onDismiss }: Props) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>('yearly');
  const features: { key: string; icon: IconSymbolName; color: string; freeCount?: number; premiumCount?: number }[] = [
    { key: 'photo', freeCount: PREMIUM_QUOTAS.free.photoAnalyses.limit, premiumCount: PREMIUM_QUOTAS.premium.photoAnalyses.limit, icon: 'camera', color: colors.infoColor },
    { key: 'coach', freeCount: PREMIUM_QUOTAS.free.coachQuestions.limit, icon: 'chat', color: colors.primary },
    { key: 'plans', freeCount: PREMIUM_QUOTAS.free.aiPlans.limit, icon: 'calendar', color: colors.warmColor },
    { key: 'nutrition', icon: 'meal', color: colors.primary },
    { key: 'goals', icon: 'target', color: colors.icon },
  ];

  return <View style={styles.offer}>
      <View style={styles.heading}>
        <ThemedText type="title2" style={styles.headingText}>{t('premium.title')}</ThemedText>
        {onDismiss && <CloseButton onPress={onDismiss} />}
      </View>
      <ThemedText>{t('premium.subtitle')}</ThemedText>
      <View style={[styles.table, { borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={styles.featureCell} />
          <View style={[styles.valueCell, styles.columnHeader, { backgroundColor: colors.overlayLight }]}><ThemedText type="defaultSemiBold">{t('premium.free')}</ThemedText></View>
          <View style={[styles.valueCell, styles.columnHeader, { backgroundColor: colors.primaryVeryWeak }]}>
            <IconSymbol name="crown" size={20} color={colors.premium} /><ThemedText type="defaultSemiBold" style={{ color: colors.primary }}>{t('premium.premium')}</ThemedText>
          </View>
        </View>
        {features.map(feature => <View key={feature.key} style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
          <View style={styles.featureCell}>
            <IconSymbol name={feature.icon} size={22} color={feature.color} />
            <ThemedText type="caption" style={styles.featureLabel}>{t(`premium.features.${feature.key}.title`)}</ThemedText>
          </View>
          <View style={[styles.valueCell, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }]}><ThemedText type="caption" style={styles.value}>{t(`premium.features.${feature.key}.free`, { count: feature.freeCount })}</ThemedText></View>
          <View style={[styles.valueCell, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.primary, backgroundColor: colors.primaryVeryWeak }]}><ThemedText type="caption" style={[styles.value, styles.premiumValue, { color: colors.primary }]}>{t(`premium.features.${feature.key}.premium`, { count: feature.premiumCount })}</ThemedText></View>
        </View>)}
      </View>
      <View style={styles.plans}>
        {(['monthly', 'yearly'] as const).map(plan => <Pressable key={plan} accessibilityRole="radio" accessibilityState={{ checked: selectedPlan === plan }} accessibilityLabel={t(`premium.${plan}.price`)} onPress={() => setSelectedPlan(plan)} style={[styles.plan, { borderColor: selectedPlan === plan ? colors.primary : colors.border, backgroundColor: selectedPlan === plan ? colors.primaryVeryWeak : colors.overlayLight }]}>
          {plan === 'yearly' && <ThemedText type="caption" style={[styles.savings, { color: colors.primary }]}>{t('premium.savings', { percent: Math.round((1 - 999 / (129 * 12)) * 100) })}</ThemedText>}
          <ThemedText type="title3">{t(`premium.${plan}.price`)}</ThemedText>
          <ThemedText type="caption">{t(`premium.${plan}.description`)}</ThemedText>
        </Pressable>)}
      </View>
      <AppButton title={t('premium.start')} variant="primary" onPress={() => {
        if (onStartPremium) onStartPremium(selectedPlan);
        else Alert.alert(t('premium.title'), t('premium.purchaseUnavailable'));
      }} />
      {onDismiss && <View style={styles.notNow}><DiscreetButton title={t('premium.notNow')} onPress={onDismiss} /></View>}
  </View>;
}

const styles = StyleSheet.create({
  offer: { gap: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headingText: { flex: 1 },
  table: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', minHeight: 56 },
  featureCell: { width: '44%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  featureLabel: { flex: 1, fontWeight: '600' },
  valueCell: { width: '28%', justifyContent: 'center', alignItems: 'center', padding: 8 },
  columnHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  value: { textAlign: 'center' },
  premiumValue: { fontWeight: '600' },
  plans: { flexDirection: 'row', gap: 10 },
  plan: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 14, gap: 8 },
  savings: { fontWeight: '600' },
  notNow: { alignItems: 'center' },
});
