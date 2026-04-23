
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Supplement } from '@/app/domain/Supplement';

import { ThemedText } from './ThemedText';
import AppButton from './ui/AppButton';
import { CancelButton } from './ui/CancelButton';
import { Checkbox } from './ui/Checkbox';
import { DateTimeInput } from './ui/DateTimeInput';


interface PlanSupplementsPickerProps {
    supplements: Supplement[];
    onConfirm: (selected: Supplement[], selectedTime: Date) => void;
    onCancel: () => void;
    selectedTime: Date;
    setSelectedTime: (d: Date) => void;
    planName: string;
}

const PlanSupplementsPicker: React.FC<PlanSupplementsPickerProps> = ({ supplements, onConfirm, onCancel, selectedTime, setSelectedTime, planName }) => {
    const [checked, setChecked] = useState<boolean[]>(supplements.map(() => true));
    const { t } = useTranslation();

    const toggle = (idx: number) => {
        setChecked(list => list.map((v, i) => (i === idx ? !v : v)));
    };

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <ThemedText type="title3">{planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase()} </ThemedText>
            </View>
            <DateTimeInput
                value={selectedTime}
                onChange={setSelectedTime}
                showDate={false}
                showTime={true}
            />


            <ScrollView style={styles.scrollView}>
                {supplements.map((supp, idx) => (
                    <View key={supp.name} style={styles.supplementRow}>
                        <Checkbox
                            checked={checked[idx]}
                            onPress={() => toggle(idx)}
                            label={supp.name}
                            style={styles.checkbox}
                        />
                    </View>
                ))}
            </ScrollView>


            <AppButton
                title={t('general.add')}
                onPress={() => onConfirm(supplements.filter((_, idx) => checked[idx]), selectedTime)}
                variant="primary"
                style={styles.addButton}
            />
            <CancelButton onPress={onCancel} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    scrollView: {
        maxHeight: 300,
        marginBottom: 16,
    },
    supplementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    checkbox: {
        marginRight: 8,
        padding: 4,
    },
    addButton: {
        marginBottom: 8,
    },
});

export default PlanSupplementsPicker;
