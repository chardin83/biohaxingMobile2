import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ScrollView, StyleSheet } from 'react-native';

import { useSession } from '@/app/context/SessionStorage';
import { useStorage } from '@/app/context/StorageContext';
import AISharingControls, { type RequiredSharingField } from '@/components/AISharingControls';
import { ThemedText } from '@/components/ThemedText';

import { ThemedModal } from './ThemedModal';

interface AIInfoPopupProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  onConfirm?: () => void;
  requirePersonalDetails?: boolean;
  busy?: boolean;
  autoOpen?: boolean;
}

const AIInfoPopup: React.FC<AIInfoPopupProps> = ({ visible, setVisible, requirePersonalDetails = false, busy = false, autoOpen = true, onConfirm }) => {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Partial<Record<RequiredSharingField, number>>>({});
  const scrollFrame = useRef<number | null>(null);
  const [showRequiredErrors, setShowRequiredErrors] = useState(false);
  const { hasVisitedChat, setHasVisitedChat, shareHealthPlan, shareInterests, profileSharing } = useStorage();
  const { forceOpenPopup, setForceOpenPopup } = useSession();

  useEffect(() => {
    if (autoOpen && forceOpenPopup) {
      setVisible(true);
      setForceOpenPopup(false);
    }
  }, [autoOpen, forceOpenPopup, setForceOpenPopup, setVisible]);

  useEffect(() => {
    if (autoOpen && !hasVisitedChat) {
      setVisible(true);
      setHasVisitedChat(true);
    }
  }, [autoOpen, hasVisitedChat, setHasVisitedChat, setVisible]);

  useEffect(() => {
    if (!visible) setShowRequiredErrors(false);
  }, [visible]);
  useEffect(
    () => () => {
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    },
    []
  );

  const close = () => {
    setShowRequiredErrors(false);
    setVisible(false);
  };
  const confirm = () => {
    if (busy) return;
    const firstMissing: RequiredSharingField | undefined = !shareHealthPlan
      ? 'healthPlan'
      : !shareInterests
        ? 'interests'
        : !profileSharing?.age
          ? 'age'
          : undefined;
    if (requirePersonalDetails && firstMissing) {
      setShowRequiredErrors(true);
      AccessibilityInfo.announceForAccessibility(t('aiSharing.requiredForPlan'));
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, (positions.current[firstMissing] ?? 0) - 12), animated: true });
        scrollFrame.current = null;
      });
      return;
    }
    onConfirm?.();
    close();
  };
  return (
    <ThemedModal
      visible={visible}
      title={
        <>
          {t('aiSharing.titleLead')}{' '}
          <ThemedText type="title2" style={{ color: colors.primary }}>
            {t('aiSharing.titleAccent')}
          </ThemedText>
        </>
      }
      titleColor={colors.text}
      onClose={close}
      onSave={confirm}
      onSaveDisabled={busy}
      okLabel={t(onConfirm ? 'createPlan.createAIPlan' : 'aiSharing.confirm')}
      showCancelButton
    >
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content}>
        <AISharingControls
          requirePersonalDetails={requirePersonalDetails}
          showRequiredErrors={showRequiredErrors}
          onRequiredFieldLayout={(field, y) => {
            positions.current[field] = y;
          }}
        />
      </ScrollView>
    </ThemedModal>
  );
};
export default AIInfoPopup;
const styles = StyleSheet.create({ scroll: { flexShrink: 1, width: '100%' }, content: { paddingBottom: 16 } });
