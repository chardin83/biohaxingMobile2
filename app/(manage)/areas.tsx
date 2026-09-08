import { useTheme } from '@react-navigation/native';
import React from 'react';

import Areas from '@/components/Areas';
import Container from '@/components/ui/Container';

export default function AreasRoute() {
  const { colors } = useTheme();

  return (
    <Container
      background="default"
      centerContent
      showBackButton
      gradientLocations={colors.gradients?.sunrise?.locations2 as any}
    >
      <Areas />
    </Container>
  );
}
