import React from 'react';
import { AccessibilityInfo, findNodeHandle, type StyleProp, type TextStyle, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

function headingText(value: React.ReactNode): string {
  return React.Children.toArray(value)
    .map(child => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      if (React.isValidElement<{ children?: React.ReactNode }>(child)) return headingText(child.props.children);
      return '';
    })
    .join('');
}

/** Focus the new step after its transition, only while a screen reader is active. */
export default function StepHeading({ children, style }: Readonly<{ children: React.ReactNode; style?: StyleProp<TextStyle> }>) {
  const ref = React.useRef<View>(null);
  const label = headingText(children);
  React.useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      Promise.resolve(AccessibilityInfo.isScreenReaderEnabled()).then(enabled => {
        if (!active || !enabled || !ref.current) return;
        const node = findNodeHandle(ref.current);
        if (typeof node === 'number') AccessibilityInfo.setAccessibilityFocus(node);
      });
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [label]);
  return (
    <View ref={ref} collapsable={false} accessible accessibilityRole="header" accessibilityLabel={label}>
      <ThemedText type="title2" style={style}>
        {children}
      </ThemedText>
    </View>
  );
}
