import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, usePathname,useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

// Removed SafeAreaView import
import BackButton from '@/components/BackButton';
import { Colors } from '@/constants/Colors';

import CardioOverview from './cardioOverview';
import DigestiveOverview from './digestiveOverview';
import EnergyOverview from './energyOverview';
import ImmuneOverview from './immuneOverview';
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
    <LinearGradient
      colors={Colors.dark.gradients.sunrise.colors as any}
      locations={Colors.dark.gradients.sunrise.locations as any}
      start={Colors.dark.gradients.sunrise.start}
      end={Colors.dark.gradients.sunrise.end}
      style={styles.gradient}
    >
      <BackButton onPress={() => router.push({ pathname: '/dashboard' })} />
      {areaId === 'nervousSystem' && <NervousSystemOverview mainGoalId={areaId} />}
      {areaId === 'sleepQuality' && <SleepOverview mainGoalId={areaId} />}
      {areaId === 'energy' && <EnergyOverview mainGoalId={areaId} />}
      {areaId === 'strength' && <StrengthOverview mainGoalId={areaId} />}
      {areaId === 'cardioFitness' && <CardioOverview mainGoalId={areaId} />}
      {areaId === 'digestiveHealth' && <DigestiveOverview mainGoalId={areaId} />}
      {areaId === 'immuneSupport' && <ImmuneOverview mainGoalId={areaId} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    minHeight: 300,
  },
});
