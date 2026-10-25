import React from 'react';

import HealthSyncSettings from '@/components/HealthSyncSettings';
import Container from '@/components/ui/Container';

export default function HealthSyncPage() {
  return (
    <Container background="default" showBackButton>
      <HealthSyncSettings />
    </Container>
  );
}
