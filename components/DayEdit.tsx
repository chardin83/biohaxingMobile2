import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { Plan } from '@/app/domain/Plan';
import { Supplement } from '@/app/domain/Supplement';
import { SupplementTime } from '@/app/domain/SupplementTime';
import { Colors } from '@/app/theme/Colors';
import { colors } from '@/app/theme/styles';

import NutritionLogger from './NutritionLogger';
import SelectedSupplementsList from './SelectedSupplementsList';
import SupplementForm from './SupplementForm';
import AppButton from './ui/AppButton';
import DropdownMenuButton from './ui/DropDownMenuButton';

interface DayeEditProps {
  selectedDate: string;
}

const DayEdit: React.FC<DayeEditProps> = ({ selectedDate }) => {
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [selectedSupplements, setSelectedSupplements] = useState<SupplementTime[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<SupplementTime | null>(null);
  const [isPlanPickerVisible, setIsPlanPickerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'supplements' | 'meal'>('supplements');
  const { plans, takenDates, setTakenDates } = useStorage();
  const { t } = useTranslation();
  const hasSupplementsToday = takenDates[selectedDate]?.length > 0;
  const hasMealsToday = useStorage().dailyNutritionSummaries[selectedDate]?.meals?.length > 0;

  useEffect(() => {
    setSelectedSupplements(takenDates[selectedDate] ?? []);
  }, [selectedDate, takenDates]);

  const saveToStorage = (supplements: SupplementTime[]) => {
    setSelectedSupplements(supplements);
    setTakenDates(prev => ({ ...prev, [selectedDate]: supplements }));
  };

  const deleteSupplement = (time: string, supplementName: string) => {
    const updatedSupplements = selectedSupplements.filter(
      item => !(item.name === supplementName && item.time === time)
    );
    saveToStorage(updatedSupplements);
  };

  const editSupplement = (time: string, supplementName: string) => {
    setSelectedTime(new Date(`${selectedDate}T${time}`));
    const isEditingSupplement = selectedSupplements.find(item => item.name === supplementName && item.time === time);
    if (isEditingSupplement) {
      setEditingSupplement(isEditingSupplement);
      setIsEditing(true);
      setIsFormVisible(true);
    }
  };

  const saveSelectedSupplement = async (supplement: Supplement) => {
    const time = selectedTime.toTimeString().slice(0, 5);
    let updatedSupplements: SupplementTime[];

    const supplementExists = selectedSupplements.some(
      existingSupplement => existingSupplement.name === supplement.name && existingSupplement.time === time
    );

    if (supplementExists && !isEditing) return;

    if (isEditing) {
      updatedSupplements = selectedSupplements.map(existingSupplement =>
        existingSupplement.name === supplement.name && existingSupplement.time === editingSupplement?.time
          ? { ...existingSupplement, ...supplement, time }
          : existingSupplement
      );
    } else {
      updatedSupplements = [...selectedSupplements, { ...supplement, time } as SupplementTime];
    }

    saveToStorage(updatedSupplements);
    setEditingSupplement(null);
    setIsEditing(false);
    setIsFormVisible(false);
  };

  const addSupplementsFromPlan = async (plan: Plan) => {
    const updatedSupplements = [...selectedSupplements];
    const time = selectedTime.toTimeString().slice(0, 5);

    plan.supplements.forEach(supplement => {
      const supplementExists = updatedSupplements.some(
        existingSupplement => existingSupplement.name === supplement.name && existingSupplement.time === time
      );

      if (!supplementExists) {
        updatedSupplements.push({ ...supplement, time } as SupplementTime);
      }
    });

    saveToStorage(updatedSupplements);
    setIsPlanPickerVisible(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabWrapper, activeTab === 'supplements' && styles.activeTabWrapper]}
            onPress={() => setActiveTab('supplements')}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tab}>TILLSKOTT</Text>
              {hasSupplementsToday && (
                <View style={[styles.badge, { backgroundColor: Colors.dark.checkmarkSupplement }]} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabWrapper, activeTab === 'meal' && styles.activeTabWrapper]}
            onPress={() => setActiveTab('meal')}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tab}>MÅLTID</Text>
              {hasMealsToday && <View style={[styles.badge, { backgroundColor: Colors.dark.checkmarkMeal }]} />}
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === 'supplements' && (
          <>
            <SelectedSupplementsList
              selectedDate={selectedDate}
              supplements={selectedSupplements}
              deleteSupplement={deleteSupplement}
              editSupplement={editSupplement}
            />
            {!isFormVisible && !isPlanPickerVisible && (
              <DropdownMenuButton
                title={t('general.add')}
                items={[
                  {
                    text: t('dayEdit.addSupplement'),
                    onSelect: () => {
                      setEditingSupplement(null);
                      setIsEditing(false);
                      setIsFormVisible(true);
                    },
                  },
                  {
                    text: t('dayEdit.addFromPlan'),
                    onSelect: () => setIsPlanPickerVisible(true),
                  },
                ]}
              />
            )}

            {(isFormVisible || isPlanPickerVisible) && (
              <>
                <Text style={styles.label}>
                  {t('dayEdit.editSupplement')} {selectedDate}:
                </Text>
                <View style={styles.timePickerContainer}>
                  <Text style={[styles.label, styles.chooseTimeLabel]}>{t('dayEdit.chooseTime')}</Text>
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, time) => time && setSelectedTime(time)}
                  />
                </View>
              </>
            )}

            {isFormVisible && (
              <SupplementForm
                key={editingSupplement?.name ?? 'new'}
                selectedTime={selectedTime}
                isEditing={isEditing}
                preselectedSupplement={editingSupplement}
                onSave={saveSelectedSupplement}
                onCancel={() => {
                  setEditingSupplement(null);
                  setIsEditing(false);
                  setIsFormVisible(false);
                }}
              />
            )}

            {isPlanPickerVisible && (
              <View style={styles.planPickerContainer}>
                <Text style={styles.modalTitle}>{t('dayEdit.choosePlan')}</Text>
                {plans.supplements.map(plan => (
                  <AppButton
                    key={plan.name}
                    title={plan.name}
                    onPress={() => addSupplementsFromPlan(plan)}
                    variant="primary"
                    style={styles.planButton}
                  />
                ))}

                <AppButton
                  title={t('general.cancel')}
                  onPress={() => setIsPlanPickerVisible(false)}
                  variant="secondary"
                  style={styles.cancelButton}
                />
              </View>
            )}
          </>
        )}

        {activeTab === 'meal' && <NutritionLogger selectedDate={selectedDate} />}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: colors.text,
  },
  chooseTimeLabel: {
    marginBottom: 5,
  },
  timePickerContainer: {
    marginVertical: 40,
  },
  planPickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  planItem: {
    padding: 15,
    marginVertical: 5,
    width: '100%',
    backgroundColor: Colors.dark.assistantBubble,
    borderRadius: 5,
  },
  planName: {
    fontSize: 16,
    color: colors.text,
  },
  planButton: {
    marginVertical: 6,
    width: '100%',
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
    borderBottomColor: Colors.dark.primary,
  },
  tabContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.dark.textWhite,
  },
  cancelButton: {
    marginTop: 20,
  },
});

export default DayEdit;
