import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

// Removed SafeAreaView import
import BackButton from '@/components/BackButton';
import { Colors } from '@/constants/Colors';

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
    <LinearGradient colors={Colors.dark.gradients.sunrise.colors as any} style={styles.container}>
      <BackButton onPress={() => router.push('/(tabs)/dashboard')} />
      {areaId === 'nervousSystem' && <NervousSystemOverview mainGoalId={areaId} />}
      {areaId === 'sleepQuality' && <SleepOverview mainGoalId={areaId} />}
      {areaId === 'energy' && <EnergyOverview mainGoalId={areaId} />}
      {areaId === 'musclePerformance' && <MusclePerformanceOverview mainGoalId={areaId} />}
      {areaId === 'cardioFitness' && <CardioOverview mainGoalId={areaId} />}
      {areaId === 'digestiveHealth' && <DigestiveOverview mainGoalId={areaId} />}
      {areaId === 'immuneSupport' && <ImmuneOverview mainGoalId={areaId} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Removed safeArea style
});
