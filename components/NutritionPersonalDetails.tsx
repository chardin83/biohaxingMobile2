import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import AppButton from '@/components/ui/AppButton';
import DiscreetButton from '@/components/ui/DiscreetButton';
import Notice from '@/components/ui/Notice';
import StepsContainer from '@/components/ui/StepsContainer';
import { fromDateKey, getAge } from '@/utils/dateUtils';

import HenryInfoNotice from './HenryInfoNotice';
import type { NutritionStepNavigation } from './nutritionStepNavigation';
import PersonalDetailsSettings from './PersonalDetailsSettings';

export default function NutritionPersonalDetails({
  currentStep = 1,
  totalSteps = 4,
  onContinue,
  onBack,
  onManual,
  profileOnly = false,
}: NutritionStepNavigation & { profileOnly?: boolean } = {}) {
  const { t } = useTranslation('common');
  const { userProfile } = useStorage();
  const [submitted, setSubmitted] = useState(false);
  const required = t('labeledInput.requiredError');
  const today = new Date();
  const birthday = userProfile.birthDate ? fromDateKey(userProfile.birthDate.slice(0, 10)) : null;
  const validBirthday = birthday && Number.isFinite(birthday.getTime()) && birthday <= today;
  let ageError: string | undefined;
  if (!validBirthday) ageError = required;
  else if (getAge(birthday, today) < 18) ageError = t('nutritionGoals.adultRequired');
  const errors = {
    age: ageError,
    weight: !Number.isFinite(userProfile.weightKg) || !userProfile.weightKg || userProfile.weightKg <= 0 ? required : undefined,
    height: !Number.isFinite(userProfile.heightCm) || !userProfile.heightCm || userProfile.heightCm <= 0 ? required : undefined,
    sex: !userProfile.biologicalSex ? required : undefined,
  };
  const relevantErrors = profileOnly ? { age: errors.age } : errors;
  const fieldLabels = {
    age: t('privacy.person.birthday'),
    weight: t('privacy.person.weight'),
    height: t('privacy.person.height'),
    sex: t('privacy.person.biologicalSex'),
  };
  const validationMessage = Object.entries(relevantErrors)
    .filter(([, message]) => Boolean(message))
    .map(([field, message]) => `${fieldLabels[field as keyof typeof fieldLabels]}: ${message}`)
    .join('. ');
  const unsupportedSex = userProfile.biologicalSex === 'intersex';
  const continueGuide = () => {
    setSubmitted(true);
    if (profileOnly ? errors.age : Object.values(errors).some(Boolean)) {
      AccessibilityInfo.announceForAccessibility(validationMessage);
      return;
    }
    if (onContinue) onContinue();
    else router.push('/settings/nutrition-activity');
  };

  return (
    <StepsContainer
      title={t(profileOnly ? 'onboarding.profileTitle' : 'nutritionTargetSection.title')}
      subtitle={t(profileOnly ? 'onboarding.profileDescription' : 'nutritionGoals.personalDetailsTitle')}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBackPress={onBack}
      footer={<AppButton title={t('onboarding.continue')} variant="primary" rightIcon="chevron.right" onPress={continueGuide} />}
    >
      <PersonalDetailsSettings ageOnly={profileOnly} errors={submitted ? (profileOnly ? { age: errors.age } : errors) : undefined} />
      {!profileOnly && submitted && unsupportedSex && (
        <Notice title={t('nutritionGoals.summary.unsupportedSexTitle')} message={t('nutritionGoals.summary.unsupportedSex')} />
      )}
      {!profileOnly && <HenryInfoNotice />}
      {!profileOnly && (
        <View style={styles.manualContainer}>
          <DiscreetButton
            title={t('nutritionGoals.manualTitle')}
            explainer={t('nutritionGoals.manualDescription')}
            icon="pencil"
            rightIcon="chevron.right"
            onPress={() => {
              if (onManual) {
                setSubmitted(true);
                if (!errors.age && !errors.sex) onManual();
              } else router.push('/settings/nutrition-manual');
            }}
          />
        </View>
      )}
    </StepsContainer>
  );
}

const styles = StyleSheet.create({
  manualContainer: { marginTop: 20, marginBottom: 40 },
});
