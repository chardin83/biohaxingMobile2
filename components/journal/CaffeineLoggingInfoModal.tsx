import React from 'react';

import DrinkLoggingInfoModal from './DrinkLoggingInfoModal';

export default function CaffeineLoggingInfoModal({ requestKey }: Readonly<{ requestKey: number }>) {
  return <DrinkLoggingInfoModal requestKey={requestKey} kind="caffeine" />;
}
