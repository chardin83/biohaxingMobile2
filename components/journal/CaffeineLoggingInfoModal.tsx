import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { getCaffeineLoggingInfoSeen, saveCaffeineLoggingInfoSeen } from '@/app/context/storage/app/appStorage';
import { useStorage } from '@/app/context/StorageContext';
import { ThemedModal } from '@/components/ThemedModal';
import { ThemedText } from '@/components/ThemedText';
import DiscreetButton from '@/components/ui/DiscreetButton';
import { DEFAULT_BEDTIME } from '@/utils/sleepTimeUtils';

export default function CaffeineLoggingInfoModal({ requestKey }: Readonly<{ requestKey: number }>) {
  const { t } = useTranslation('journal');
  const router = useRouter();
  const { userProfile } = useStorage();
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (!requestKey) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    getCaffeineLoggingInfoSeen()
      .then(seen => {
        if (seen || cancelled) return;
        // Let the drink sheet or analysis review finish closing first.
        timer = setTimeout(() => setVisible(true), 350);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [requestKey]);

  const acknowledge = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      await saveCaffeineLoggingInfoSeen();
      setVisible(false);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedModal
      visible={visible}
      title={t('caffeineLoggingInfo.title')}
      iconName="book"
      iconColor="#afa2ff"
      showCancelButton={false}
      onClose={() => setVisible(false)}
      onSave={acknowledge}
      onSaveDisabled={saving}
      okLabel={t('caffeineLoggingInfo.understood')}
    >
      <View style={styles.content}>
        <ThemedText>{t('caffeineLoggingInfo.description')}</ThemedText>
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">{t('common:lifeStyle.items.caffeine')}</ThemedText>
          <ThemedText type="caption">{t('caffeineLoggingInfo.caffeine')}</ThemedText>
        </View>
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">{t('common:lifeStyle.items.caffeineBeforeSleep')}</ThemedText>
          <ThemedText type="caption">{t('caffeineLoggingInfo.beforeSleep', { bedtime: userProfile.bedtime ?? DEFAULT_BEDTIME })}</ThemedText>
        </View>
        <ThemedText type="caption">{t('caffeineLoggingInfo.updates')}</ThemedText>
        <View style={styles.link}>
          <View style={styles.bedtimeDetails}>
            <ThemedText type="caption">{t('common:privacy.person.bedtime')}</ThemedText>
            <ThemedText type="defaultSemiBold">{userProfile.bedtime ?? DEFAULT_BEDTIME}</ThemedText>
          </View>
          <DiscreetButton
            title={t('caffeineLoggingInfo.changeBedtime')}
            accessibilityRole="link"
            icon="clock"
            rightIcon="chevron.right"
            disabled={saving}
            onPress={() => {
              setVisible(false);
              router.push({ pathname: '/(stack)/settings/person', params: { focus: 'bedtime' } });
            }}
          />
        </View>
        {saveError && <ThemedText type="error">{t('caffeineLoggingInfo.saveError')}</ThemedText>}
      </View>
    </ThemedModal>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', gap: 14 },
  section: { gap: 4, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(175, 162, 255, 0.2)', backgroundColor: 'rgba(175, 162, 255, 0.06)' },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  bedtimeDetails: { gap: 2 },
});
