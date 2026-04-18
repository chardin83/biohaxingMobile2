import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { Supplement } from '@/app/domain/Supplement';
import { SupplementTime } from '@/app/domain/SupplementTime';

import PlanSupplementsPicker from './PlanSupplementsPicker';
import SelectedSupplementsList from './SelectedSupplementsList';
import SupplementForm from './SupplementForm';
import { ThemedText } from './ThemedText';
import TimePickerSection from './TimePickerSection';
import AppButton from './ui/AppButton';
import { CancelButton } from './ui/CancelButton';
import DiscreetButton from './ui/DiscreetButton';

interface Props {
    selectedDate: string;
}

export const SupplementsTabSection = ({ selectedDate }: Props) => {
    const { plans, takenDates, setTakenDates } = useStorage();
    const { t } = useTranslation();
    const { colors } = useTheme();

    const [selectedTime, setSelectedTime] = useState<Date>(new Date());
    const [selectedSupplements, setSelectedSupplements] = useState<SupplementTime[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingSupplement, setEditingSupplement] = useState<SupplementTime | null>(null);
    const [isAddButtonVisible, setIsAddButtonVisible] = useState(true);
    const [isSupplementFormVisible, setIsSupplementFormVisible] = useState(false);
    const [isPlanPickerVisible, setIsPlanPickerVisible] = useState(false);
    const [planSupplementsToPick, setPlanSupplementsToPick] = useState<Supplement[] | null>(null);
    const [planName, setPlanName] = useState<string>('');

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
            setIsSupplementFormVisible(true);
            setIsAddButtonVisible(false);
        }
    };

    const saveSelectedSupplement = async (supplement: SupplementTime) => {
        const time = selectedTime.toTimeString().slice(0, 5);
        let updatedSupplements;
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
            updatedSupplements = [...selectedSupplements, { ...supplement, time }];
        }
        saveToStorage(updatedSupplements);
        setEditingSupplement(null);
        setIsEditing(false);
        setIsSupplementFormVisible(false);
    };

    return (
        <>

            {isAddButtonVisible && (
                <AppButton
                    title={" + " + t('general.add')}
                    onPress={() => {
                        setIsPlanPickerVisible(true);
                        setIsAddButtonVisible(false);
                    }}
                />
            )}
            {isPlanPickerVisible && (
                <View style={styles.planPickerContainer}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{t('dayEdit.choosePlan')}</Text>
                    <View style={styles.addManuallyTextContainer}>
                        <DiscreetButton
                            title={" + " + t('supplementTabSection.addManually')}
                            onPress={() => { setIsSupplementFormVisible(true); setEditingSupplement(null); setIsPlanPickerVisible(false); }}
                            larger
                        />
                    </View>

                    <ThemedText type="label">{t('dayEdit.addFromPlan')}</ThemedText>
                    {plans.supplements.map((plan) => {
                        const isDisabled = !plan.supplements || plan.supplements.length === 0;
                        return (
                            <AppButton
                                key={plan.name}
                                title={plan.name}
                                onPress={() => {
                                    setSelectedTime(new Date(`${selectedDate}T${plan.prefferedTime}`));
                                    setPlanSupplementsToPick(
                                        plan.supplements.map((entry) => entry.supplement)
                                    );
                                    setIsPlanPickerVisible(false);
                                    setPlanName(plan.name);
                                }}
                                variant="primary"
                                style={styles.planButton}
                                disabled={isDisabled}
                                accessibilityLabel={plan.name}
                                disabledText={isDisabled ? t('plan.noSupplementsInPlan', { plan: plan.name.toLowerCase() }) : undefined}
                            />
                        );
                    })}
                    <CancelButton
                        onPress={() => {
                            setIsPlanPickerVisible(false);
                            setIsAddButtonVisible(true);
                        }}
                    />
                </View>
            )}
            {planSupplementsToPick && (
                <PlanSupplementsPicker
                    supplements={planSupplementsToPick}
                    planName={planName}
                    selectedTime={selectedTime}
                    setSelectedTime={setSelectedTime}
                    onCancel={() => { setPlanSupplementsToPick(null); setIsAddButtonVisible(true); }}
                    onConfirm={(selectedSupps: Supplement[], time: Date) => {
                        const updatedSupplements = [...selectedSupplements];
                        selectedSupps.forEach(supplement => {
                            const exists = updatedSupplements.some(
                                s => s.name === supplement.name && s.time === time.toTimeString().slice(0, 5)
                            );
                            if (!exists) {
                                updatedSupplements.push({
                                    ...supplement,
                                    time: time.toTimeString().slice(0, 5),
                                });
                            }
                        });
                        saveToStorage(updatedSupplements);
                        setPlanSupplementsToPick(null);
                        setIsPlanPickerVisible(false);
                        setIsAddButtonVisible(true);
                    }}
                />
            )}
            {isSupplementFormVisible && (
                <>
                    <TimePickerSection
                        selectedTime={selectedTime}
                        setSelectedTime={setSelectedTime}
                    />
                    <SupplementForm
                        key={editingSupplement?.name ?? 'new'}
                        selectedTime={selectedTime}
                        isEditing={isEditing}
                        preselectedSupplement={editingSupplement}
                        onSave={supplement => {
                            // Convert Supplement to SupplementTime
                            const time = selectedTime.toTimeString().slice(0, 5);
                            saveSelectedSupplement({ ...supplement, time });
                            setIsSupplementFormVisible(false);
                            setIsAddButtonVisible(true);
                        }}
                        onCancel={() => {
                            setEditingSupplement(null);
                            setIsEditing(false);
                            setIsSupplementFormVisible(false);
                            setIsAddButtonVisible(true);
                        }}
                    />
                </>
            )}

            <View style={styles.SelectedSupplementsList}>
                <SelectedSupplementsList
                    supplements={selectedSupplements}
                    deleteSupplement={deleteSupplement}
                    editSupplement={editSupplement}
                />
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    planPickerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
    },
    addManuallyTextContainer: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    planButton: {
        marginVertical: 6,
        width: '100%',
    },
    cancelButton: {
        marginTop: 20,
    },
    SelectedSupplementsList: {
        marginTop: 20,
    },
    noSupplementsText: {
        textAlign: 'center',
        marginBottom: 18,
    }
});

