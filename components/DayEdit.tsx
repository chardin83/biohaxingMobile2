import { useTheme } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';

import NutritionLogger from './NutritionLogger';
import { SupplementsTabSection } from './SupplementsTabSection';
import { ThemedText } from './ThemedText';

interface DayeEditProps {
  selectedDate: string;
  onTipCompleted?: (targetY?: number) => void;
  initialTab?: 'supplements' | 'meal';
  preselectedSupplementId?: string;
}

const DayEdit: React.FC<DayeEditProps> = ({
  selectedDate,
  onTipCompleted,
  initialTab,
  preselectedSupplementId,
}) => {

  const [activeTab, setActiveTab] = useState<'supplements' | 'meal'>(initialTab ?? 'meal');
  const {takenDates } = useStorage();
  const { t } = useTranslation();
  const hasSupplementsToday = takenDates[selectedDate]?.length > 0;
  const hasMealsToday = useStorage().dailyNutritionSummaries[selectedDate]?.meals?.length > 0;
  const mealLoggerOffsetYRef = useRef(0);

  const { colors } = useTheme();

  const handleNutritionTipCompleted = useCallback((nutritionLoggerY?: number) => {
    if (typeof nutritionLoggerY === 'number') {
      onTipCompleted?.(mealLoggerOffsetYRef.current + nutritionLoggerY);
      return;
    }
    onTipCompleted?.();
  }, [onTipCompleted]);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabWrapper,
              activeTab === 'meal' && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveTab('meal')}
          >
            <View style={styles.tabContent}>
              <ThemedText
                type="title3"
                uppercase
                style={{ color: activeTab === 'meal' ? colors.text : colors.textTertiary }}
              >
                {t('dayEdit.tabMeal')}
              </ThemedText>
              {hasMealsToday && <View style={[styles.badge, { backgroundColor: colors.checkmarkMeal }]} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabWrapper,
              activeTab === 'supplements' && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveTab('supplements')}
          >
            <View style={styles.tabContent}>
              <ThemedText
                type="title3"
                uppercase
                style={{ color: activeTab === 'supplements' ? colors.text : colors.textTertiary }}
              >
                {t('dayEdit.tabSupplements')}
              </ThemedText>
              {hasSupplementsToday && (
                <View style={[styles.badge, { backgroundColor: colors.checkmarkSupplement }]} />
              )}
            </View>
          </TouchableOpacity>


        </View>

        {activeTab === 'supplements' && (
          <SupplementsTabSection
            selectedDate={selectedDate}
            preselectedSupplementId={preselectedSupplementId}
          />
        )}

        {activeTab === 'meal' && (
          <View
            onLayout={event => {
              mealLoggerOffsetYRef.current = event.nativeEvent.layout.y;
            }}
          >
            <NutritionLogger selectedDate={selectedDate} onTipCompleted={handleNutritionTipCompleted} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 2,
  },
  label: {
    marginBottom: 10,
  },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tabWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabWrapper: {
  },
  tabContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cancelButton: {
    marginTop: 20,
  },
});

export default DayEdit;
