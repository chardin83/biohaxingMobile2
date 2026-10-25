import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import Areas from '@/components/Areas';
import NutritionActivitySettings from '@/components/NutritionActivitySettings';
import NutritionDistributionStep from '@/components/NutritionDistributionStep';
import NutritionEnergySummary from '@/components/NutritionEnergySummary';
import NutritionPersonalDetails from '@/components/NutritionPersonalDetails';
import NutritionSettings from '@/components/NutritionSettings';
import AppButton from '@/components/ui/AppButton';
import Container from '@/components/ui/Container';
import Notice from '@/components/ui/Notice';

import { useStorage } from '../context/StorageContext';

export default function OnboardingAreas() {
  const { t } = useTranslation();
  const { setOnboardingStep, updateUserProfile, onboardingStep, userProfile, myAreas } = useStorage();
  const [choosingMacros, setChoosingMacros] = useState(onboardingStep === 1);
  const [macroStep, setMacroStep] = useState(onboardingStep === 2 ? 'details' : '');
  const [wantsMacros, setWantsMacros] = useState(userProfile.trackMacros ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [areaSelectionAttempted, setAreaSelectionAttempted] = useState(false);
  const areaSelectionError = areaSelectionAttempted && myAreas.length === 0;
  const router = useRouter();
  const { colors, dark } = useTheme();

  const chooseMacros = async (trackMacros: boolean) => {
    if (saving) return;
    setSaving(true);
    setError(false);
    try {
      await updateUserProfile({ trackMacros });
      setOnboardingStep(2);
      setWantsMacros(trackMacros);
      setMacroStep('details');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const continueFromAreas = () => {
    setAreaSelectionAttempted(true);
    if (myAreas.length === 0) return;
    setOnboardingStep(1);
    setChoosingMacros(true);
  };

  const finishMacros = () => {
    setOnboardingStep(3);
    router.push('/(onboarding)/onboardingsupplements');
  };
  if (macroStep)
    return (
      <MacroGuideStep
        macroStep={macroStep}
        wantsMacros={wantsMacros}
        setMacroStep={setMacroStep}
        finishMacros={finishMacros}
        onBackToQuestion={() => {
          setMacroStep('');
          setChoosingMacros(true);
        }}
      />
    );

  return (
    <Container
      background="gradient"
      gradientKey="sunrise"
      gradientLocations={colors.gradients?.sunrise?.locations3 as any}
      showBackButton
      currentStep={choosingMacros ? 2 : 1}
      totalSteps={7}
      onBackPress={() => (choosingMacros ? setChoosingMacros(false) : router.replace('/(onboarding)/onboardingwelcome'))}
      contentContainerStyle={styles.container}
      footer={
        !choosingMacros ? (
          <View>
            {areaSelectionError && <Notice variant="error" iconName="error" message={t('onboarding.selectAtLeastOneArea')} style={styles.areaError} />}
            <AppButton title={t('onboarding.continue')} onPress={continueFromAreas} variant="primary" rightIcon="chevron.right" />
          </View>
        ) : undefined
      }
    >
      {choosingMacros ? (
        <View style={styles.macroQuestion}>
          <Text accessibilityRole="header" style={[styles.title, { color: dark ? colors.textWhite : colors.text }]}>
            {t('onboarding.trackMacrosLead')} <Text style={{ color: colors.primaryText }}>{t('common:onboarding.trackMacrosAccent')}</Text>
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>{t('onboarding.macrosDescription')}</Text>
          <View style={styles.answers}>
            <View style={styles.answer}>
              <AppButton
                title={t('onboarding.yes')}
                accessibilityLabel={`${t('onboarding.yes')}. ${t('onboarding.macrosYesDescription')}`}
                busy={saving}
                rightIcon="chevron.right"
                rightIconAtEdge
                variant="primary"
                disabled={saving}
                onPress={() => chooseMacros(true)}
              />
              <Text style={[styles.answerDescription, { color: colors.text }]}>{t('onboarding.macrosYesDescription')}</Text>
            </View>
            <View style={styles.answer}>
              <AppButton
                title={t('onboarding.no')}
                accessibilityLabel={`${t('onboarding.no')}. ${t('onboarding.macrosNoDescription')}`}
                busy={saving}
                rightIcon="chevron.right"
                rightIconAtEdge
                variant="secondary"
                disabled={saving}
                onPress={() => chooseMacros(false)}
              />
              <Text style={[styles.answerDescription, { color: colors.text }]}>{t('onboarding.macrosNoDescription')}</Text>
            </View>
          </View>
          {error && <Notice variant="error" message={t('onboarding.saveError')} />}
        </View>
      ) : (
        <Areas onboarding invalid={areaSelectionError} />
      )}
    </Container>
  );
}

function MacroGuideStep({
  macroStep,
  wantsMacros,
  setMacroStep,
  finishMacros,
  onBackToQuestion,
}: Readonly<{
  macroStep: string;
  wantsMacros: boolean;
  setMacroStep: (step: string) => void;
  finishMacros: () => void;
  onBackToQuestion: () => void;
}>) {
  const macroNavigation = { totalSteps: wantsMacros ? 9 : 7, onManual: () => setMacroStep('manual') };
  if (macroStep === 'details')
    return (
      <NutritionPersonalDetails
        {...macroNavigation}
        profileOnly={!wantsMacros}
        currentStep={3}
        onContinue={() => setMacroStep('activity')}
        onBack={() => {
          onBackToQuestion();
        }}
      />
    );
  if (macroStep === 'activity')
    return (
      <NutritionActivitySettings
        {...macroNavigation}
        currentStep={4}
        onContinue={wantsMacros ? () => setMacroStep('summary') : finishMacros}
        onBack={() => setMacroStep('details')}
      />
    );
  if (macroStep === 'summary')
    return (
      <NutritionEnergySummary {...macroNavigation} currentStep={5} onContinue={() => setMacroStep('distribution')} onBack={() => setMacroStep('activity')} />
    );
  if (macroStep === 'distribution')
    return <NutritionDistributionStep {...macroNavigation} currentStep={6} onContinue={finishMacros} onBack={() => setMacroStep('summary')} />;
  if (macroStep === 'manual')
    return (
      <NutritionSettings
        initiallyEditing
        continueOnSave
        currentStep={6}
        totalSteps={9}
        onBack={() => setMacroStep('details')}
        onSaved={finishMacros}
        saveProfileUpdates={{ nutritionGuideCompleted: true }}
      />
    );

  return null;
}

const styles = StyleSheet.create({
  areaError: { marginTop: 0, marginBottom: 12 },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  macroQuestion: {
    marginTop: 48,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  answers: {
    gap: 24,
  },
  answer: {
    gap: 8,
  },
  answerDescription: {
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
