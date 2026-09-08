import { useTheme } from '@react-navigation/native';
import { t } from 'i18next';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import AppCard from '@/components/ui/AppCard';
import { Area, areas } from '@/locales/areas';

export default function Areas() {
    const { myAreas, setMyAreas } = useStorage();
    const { colors } = useTheme();

    const handlePress = (area: Area) => {
        setMyAreas(prev => (prev.includes(area.id) ? prev.filter(id => id !== area.id) : [...prev, area.id]));
    };

    return (
        <View style={styles.content}>
            <Text style={[styles.title, { color: colors.primary }]}>{t('common:areas.selectAreas')}</Text>
            {areas.map(item => (
                <AppCard
                    key={item.id}
                    testID={`area-card-${item.id}`}
                    title={t(`areas:${item.id}.title`)}
                    description={t(`areas:${item.id}.description`)}
                    isActive={myAreas.includes(item.id)}
                    onPress={() => handlePress(item)}
                    showCheckbox={true}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});
