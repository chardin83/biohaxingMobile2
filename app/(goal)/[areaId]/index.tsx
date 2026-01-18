import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native';

import BackButton from '@/components/BackButton';

import CardioOverview from './cardioOverview';
import DigestiveOverview from './digestiveOverview';
import EnergyOverview from './energyOverview';
import ImmuneOverview from './immuneOverview';
import MusclePerformanceOverview from './musclePerformanceOverview';
import NervousSystemOverview from './nervousSystemOverview';
import SleepOverview from './sleepOverview';

export default function AreaRootScreen() {
  const { areaId } = useLocalSearchParams<{ areaId: string }>();

  return (
    <LinearGradient colors={['#071526', '#040B16']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <BackButton onPress={() => router.push('/(tabs)/dashboard')} />

        {areaId === 'nervousSystem' && <NervousSystemOverview mainGoalId={areaId} />}
        {areaId === 'sleepQuality' && <SleepOverview mainGoalId={areaId} />}
        {areaId === 'energy' && <EnergyOverview mainGoalId={areaId} />}
        {areaId === 'musclePerformance' && <MusclePerformanceOverview mainGoalId={areaId} />}
        {areaId === 'cardioFitness' && <CardioOverview mainGoalId={areaId} />}
        {areaId === 'digestiveHealth' && <DigestiveOverview mainGoalId={areaId} />}
        {areaId === 'immuneSupport' && <ImmuneOverview mainGoalId={areaId} />}
      </SafeAreaView>
    </LinearGradient>
  );
}
