import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { EnergyProductionCharts } from '@/components/metrics/EnergyProductionCharts';
import { TodaysActivityCharts } from '@/components/metrics/TodaysActivityCharts';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import GenesListCard from '@/components/ui/GenesListCard';
import MicrobiomeListCard from '@/components/ui/MicrobiomeListCard';
import TipsList from '@/components/ui/TipsList';
import { WearableStatus } from '@/components/WearableStatus';

export default function EnergyScreen({ mainGoalId }: Readonly<{ mainGoalId: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <ThemedText type="title" style={{ color: colors.area.energy }}>
        {t('energyOverview.title')}
      </ThemedText>
      <ThemedText type="subtitle">{t('energyOverview.description')}</ThemedText>
      <WearableStatus />

      {/* Energy Production Factors */}
      <EnergyProductionCharts />

      {/* Activity Tracking */}
      <TodaysActivityCharts />

      {/* Mitochondrial Health Information */}
      <Card title={t('energyOverview.mitochondrialHealth.title')}>
        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🔬 {t('energyOverview.mitochondrialHealth.powerhouses.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.powerhouses.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⚡ {t('energyOverview.mitochondrialHealth.atpProduction.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.atpProduction.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🧬 {t('energyOverview.mitochondrialHealth.mitochondrialBiogenesis.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.mitochondrialBiogenesis.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🛡️ {t('energyOverview.mitochondrialHealth.oxidativeStress.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.oxidativeStress.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⏰ {t('energyOverview.mitochondrialHealth.nadDecline.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.nadDecline.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🔄 {t('energyOverview.mitochondrialHealth.mitophagy.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.mitophagy.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🍬 {t('energyOverview.mitochondrialHealth.insulinResistance.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.insulinResistance.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">⚠️ {t('energyOverview.mitochondrialHealth.chronicStress.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.chronicStress.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🔄 {t('energyOverview.mitochondrialHealth.metabolicFlexibility.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.metabolicFlexibility.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🌾 {t('energyOverview.mitochondrialHealth.resistantStarch.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.resistantStarch.description')}</ThemedText>
        </View>

        <View style={globalStyles.infoSection}>
          <ThemedText type="title3">🏃 {t('energyOverview.mitochondrialHealth.lowCarbHighIntensityTraining.title')}</ThemedText>
          <ThemedText type="default">{t('energyOverview.mitochondrialHealth.lowCarbHighIntensityTraining.description')}</ThemedText>
        </View>
      </Card>

      {/* Body Battery - Main Energy Indicator */}
      {/* B<Card title={t('energyOverview.cellularEnergyReserves.title')}>
        <View style={styles.centerMetric}>
          <ThemedText type="title2">{energy.bodyBattery ?? '—'}</ThemedText>
          <ThemedText type="label">{t('energyOverview.cellularEnergyReserves.bodyBattery')}</ThemedText>
          <ThemedText type="caption">
            {energy.bodyBatteryChange == null ? '—' : `${energy.bodyBatteryChange} ${t('energyOverview.cellularEnergyReserves.sinceWaking')}`}
          </ThemedText>
        </View>
        <View style={[styles.batteryBar, { backgroundColor: colors.overlayLight }]}>
          <View
            style={[
              styles.batteryFill,
              {
                width: `${Math.max(0, energy.bodyBattery ?? 0)}%`,
                backgroundColor: colors.goldSoft,
              }
            ]}
          />
        </View>
        <ThemedText type="explainer" >
          {t('energyOverview.cellularEnergyReserves.explainer')}
        </ThemedText>
      </Card>*/}

      {/* DNA & Mitochondria Genetics */}
      <GenesListCard areaId="energy" />

      <MicrobiomeListCard areaId="energy" />

      {/* Tips Card */}
      <TipsList areaId={mainGoalId} />
    </>
  );
}
