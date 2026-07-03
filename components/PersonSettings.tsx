
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { getUserProfile, updateUserProfile } from '@/app/context/userProfileEvents';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import SettingsCard from '@/components/ui/SettingsCard';

import NumberStepper from './NumberStepper';
import SettingIcon from './ui/SettingIcon';
import SettingsCardLink from './ui/SettingsCardLink';

export default function PersonSettings() {
  const { t } = useTranslation('common');

  const [maxHeartRate, setMaxHeartRate] = React.useState(195);

React.useEffect(() => {
  getUserProfile().then(profile => {
    if (profile.maxHeartRate) {
      setMaxHeartRate(profile.maxHeartRate);
    }
  });
}, []);

const handleMaxHeartRateChange = async (value: number) => {
  setMaxHeartRate(value);

  await updateUserProfile({
    maxHeartRate: value,
  });
};

  return (
    <Container background="default" showBackButton>
      <View style={styles.headerRow}>
        <ThemedText type="title2">{t('settings.person.title')}</ThemedText>
      </View>

      <ThemedText type="label" style={styles.title} uppercase>
        {t('settings.person.title')}
      </ThemedText>


      <SettingsCardLink iconName='calendar' title={t('settings.person.birthday')} style={styles.cardSpacing} />


      <ThemedText type="label" style={styles.title} uppercase>
        {t('settings.person.training')}
      </ThemedText>
      <SettingsCard style={styles.cardSpacing}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <SettingIcon size={36} iconName="heart" />
            <ThemedText type="title3" style={styles.titleText}>
              {t('settings.person.maxHeartRate')}
            </ThemedText>
          </View>

          <NumberStepper
            value={maxHeartRate}
            onChange={handleMaxHeartRateChange}
            min={120}
            max={230}
          />
        </View>
      </SettingsCard>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  cardSpacing: {
    marginTop: 8,
    marginBottom: 16,
  },
  headerRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
  },
  titleText: {
    marginLeft: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
