import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { Checkbox } from '@/components/ui/Checkbox';
import Notice from '@/components/ui/Notice';
import { PROFILE_SHARING_FIELDS, type ProfileSharingField } from '@/types/aiSharing';

export type RequiredSharingField = 'healthPlan' | 'interests' | 'age';

interface AISharingControlsProps {
  requirePersonalDetails?: boolean;
  showRequiredErrors?: boolean;
  onRequiredFieldLayout?: (field: RequiredSharingField, y: number) => void;
}

export default function AISharingControls({
  requirePersonalDetails = false,
  showRequiredErrors = false,
  onRequiredFieldLayout,
}: Readonly<AISharingControlsProps>) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const {
    shareHealthPlan,
    setShareHealthPlan,
    shareInterests,
    setShareInterests,
    shareArchivedPlans,
    setShareArchivedPlans,
    profileSharing,
    setProfileSharing,
  } = useStorage();
  const [touched, setTouched] = React.useState<Partial<Record<RequiredSharingField, boolean>>>({});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(false);
  const save = async (action: () => void | Promise<void>) => {
    setSaving(true);
    setError(false);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const saveRequired = (field: RequiredSharingField, action: () => void | Promise<void>) => {
    const wasChecked = field === 'healthPlan' ? shareHealthPlan : field === 'interests' ? shareInterests : profileSharing?.age;
    if (wasChecked) setTouched(prev => ({ ...prev, [field]: true }));
    return save(action);
  };

  const missing = (field: RequiredSharingField) =>
    requirePersonalDetails &&
    (showRequiredErrors || touched[field]) &&
    !(field === 'healthPlan' ? shareHealthPlan : field === 'interests' ? shareInterests : profileSharing?.age);
  const optionStyle = (field?: RequiredSharingField) => [
    styles.option,
    { borderColor: field && missing(field) ? colors.error : colors.border, backgroundColor: colors.secondaryBackground },
    field && missing(field) && styles.invalidOption,
  ];
  const requiredLabel = (field: RequiredSharingField, key: string) => {
    const label = t(key);
    const divider = label.lastIndexOf(' · ');
    if (divider < 0) return label;
    return (
      <>
        {label.slice(0, divider)}
        {' · '}
        <ThemedText testID={`sharing-required-${field}`} style={missing(field) ? { color: colors.error } : undefined}>
          {label.slice(divider + 3)}
        </ThemedText>
      </>
    );
  };

  return (
    <View style={styles.content}>
      <ThemedText>{t('aiSharing.description')}</ThemedText>
      {requirePersonalDetails && <ThemedText type="explainer">{t('aiSharing.requiredForPlan')}</ThemedText>}
      <View style={optionStyle('healthPlan')} onLayout={event => onRequiredFieldLayout?.('healthPlan', event.nativeEvent.layout.y)} testID="sharing-healthPlan">
        <Checkbox
          checked={!!shareHealthPlan}
          onPress={() => saveRequired('healthPlan', () => setShareHealthPlan(!shareHealthPlan))}
          label={t('aiSharing.healthPlan')}
          labelContent={requiredLabel('healthPlan', 'aiSharing.healthPlan')}
          disabled={saving}
        />
        <ThemedText type="explainer" style={styles.details}>
          {t('aiSharing.healthPlanDescription')}
        </ThemedText>
      </View>
      <View style={optionStyle('interests')} onLayout={event => onRequiredFieldLayout?.('interests', event.nativeEvent.layout.y)} testID="sharing-interests">
        <Checkbox
          checked={!!shareInterests}
          onPress={() => saveRequired('interests', () => setShareInterests(!shareInterests))}
          label={t('aiSharing.interests')}
          labelContent={requiredLabel('interests', 'aiSharing.interests')}
          disabled={saving}
        />
        <ThemedText type="explainer" style={styles.details}>
          {t('aiSharing.interestsDescription')}
        </ThemedText>
      </View>
      <View style={[styles.option, { borderColor: colors.border, backgroundColor: colors.secondaryBackground }]}>
        <Checkbox
          checked={!!shareArchivedPlans}
          onPress={() => save(() => setShareArchivedPlans(!shareArchivedPlans))}
          label={t('aiSharing.archivedPlans')}
          disabled={saving}
        />
        <ThemedText type="explainer" style={styles.details}>
          {t('aiSharing.archivedPlansDescription')}
        </ThemedText>
      </View>
      <ThemedText type="defaultSemiBold">{t('aiSharing.personalDetails')}</ThemedText>
      {PROFILE_SHARING_FIELDS.map((field: ProfileSharingField) => (
        <View
          key={field}
          style={optionStyle(field === 'age' ? 'age' : undefined)}
          testID={`sharing-${field}`}
          onLayout={event => {
            if (field === 'age') onRequiredFieldLayout?.('age', event.nativeEvent.layout.y);
          }}
        >
          <Checkbox
            checked={profileSharing?.[field] === true}
            onPress={() => {
              const action = () => setProfileSharing({ ...profileSharing, [field]: !profileSharing?.[field] });
              return field === 'age' ? saveRequired('age', action) : save(action);
            }}
            label={t(`aiSharing.fields.${field}.label`)}
            labelContent={field === 'age' ? requiredLabel('age', `aiSharing.fields.${field}.label`) : undefined}
            disabled={saving}
          />
          <ThemedText type="explainer" style={styles.details}>
            {t(`aiSharing.fields.${field}.description`)}
          </ThemedText>
        </View>
      ))}
      {error && (
        <ThemedText type="error" accessibilityLiveRegion="polite">
          {t('aiSharing.saveError')}
        </ThemedText>
      )}
      <Notice variant="subtle" iconName="shieldCheck" title={t('aiSharing.privacyTitle')} message={`${t('aiSharing.privacyMessage')} ${t('aiSharing.changeLater')}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  invalidOption: { borderWidth: 1 },
  option: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  details: { marginLeft: 34 },
});
