import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '../ThemedText';

interface DiscreetButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    larger?: boolean;
}

const DiscreetButton: React.FC<DiscreetButtonProps> = ({ title, onPress, disabled, larger }) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity
            style={styles.button}
            onPress={disabled ? undefined : onPress}
            activeOpacity={0.6}
        >
            <ThemedText type="buttonText" style={[larger && styles.addTargetButtonText, { color: disabled ? colors.textMuted : colors.primary }]}>
                {title}
            </ThemedText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    addTargetButtonText: {
        fontSize: 16,
    },
    button: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        
    },
});

export default DiscreetButton;
