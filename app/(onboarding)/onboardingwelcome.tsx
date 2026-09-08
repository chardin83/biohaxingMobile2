import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import DarkSmart from '@/assets/images/dark_orange1024.png';
import LightSmart from '@/assets/images/light_teal1024.png';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import Container from '@/components/ui/Container';

export default function OnboardingWelcome() {
    const { t } = useTranslation('common');
    const { colors, dark } = useTheme();
    const router = useRouter();
    const smartImage = dark ? DarkSmart : LightSmart;

    return (
        <Container
            background="gradient"
            gradientKey="sunrise"
            gradientLocations={colors.gradients?.sunrise?.locations2 as any}
            centerContent
        >
            <Image source={smartImage} style={styles.image} resizeMode="cover" />

            <View style={styles.content}>
                <ThemedText type="title2" style={styles.welcomeText}>
                    {t('onboarding.welcomeTo')}
                </ThemedText>
                <ThemedText type="title" style={[styles.brand, { color: colors.primary }]}>
                    Biohaxing
                </ThemedText>
                <ThemedText type="defaultLarge" style={styles.description}>
                    {t('onboarding.discoverHealth')}
                </ThemedText>

                <AppButton
                    title={t('onboarding.getStarted')}
                    onPress={() => router.push('/(onboarding)/onboardingsupplements')}
                    variant="primary"
                    style={styles.button}
                    icon="chevron.right"
                    iconPosition="right"
                />
            </View>
        </Container>
    );
}

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: 320,
        marginTop: 24,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 24,
    },
    welcomeText: {
        marginBottom: 0,
        textAlign: 'center',
    },
    brand: {
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        textAlign: 'center',
    },
    button: {
        width: '100%',
        marginTop: 30,
    },
});
