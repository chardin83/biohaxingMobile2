import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

import Container from './Container';

type Props = Omit<
  React.ComponentProps<typeof Container>,
  'ref' | 'background' | 'gradientKey' | 'gradientLocations' | 'showBackButton' | 'contentContainerStyle'
> & {
  title: React.ReactNode;
  subtitle?: string;
  description?: string;
  footerHelp?: string;
};

export default function StepsContainer({ title, subtitle, description, footer, footerHelp, children, totalSteps = 4, ...props }: Readonly<Props>) {
  const { colors } = useTheme();
  return (
    <Container
      {...props}
      totalSteps={totalSteps}
      background="gradient"
      gradientKey="sunrise"
      gradientLocations={colors.gradients?.sunrise?.locations3}
      showBackButton
      contentContainerStyle={styles.content}
      footer={
        footer ? (
          <View>
            {footer}
            {Boolean(footerHelp) && (
              <ThemedText type="explainer" style={styles.footerHelp}>
                {footerHelp}
              </ThemedText>
            )}
          </View>
        ) : undefined
      }
    >
      <ThemedText type="title2" style={styles.title}>
        {title}
      </ThemedText>
      {Boolean(subtitle) && (
        <ThemedText type="title3" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      )}
      {Boolean(description) && <ThemedText style={styles.description}>{description}</ThemedText>}
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 130, paddingBottom: 180, marginTop: 20 },
  title: { marginBottom: 12 },
  subtitle: { marginBottom: 12 },
  description: { marginBottom: 20 },
  footerHelp: { marginTop: 8, textAlign: 'center' },
});
