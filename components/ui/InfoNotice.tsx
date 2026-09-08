import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { ThemedText } from '@/components/ThemedText';

type InfoNoticeProps = Readonly<{
    message: string;
}>;

export default function InfoNotice({ message }: InfoNoticeProps) {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                },
            ]}
        >
            <View
                style={[
                    styles.infoIcon,
                    {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                    },
                ]}
            >
                <Icon source="information-outline" size={16} color={colors.icon} />
            </View>
            <ThemedText type="caption" style={styles.message}>
                {message}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
    },
    infoIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        marginRight: 8,
    },
    message: {
        flex: 1,
    },
});