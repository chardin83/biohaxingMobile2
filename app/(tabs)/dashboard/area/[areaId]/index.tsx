
import { router, useLocalSearchParams, usePathname, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { Colors } from '@/app/theme/Colors';
import Container from '@/components/ui/Container';

import CardioOverview from './cardioOverview';
import DigestiveOverview from './digestiveOverview';
import EnergyOverview from './energyOverview';
import ImmuneOverview from './immuneOverview';
import MindOverview from './mindOverview';
import NervousSystemOverview from './nervousSystemOverview';
import SleepOverview from './sleepOverview';
import StrengthOverview from './strengthOverview';

export default function AreaRootScreen() {
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  const segments = useSegments();
  const pathname = usePathname?.() ?? '';

  useEffect(() => {
    console.log('route segments:', segments);
    console.log('pathname:', pathname);
    console.log('areaId:', areaId);
  }, [segments, pathname, areaId]);

  return (
    <Container background="gradient" gradientLocations={Colors.dark.gradients.sunrise.locations2 as any} onBackPress={() => router.push({ pathname: '/dashboard' })} showBackButton>
      {areaId === 'nervousSystem' && <NervousSystemOverview mainGoalId={areaId} />}
      {areaId === 'sleepQuality' && <SleepOverview mainGoalId={areaId} />}
      {areaId === 'energy' && <EnergyOverview mainGoalId={areaId} />}
      {areaId === 'strength' && <StrengthOverview mainGoalId={areaId} />}
      {areaId === 'cardioFitness' && <CardioOverview mainGoalId={areaId} />}
      {areaId === 'digestiveHealth' && <DigestiveOverview mainGoalId={areaId} />}
      {areaId === 'immuneSupport' && <ImmuneOverview mainGoalId={areaId} />}
      {areaId === 'mind' && <MindOverview mainGoalId={areaId} />}
    </Container>
  );
}
