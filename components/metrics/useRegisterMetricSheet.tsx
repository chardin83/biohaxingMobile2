import BottomSheet from '@gorhom/bottom-sheet';
import React from 'react';
import { Portal } from 'react-native-paper';

import { RegisterMetricBottomSheet } from '@/components/RegisterMetricBottomSheet';

export function useRegisterMetricSheet() {
  const registerBottomSheetRef = React.useRef<BottomSheet>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [metricValue, setMetricValue] = React.useState('');
  const [metricUnit, setMetricUnit] = React.useState('');
  const [metricNotes, setMetricNotes] = React.useState('');
  const [recordedAt, setRecordedAt] = React.useState(() => new Date());

  const open = React.useCallback(() => {
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
    setIsVisible(true);
  }, []);

  const close = React.useCallback(() => {
    setIsVisible(false);
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
  }, []);

  return {
    registerBottomSheetRef,
    isVisible,
    metricValue,
    setMetricValue,
    metricUnit,
    setMetricUnit,
    metricNotes,
    setMetricNotes,
    recordedAt,
    setRecordedAt,
    open,
    close,
  };
}

export function RegisterMetricSheetPortal(props: any) {
  return (
    <Portal>
      <RegisterMetricBottomSheet {...props} />
    </Portal>
  );
}
