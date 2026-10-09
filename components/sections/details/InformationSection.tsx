import { useIsFocused, useTheme } from '@react-navigation/native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, useWindowDimensions,View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import { CountdownCircle } from '@/components/ui/CountdownCircle';
import DiscreetButton from '@/components/ui/DiscreetButton';
import XPBadge from '@/components/ui/XPBadge';
import { INFORMATION_READ_SECONDS } from '@/constants/tipXP';
import { XP_FOR_INFORMATION_READ } from '@/constants/XP';

export type InformationSectionRef = { checkVisibility: () => void };
type Props = Readonly<{ tipId: string; descriptionKey: string }>;

const InformationSection = forwardRef<InformationSectionRef, Props>(({ tipId, descriptionKey }, ref) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { viewedTips, claimTipInformationXP } = useStorage();
  const isRead = viewedTips.find(view => view.tipId === tipId)?.informationRead === true;
  const footerRef = useRef<View>(null);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [visible, setVisible] = useState(false);
  const [readyToConfirm, setReadyToConfirm] = useState(false);

  const checkVisibility = useCallback(() => {
    footerRef.current?.measureInWindow((_x, y, _width, height) => {
      setVisible(height > 0 && y >= insets.top && y + height <= screenHeight - insets.bottom);
    });
  }, [insets.top, insets.bottom, screenHeight]);
  useImperativeHandle(ref, () => ({ checkVisibility }), [checkVisibility]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (focused && active) checkVisibility();
  }, [focused, active, checkVisibility]);

  return (
    <AppBox title={t('common:tipDetails.information')}>
      <ThemedText type="explainer" style={styles.description}>{t(`tips:${descriptionKey}`)}</ThemedText>
      <View ref={footerRef} collapsable={false} onLayout={checkVisibility} style={[styles.reward, !isRead && !readyToConfirm && styles.countdownSpace]}>
        {!isRead && <XPBadge amount={XP_FOR_INFORMATION_READ} showPlus />}
        {visible && focused && active && !isRead && !readyToConfirm && <CountdownCircle
          seconds={INFORMATION_READ_SECONDS}
          color={colors.xp}
          onComplete={() => setReadyToConfirm(true)}
        />}
        {readyToConfirm && !isRead && <DiscreetButton
          title={t('common:tipDetails.iHaveRead')}
          color={colors.xp}
          onPress={() => { claimTipInformationXP(tipId); }}
        />}
        {isRead && <View style={styles.check}><XPBadge checked /></View>}
      </View>
    </AppBox>
  );
});
InformationSection.displayName = 'InformationSection';
export default InformationSection;

const styles = StyleSheet.create({
  description: { marginBottom: 8 },
  reward: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  check: { marginLeft: 'auto' },
  countdownSpace: { minHeight: 54 },
});
