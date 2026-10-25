import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import Container from '@/components/ui/Container';
import StepsContainer from '@/components/ui/StepsContainer';
import { useSupplements } from '@/locales/supplements';
import { getSupplementTimeIcon } from '@/utils/supplementTimeIcon';

const times = [
  { key: 'breakfast', time: '08:00' },
  { key: 'lunch', time: '12:00' },
  { key: 'dinner', time: '18:00' },
  { key: 'evening', time: '21:00' },
] as const;

export default function OnboardingSupplements() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { colors } = useTheme();
  const { setPlans, setOnboardingStep, userProfile } = useStorage();
  const supplements = useSupplements()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const [stage, setStage] = useState<'question' | 'times' | 'supplements'>('question');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  const activeTimes = times.filter(time => selectedTimes.includes(time.key));
  const active = activeTimes[index];
  const selectedIds = selected[active?.key] ?? [];
  const selectedSupplements = supplements.filter(item => selectedIds.includes(item.id));
  const query = search.trim().toLocaleLowerCase();
  const availableSupplements = supplements.filter(
    item => !selectedIds.includes(item.id) && `${item.name} ${item.description ?? ''}`.toLocaleLowerCase().includes(query)
  );
  const toggleSupplement = (id: string) => {
    if (!active) return;
    setSelected(prev => {
      const ids = prev[active.key] ?? [];
      return { ...prev, [active.key]: ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id] };
    });
  };

  const finish = (withSupplements: boolean) => {
    if (withSupplements) {
      const startedAt = new Date().toISOString();
      const plans = activeTimes.map(({ key, time }) => {
        const name = t(`onboarding.${key}`);
        return {
          name,
          prefferedTime: time,
          notify: false,
          supplements: supplements
            .filter(s => selected[key]?.includes(s.id))
            .map(supplement => ({
              supplement,
              startedAt,
              createdBy: 'onboarding',
              planName: name,
              prefferedTime: time,
              notify: false,
            })),
        };
      });
      setPlans(prev => ({ ...prev, supplements: [...prev.supplements, ...plans] }));
    }
    setOnboardingStep(4);
    router.replace('/(onboarding)/onboardingplan');
  };
  const back = () => {
    if (stage === 'question') {
      setOnboardingStep(1);
      router.replace('/(onboarding)/onboardingareas');
    } else if (stage === 'times') setStage('question');
    else if (index > 0) {
      setSearch('');
      setIndex(index - 1);
    } else setStage('times');
  };
  const title =
    stage === 'times' ? (
      <Text style={{ color: '#FFFFFF' }}>
        {t('onboarding.supplementTimesLead')} <Text style={{ color: colors.primary }}>{t('onboarding.supplementsAccent')}</Text>
      </Text>
    ) : (
      <Text style={{ color: '#FFFFFF' }}>
        {t('onboarding.selectSupplementsLead')} <Text style={{ color: colors.primary }}>{t('onboarding.supplementsWord')}</Text>
        {'\n'}
        <Text>{t('onboarding.supplementsForTime', { time: t(`onboarding.${active?.key}`) })}</Text>
      </Text>
    );

  if (stage === 'question')
    return (
      <Container
        background="gradient"
        gradientKey="sunrise"
        gradientLocations={colors.gradients?.sunrise?.locations3}
        showBackButton
        currentStep={userProfile.trackMacros ? 7 : 5}
        totalSteps={userProfile.trackMacros ? 9 : 7}
        onBackPress={back}
        contentContainerStyle={styles.container}
      >
        <View style={styles.question}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('onboarding.supplementsLead')} <Text style={{ color: colors.primary }}>{t('onboarding.supplementsAccent')}</Text>
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>{t('onboarding.supplementsDescription')}</Text>
          <View style={styles.answers}>
            <View style={styles.answer}>
              <AppButton
                title={t('onboarding.yes')}
                variant="primary"
                rightIcon="chevron.right"
                rightIconAtEdge
                onPress={() => {
                  setOnboardingStep(3);
                  setStage('times');
                }}
              />
              <Text style={[styles.answerDescription, { color: colors.text }]}>{t('onboarding.supplementsYesDescription')}</Text>
            </View>
            <View style={styles.answer}>
              <AppButton title={t('onboarding.no')} variant="secondary" rightIcon="chevron.right" rightIconAtEdge onPress={() => finish(false)} />
              <Text style={[styles.answerDescription, { color: colors.text }]}>{t('onboarding.supplementsNoDescription')}</Text>
            </View>
          </View>
        </View>
      </Container>
    );

  return (
    <StepsContainer
      title={title}
      currentStep={userProfile.trackMacros ? 8 : 6}
      totalSteps={userProfile.trackMacros ? 9 : 7}
      onBackPress={back}
      footer={
        <AppButton
          title={t('onboarding.continue')}
          disabled={stage === 'times' ? activeTimes.length === 0 : !selected[active?.key]?.length}
          onPress={() => {
            if (stage === 'times') {
              setIndex(0);
              setStage('supplements');
            } else if (index < activeTimes.length - 1) {
              setSearch('');
              setIndex(index + 1);
            } else finish(true);
          }}
        />
      }
    >
      {stage === 'times' &&
        times.map(({ key, time }) => (
          <AppCard
            key={key}
            title={t(`onboarding.${key}`)}
            iconName={getSupplementTimeIcon(time)}
            showCheckbox
            isActive={selectedTimes.includes(key)}
            onPress={() => setSelectedTimes(prev => (prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]))}
          />
        ))}
      {stage === 'supplements' && active && (
        <>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('onboarding.searchSupplements')}
            accessibilityLabel={t('onboarding.searchSupplements')}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text, backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}
            autoCorrect={false}
            returnKeyType="search"
          />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('onboarding.selectedSupplements')}</Text>
          {selectedSupplements.length === 0 && <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('onboarding.noSelectedSupplements')}</Text>}
          {selectedSupplements.map(item => (
            <AppCard key={item.id} title={item.name} description={item.description} showCheckbox isActive onPress={() => toggleSupplement(item.id)} />
          ))}
          <Text style={[styles.sectionTitle, styles.catalogTitle, { color: colors.text }]}>{t('onboarding.popularSupplements')}</Text>
          {availableSupplements.length === 0 && <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('onboarding.noMatchingSupplements')}</Text>}
          {availableSupplements.map(item => (
            <AppCard key={item.id} title={item.name} description={item.description} showCheckbox onPress={() => toggleSupplement(item.id)} />
          ))}
        </>
      )}
    </StepsContainer>
  );
}

const styles = StyleSheet.create({
  catalogTitle: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  emptyText: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  searchInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginTop: 20, marginBottom: 16 },
  container: { paddingHorizontal: 20, paddingBottom: 140 },
  question: { marginTop: 48 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#FFFFFF' },
  description: { fontSize: 16, lineHeight: 24, marginBottom: 28 },
  answers: { gap: 24 },
  answer: { gap: 8 },
  answerDescription: { fontSize: 14, lineHeight: 21, paddingHorizontal: 4 },
});
