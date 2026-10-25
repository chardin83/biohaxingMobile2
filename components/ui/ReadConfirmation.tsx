import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { INFORMATION_READ_SECONDS } from '@/constants/tipXP';
import { XP_FOR_INFORMATION_READ } from '@/constants/XP';

import { CountdownCircle } from './CountdownCircle';
import DiscreetButton from './DiscreetButton';
import XPBadge from './XPBadge';

type Props = Readonly<{ read: boolean; active: boolean; onConfirm: () => void; xp?: number }>;

export default function ReadConfirmation({ read, active, onConfirm, xp = XP_FOR_INFORMATION_READ }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [readyToConfirm, setReadyToConfirm] = useState(false);
  return (
    <View style={[styles.row, !read && !readyToConfirm && styles.countdownSpace]}>
      {!read && <XPBadge amount={xp} showPlus />}
      {!read && !readyToConfirm && active && <CountdownCircle seconds={INFORMATION_READ_SECONDS} color={colors.xp} onComplete={() => setReadyToConfirm(true)} />}
      {!read && readyToConfirm && <DiscreetButton title={t('common:tipDetails.iHaveRead')} color={colors.xpText} rightIcon="check" onPress={onConfirm} />}
      {read && <View style={styles.check}><XPBadge checked /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  check: { marginLeft: 'auto' },
  countdownSpace: { minHeight: 54 },
});
