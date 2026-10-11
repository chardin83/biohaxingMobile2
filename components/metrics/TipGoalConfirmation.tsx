import { useIsFocused, useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { CountdownCircle } from '@/components/ui/CountdownCircle';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useHabitTracking } from '@/hooks/useHabitTracking';
import type { Tip } from '@/locales/tips';
import { getActiveHabitTarget } from '@/services/targetProgress/habitResultStorage';
import { toDateKey } from '@/utils/dateUtils';

export default function TipGoalConfirmation({ tip }: Readonly<{ tip: Tip }>) {
  const { colors } = useTheme();
  const { t } = useTranslation('tips');
  const { plans, dailyHabitTracking } = useStorage();
  const { logHabit } = useHabitTracking();
  const focused = useIsFocused();
  const [active, setActive] = React.useState(AppState.currentState === 'active');
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  const today = toDateKey(new Date());
  const confirmation = tip.goalConfirmation;
  const key = confirmation?.trackingKey;
  const eligible = key && getActiveHabitTarget(plans.other.filter(plan => plan.tipId === tip.id), key, today);
  const completed = dailyHabitTracking[today]?.[key ?? '']?.isFulfilled === true;
  if (!eligible || !confirmation || !key) return null;
  return (
    <View style={[styles.card, { backgroundColor: colors.primaryVeryWeak, borderColor: colors.primary }]}>
      {completed ? <IconSymbol name="check" size={26} color={colors.primary} /> : (
        focused && active && <CountdownCircle seconds={confirmation.seconds} color={colors.primary} onComplete={() => {
          logHabit({ trackingKey: key, selectedDate: toDateKey(new Date()), value: 1, slot: 'daily' });
        }} />
      )}
      <View style={styles.text}>
        <ThemedText type="defaultSemiBold">{t(completed ? confirmation.completedTitleKey : confirmation.pendingTitleKey)}</ThemedText>
        <ThemedText type="caption">{t(completed ? confirmation.completedDescriptionKey : confirmation.pendingDescriptionKey)}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, marginBottom: 16 },
  text: { flex: 1 },
});
