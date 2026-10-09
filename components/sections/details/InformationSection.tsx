import { useIsFocused } from '@react-navigation/native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, useWindowDimensions,View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import AppBox from '@/components/ui/AppBox';
import ReadConfirmation from '@/components/ui/ReadConfirmation';

export type InformationSectionRef = { checkVisibility: () => void };
type Props = Readonly<{ tipId: string; descriptionKey: string }>;

const InformationSection = forwardRef<InformationSectionRef, Props>(({ tipId, descriptionKey }, ref) => {
  const { t } = useTranslation();
  const { viewedTips, claimTipReadingXP } = useStorage();
  const isRead = viewedTips.find(view => view.tipId === tipId)?.informationRead === true;
  const footerRef = useRef<View>(null);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [visible, setVisible] = useState(false);

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
      <View ref={footerRef} collapsable={false} onLayout={checkVisibility}>
        <ReadConfirmation read={isRead} active={visible && focused && active} onConfirm={() => { claimTipReadingXP(tipId, 'information'); }} />
      </View>
    </AppBox>
  );
});
InformationSection.displayName = 'InformationSection';
export default InformationSection;

const styles = StyleSheet.create({
  description: { marginBottom: 8 },
});
