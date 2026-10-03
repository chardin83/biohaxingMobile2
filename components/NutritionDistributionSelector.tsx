import { useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { NutritionDistribution } from '@/app/context/storage/userProfile/userProfileTypes';
import { DISTRIBUTION_CHOICES, DISTRIBUTIONS, MACROS } from '@/utils/nutritionGoals';

import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import RadioButton from './ui/RadioButton';
import SettingsCard from './ui/SettingsCard';

export default function NutritionDistributionSelector({
  value,
  onChange,
  disabled = false,
}: Readonly<{
  value: NutritionDistribution;
  onChange: (value: NutritionDistribution) => void;
  disabled?: boolean;
}>) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  return (
    <SettingsCard>
      {DISTRIBUTION_CHOICES.map((choice, index) => (
        <RadioButton
          key={choice}
          selected={value === choice}
          accessibilityLabel={
            choice === 'custom'
              ? `${t(`nutritionGoals.distributions.${choice}`)}, ${t('nutritionGoals.customDescription')}`
              : `${t(`nutritionGoals.distributions.${choice}`)}, ${t('nutritionGoals.distributionRatio', DISTRIBUTIONS[choice])}`
          }
          disabled={disabled}
          style={[
            styles.distributionOption,
            index < DISTRIBUTION_CHOICES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight },
          ]}
          onPress={() => onChange(choice)}
        >
          <View style={styles.optionLabel}>
            <ThemedText type="title3">{t(`nutritionGoals.distributions.${choice}`)}</ThemedText>
            {choice === 'custom' && (
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {t('nutritionGoals.customDescription')}
              </ThemedText>
            )}
            {choice !== 'custom' && (
              <View style={styles.distributionMacros}>
                {MACROS.map(macro => (
                  <View key={macro.key} style={styles.distributionMacro}>
                    <IconSymbol name={macro.icon} size={16} color={macro.color} />
                    <View style={styles.distributionValue}>
                      <ThemedText type="default">{DISTRIBUTIONS[choice][macro.key]} %</ThemedText>
                      <ThemedText type="caption" style={[styles.distributionLabel, { color: colors.textMuted }]}>
                        {t(`nutritionGoals.${macro.key}`).toLowerCase()}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </RadioButton>
      ))}
    </SettingsCard>
  );
}

const styles = StyleSheet.create({
  distributionOption: { padding: 16 },
  optionLabel: { flex: 1, gap: 4 },
  distributionMacros: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  distributionMacro: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  distributionValue: { gap: 2 },
  distributionLabel: { fontSize: 10, lineHeight: 14 },
});
