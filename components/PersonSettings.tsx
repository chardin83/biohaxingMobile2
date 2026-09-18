import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import SettingsCard from '@/components/ui/SettingsCard';
import { ClockTime } from '@/types/ClockTime';
import { formatClockTime } from '@/utils/dateUtils';

import NumberStepper from './NumberStepper';
import { DateTimeInput } from './ui/DateTimeInput';
import SettingIcon from './ui/SettingIcon';
import SettingsCardLink from './ui/SettingsCardLink';

const DEFAULT_BEDTIME: ClockTime = '23:00';
const RECOMMENDED_BEDTIME_START: ClockTime = '22:00';
const RECOMMENDED_BEDTIME_END: ClockTime = '23:00';

function timeStringToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function dateToClockTime(date: Date): ClockTime {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` as ClockTime;
}

export default function PersonSettings() {
  const { t, i18n } = useTranslation('common');
  const { colors } = useTheme();
  const { userProfile, updateUserProfile } = useStorage();
  const [maxHeartRate, setMaxHeartRate] = React.useState(195);
  const [bedtime, setBedtime] = React.useState<Date>(() => timeStringToDate(DEFAULT_BEDTIME));

  const recommendedBedtimeStart = formatClockTime(timeStringToDate(RECOMMENDED_BEDTIME_START), i18n.language);

  const recommendedBedtimeEnd = formatClockTime(timeStringToDate(RECOMMENDED_BEDTIME_END), i18n.language);

  React.useEffect(() => {
    if (userProfile.maxHeartRate) {
      setMaxHeartRate(userProfile.maxHeartRate);
    }
  }, [userProfile.maxHeartRate]);

  React.useEffect(() => {
    if (userProfile.bedtime) {
      setBedtime(timeStringToDate(userProfile.bedtime));
    }
  }, [userProfile.bedtime]);

  const handleMaxHeartRateChange = async (value: number) => {
    setMaxHeartRate(value);
    await updateUserProfile({
      maxHeartRate: value,
    });
  };

  const handleBedtimeChange = async (value: Date) => {
    setBedtime(value);
    await updateUserProfile({
      bedtime: dateToClockTime(value),
    });
  };

  return (
    <Container background="default" showBackButton>
      <View style={styles.headerRow}>
        <ThemedText type="title2">{t('privacy.person.title')}</ThemedText>
      </View>
      <ThemedText type="label" style={styles.title} uppercase>
        {t('privacy.person.title')}
      </ThemedText>
      <SettingsCardLink iconName="calendar" title={t('privacy.person.birthday')} style={styles.cardSpacing} />
      <ThemedText type="label" style={styles.title} uppercase>
        {t('privacy.person.sleep')}
      </ThemedText>
      <SettingsCard style={styles.cardSpacing}>
        <View style={styles.bedtimeRow}>
          <View style={styles.labelContainer}>
            <SettingIcon size={36} iconName="moon" />
            <View style={styles.titleText}>
              <ThemedText type="title3">{t('privacy.person.bedtime')}</ThemedText>
              <ThemedText type="caption">{t('privacy.person.bedtimeDescription')}</ThemedText>
            </View>
          </View>
          <DateTimeInput value={bedtime} onChange={handleBedtimeChange} showTime buttonIcon="clock" />
        </View>
        <View style={styles.recommendedRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: colors.metricStatus.optimal,
              },
            ]}
          />
          <ThemedText type="caption">{t('privacy.person.recommendedBedtime')}</ThemedText>
          <ThemedText type="caption" style={{ color: colors.metricStatus.optimal }}>
            {recommendedBedtimeStart}–{recommendedBedtimeEnd}
          </ThemedText>
        </View>
      </SettingsCard>
      <ThemedText type="label" style={styles.title} uppercase>
        {t('privacy.person.training')}
      </ThemedText>
      <SettingsCard style={styles.cardSpacing}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <SettingIcon size={36} iconName="heart" />
            <ThemedText type="title3" style={styles.titleText}>
              {t('privacy.person.maxHeartRate')}
            </ThemedText>
          </View>
          <NumberStepper value={maxHeartRate} onChange={handleMaxHeartRateChange} min={120} max={230} />
        </View>
      </SettingsCard>
    </Container>
  );
}

const styles = StyleSheet.create({
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
  bedtimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleText: {
    marginLeft: 12,
    flexShrink: 1,
  },
  recommendedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 60,
    paddingRight: 12,
    paddingBottom: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
