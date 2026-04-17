import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet,View  } from 'react-native';

import { ThemedText } from './ThemedText';
import AppButton from './ui/AppButton';
import { CancelButton } from './ui/CancelButton';

interface TimePickerSectionProps {
    selectedTime: Date;
    setSelectedTime: (d: Date) => void;
}

const TimePickerSection: React.FC<TimePickerSectionProps> = ({
    selectedTime,
    setSelectedTime,
}) => {
    const [isTimeButtonVisible, setIsTimeButtonVisible] = useState(true);
    const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
    const {t} = useTranslation();

    return (
        <View style={styles.container}>
            {isTimeButtonVisible && (
                <AppButton
                    title={selectedTime.toTimeString().slice(0, 5)}
                    onPress={() => { setIsTimePickerVisible(true); setIsTimeButtonVisible(false); }}
                    variant="secondary"
                    icon="clock"
                />
            )}

            {isTimePickerVisible && (
                
                    <View style={styles.timePickerContainer}>
                        <ThemedText type="label" style={styles.label}>{t('timePickerSection.chooseTime')}</ThemedText>
                        {Platform.OS === 'ios' && (
                            <>
                                <DateTimePicker
                                    value={selectedTime}
                                    mode="time"
                                    is24Hour={true}
                                    display="spinner"
                                    onChange={(event, time) => {
                                        if (event.type === 'set' && time) {
                                            setSelectedTime(time);
                                        }
                                        setIsTimePickerVisible(false);
                                        setIsTimeButtonVisible(true);
                                    }}
                                    style={styles.picker}
                                />
                                <CancelButton
                                    onPress={() => { setIsTimePickerVisible(false); setIsTimeButtonVisible(true); }}
                                />
                            </>
                        )}
                    </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    timePickerContainer: {
        marginTop: 8,
    },
    picker: {
        width: 120,
        alignSelf: 'flex-start',
    },
});

export default TimePickerSection;
