import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { View, type ViewProps } from 'react-native';

export const JournalGoalFocusContext = createContext<{
  tipId?: string;
  requestId?: string;
  onFocus: (target: View) => void;
} | null>(null);

/** Measures the requested goal after layout so the journal can center it. */
export default function JournalGoalAnchor({ tipId, onLayout, ...props }: ViewProps & { tipId: string }) {
  const focus = useContext(JournalGoalFocusContext);
  const viewRef = useRef<View>(null);
  const [hasLayout, setHasLayout] = useState(false);

  useEffect(() => {
    if (!hasLayout || focus?.tipId !== tipId) return;
    const frame = requestAnimationFrame(() => {
      if (viewRef.current) focus.onFocus(viewRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [hasLayout, focus, tipId]);

  return <View {...props} ref={viewRef} collapsable={false} onLayout={event => {
    onLayout?.(event);
    setHasLayout(true);
  }} />;
}
