import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import ThemedSwitch from '@/components/ui/ThemedSwitch';

import { ThemedText } from './ThemedText';
import SettingIcon from './ui/SettingIcon';

interface AISharingControlsProps {
  sharePlanText?: string;
}

export default function AISharingControls({ sharePlanText }: Readonly<AISharingControlsProps>) {
  const { t } = useTranslation('common');
  const { shareHealthPlan, setShareHealthPlan } = useStorage();

  const healthPlanEnabled = !!shareHealthPlan;

  return (
    <>
      <ThemedText type="default" style={[styles.desc]}>
        {t('aiSharing.description')}
      </ThemedText>

      <View style={styles.row}>
        <SettingIcon size={40} iconName="checklist" />
        <ThemedText type="defaultSemiBold">
          {t('aiSharing.healthPlan')}
        </ThemedText>

        <ThemedSwitch
          value={healthPlanEnabled}
          onValueChange={(value) => {
            setShareHealthPlan(value);
          }}
        />
       
      </View>
       <View style={[styles.row, styles.explainer]}>
        {sharePlanText && (
          <ThemedText type="explainer">
            {sharePlanText}
          </ThemedText>
        )}
       </View>

      <View style={styles.row}>
        <SettingIcon size={40} iconName="calendar" />
        <ThemedText type="defaultSemiBold">
          {t('aiSharing.calendar')}
        </ThemedText>
        <ThemedSwitch value={false} onValueChange={() => {}} disabled />
      </View>

      <ThemedText type="default" style={[styles.disclaimer]}>
        {t('privacy.disclaimer')}
      </ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  desc: {
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  explainer: {
    paddingTop: 0,
    marginTop: -10,
  },
  label: {
    fontSize: 14,
  },
  disclaimer: {
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
