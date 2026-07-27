import { useNavigationState , useTheme } from '@react-navigation/native';
import { router, useLocalSearchParams, usePathname, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { Colors } from '@/app/theme/Colors';
import Container from '@/components/ui/Container';

import CardioOverview from './cardioOverview';
import DigestiveOverview from './digestiveOverview';
import EnergyOverview from './energyOverview';
import ImmuneOverview from './immuneOverview';
import LongevityOverview from './longevityOverview';
import MindOverview from './mindOverview';
import NervousSystemOverview from './nervousSystemOverview';
import PhilosophyOverview from './philosophyOverview';
import SleepOverview from './sleepOverview';
import StrengthOverview from './strengthOverview';

export default function AreaRootScreen() {
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  const { dark } = useTheme();
  const themeGradients = dark ? Colors.dark.gradients : Colors.light.gradients;

  return (
    <Container background="gradient" gradientLocations={themeGradients.sunrise.locations2 as any} onBackPress={() => router.back()} showBackButton>
      {areaId === 'nervousSystem' && <NervousSystemOverview mainGoalId={areaId} />}
      {areaId === 'sleepQuality' && <SleepOverview mainGoalId={areaId} />}
      {areaId === 'energy' && <EnergyOverview mainGoalId={areaId} />}
      {areaId === 'strength' && <StrengthOverview mainGoalId={areaId} />}
      {areaId === 'cardioFitness' && <CardioOverview mainGoalId={areaId} />}
      {areaId === 'digestiveHealth' && <DigestiveOverview mainGoalId={areaId} />}
      {areaId === 'immuneSupport' && <ImmuneOverview mainGoalId={areaId} />}
      {areaId === 'mind' && <MindOverview mainGoalId={areaId} />}
      {areaId === 'philosophy' && <PhilosophyOverview mainGoalId={areaId} />}
      {areaId === 'longevity' && <LongevityOverview mainGoalId={areaId} />}
    </Container>
  );
}
