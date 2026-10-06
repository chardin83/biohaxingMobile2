import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { useStorage } from '@/app/context/StorageContext';
import { fromDateKey, getAge, toDateKey } from '@/utils/dateUtils';

import NumberStepper from './NumberStepper';
import { ThemedText } from './ThemedText';
import CardLinkList from './ui/CardLinkList';
import { DateTimeInput } from './ui/DateTimeInput';
import RadioButton from './ui/RadioButton';

export default function PersonalDetailsSettings({ style }: Readonly<{ style?: StyleProp<ViewStyle> }>) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const { userProfile, updateUserProfile } = useStorage();
  const [editingSex, setEditingSex] = React.useState(false);
  const [sexSaving, setSexSaving] = React.useState(false);
  const [sexError, setSexError] = React.useState(false);
  const [weight, setWeight] = React.useState(userProfile.weightKg ?? 60);
  const [editingWeight, setEditingWeight] = React.useState(false);
  const [weightError, setWeightError] = React.useState(false);
  const [height, setHeight] = React.useState(userProfile.heightCm ?? 170);
  const [editingHeight, setEditingHeight] = React.useState(false);
  const [heightError, setHeightError] = React.useState(false);
  const measurementSaveQueue = React.useRef<Promise<void>>(Promise.resolve());
  const [showBirthdayInput, setShowBirthdayInput] = React.useState(false);
  const [birthdaySaving, setBirthdaySaving] = React.useState(false);
  const [birthdayError, setBirthdayError] = React.useState(false);
  const today = new Date();
  const storedBirthday = userProfile.birthDate ? fromDateKey(userProfile.birthDate.slice(0, 10)) : null;
  const birthday = storedBirthday && Number.isFinite(storedBirthday.getTime()) && storedBirthday <= today ? storedBirthday : null;
  const displayedWeight = editingWeight ? weight : userProfile.weightKg;
  const displayedHeight = editingHeight ? height : userProfile.heightCm;

  const handleBirthdayChange = async (value: Date) => {
    if (!Number.isFinite(value.getTime()) || toDateKey(value) > toDateKey(today)) return;
    setShowBirthdayInput(true);
    setBirthdaySaving(true);
    setBirthdayError(false);
    try {
      await updateUserProfile({ birthDate: toDateKey(value) });
    } catch {
      setBirthdayError(true);
    } finally {
      setBirthdaySaving(false);
    }
  };

  const saveMeasurement = (key: 'weightKg' | 'heightCm', value: number) => {
    if (!Number.isFinite(value) || value < 0) return;
    const setError = key === 'weightKg' ? setWeightError : setHeightError;
    setError(false);
    measurementSaveQueue.current = measurementSaveQueue.current.then(async () => {
      try {
        await updateUserProfile({ [key]: value > 0 ? value : undefined });
      } catch {
        setError(true);
      }
    });
  };

  const handleWeightChange = (value: number) => {
    setWeight(value);
    saveMeasurement('weightKg', value);
  };

  const handleHeightChange = (value: number) => {
    setHeight(value);
    saveMeasurement('heightCm', value);
  };

  const handleSexChange = (value: NonNullable<UserProfile['biologicalSex']>) => {
    setSexSaving(true);
    setSexError(false);
    measurementSaveQueue.current = measurementSaveQueue.current.then(async () => {
      try {
        await updateUserProfile({ biologicalSex: value });
      } catch {
        setSexError(true);
      } finally {
        setSexSaving(false);
      }
    });
  };

  return (
    <CardLinkList
      style={style}
      rows={[
        {
          key: 'age',
          title: t(birthday ? 'privacy.person.ageTitle' : 'privacy.person.birthday'),
          iconName: 'calendar',
          value: birthday ? t('privacy.person.age', { count: getAge(birthday, today) }) : undefined,
          expanded: !birthday || showBirthdayInput,
          disabled: !birthday || birthdaySaving,
          onPress: () => setShowBirthdayInput(current => !current),
          content: (
            <View style={styles.birthdayPicker}>
              <DateTimeInput
                value={birthday ?? today}
                onChange={handleBirthdayChange}
                showDate
                showTime={false}
                buttonIcon="calendar"
                buttonLabel={birthday ? undefined : t('privacy.person.chooseBirthday')}
                dateLabel={t('privacy.person.birthday')}
                maxDate={today}
                disabled={birthdaySaving}
              />
              {birthdayError && <ThemedText type="error">{t('privacy.person.birthdaySaveError')}</ThemedText>}
            </View>
          ),
        },
        {
          key: 'weight',
          title: t('privacy.person.weight'),
          iconName: 'weight',
          value: displayedWeight ? `${displayedWeight} kg` : t('privacy.person.notSet'),
          expanded: editingWeight,
          onPress: () => {
            if (!editingWeight) setWeight(userProfile.weightKg ?? 0);
            setWeightError(false);
            setEditingWeight(current => !current);
          },
          content: (
            <View style={styles.weightEditor}>
              <View style={styles.weightInput}>
                <NumberStepper value={weight} onChange={handleWeightChange} min={0} max={500} step={1} accessibilityLabel={t('privacy.person.weight')} />
                <ThemedText>kg</ThemedText>
              </View>
              {weightError && <ThemedText type="error">{t('privacy.person.weightSaveError')}</ThemedText>}
            </View>
          ),
        },
        {
          key: 'height',
          title: t('privacy.person.height'),
          iconName: 'height',
          value: displayedHeight ? `${displayedHeight} cm` : t('privacy.person.notSet'),
          expanded: editingHeight,
          onPress: () => {
            if (!editingHeight) setHeight(userProfile.heightCm ?? 170);
            setHeightError(false);
            setEditingHeight(current => !current);
          },
          content: (
            <View style={styles.weightEditor}>
              <View style={styles.weightInput}>
                <NumberStepper value={height} onChange={handleHeightChange} min={0} max={300} step={1} accessibilityLabel={t('privacy.person.height')} />
                <ThemedText>cm</ThemedText>
              </View>
              {heightError && <ThemedText type="error">{t('privacy.person.heightSaveError')}</ThemedText>}
            </View>
          ),
        },
        {
          key: 'sex',
          title: t('privacy.person.biologicalSex'),
          iconName: 'person',
          value: userProfile.biologicalSex ? t(`privacy.person.sexOptions.${userProfile.biologicalSex}`) : t('privacy.person.notSet'),
          expanded: editingSex,
          onPress: () => setEditingSex(current => !current),
          content: (
            <View>
              {(['female', 'male', 'intersex'] as const).map((choice, index) => (
                <RadioButton
                  key={choice}
                  selected={userProfile.biologicalSex === choice}
                  disabled={sexSaving}
                  accessibilityLabel={t(`privacy.person.sexOptions.${choice}`)}
                  onPress={() => handleSexChange(choice)}
                  style={index < 2 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight } : undefined}
                >
                  <ThemedText>{t(`privacy.person.sexOptions.${choice}`)}</ThemedText>
                </RadioButton>
              ))}
              {sexError && (
                <ThemedText type="error" style={styles.weightEditor}>
                  {t('privacy.person.sexSaveError')}
                </ThemedText>
              )}
            </View>
          ),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  weightEditor: { padding: 12, gap: 8 },
  weightInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  birthdayPicker: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
});
