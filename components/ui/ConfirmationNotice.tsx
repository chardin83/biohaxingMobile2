import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type ConfirmationNoticeProps = Readonly<{
    title: string;
    message: string;
    onDismiss: () => void;
    dismissAccessibilityLabel?: string;
}>;

export default function ConfirmationNotice({
    title,
    message,
    onDismiss,
    dismissAccessibilityLabel = 'Dismiss confirmation',
}: Readonly<ConfirmationNoticeProps>) {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.surfaceGreen,
                    borderColor: colors.surfaceGreenBorder,
                },
            ]}
        >
            <View
                style={[
                    styles.checkboxIcon,
                    {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.surfaceGreenBorder,
                    },
                ]}
                accessibilityLabel="Bekräftad"
            >
                <ThemedText
                    type="defaultSemiBold"
                    lightColor={colors.surfaceGreenBorder}
                    darkColor={colors.surfaceGreenBorder}
                    style={styles.checkmark}
                >
                    {'\u2713'}
                </ThemedText>
            </View>
            <View style={styles.textContainer}>
                <ThemedText type="defaultSemiBold">{title}</ThemedText>
                <ThemedText type="caption">{message}</ThemedText>
            </View>
            <TouchableOpacity
                onPress={onDismiss}
                style={styles.dismissButton}
                accessibilityLabel={dismissAccessibilityLabel}
            >
                <ThemedText type="defaultSemiBold" style={styles.dismissText}>
                    X
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        padding: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
    },
    checkboxIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        marginRight: 10,
    },
    checkmark: {
        fontSize: 17,
        lineHeight: 20,
    },
    dismissButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    dismissText: {
        fontSize: 16,
    },
    textContainer: {
        flex: 1,
        gap: 2,
    },
});
