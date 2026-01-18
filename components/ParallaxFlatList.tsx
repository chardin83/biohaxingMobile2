import React from 'react';
import { FlatListProps, NativeScrollEvent, NativeSyntheticEvent, StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedRef, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground.andorid';
import { useColorScheme } from '@/hooks/useColorScheme';

const HEADER_HEIGHT = 250;

type Props<T> = Omit<FlatListProps<T>, 'CellRendererComponent'> & {
  headerImage: React.ReactElement;
  headerBackgroundColor: { dark: string; light: string };
};

export default function ParallaxFlatList<T>({ headerImage, headerBackgroundColor, ...flatListProps }: Props<T>) {
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.FlatList<T>>();
  const scrollOffset = useSharedValue(0); // Manually track scroll offset
  const bottom = useBottomTabOverflow();

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.value = event.nativeEvent.contentOffset.y; // Update scroll offset
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  return (
    <ThemedView style={styles.container}>
      <Animated.FlatList
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={onScroll} // Manually handle scroll events
        scrollIndicatorInsets={{ bottom }}
        contentContainerStyle={{ paddingBottom: bottom }}
        ListHeaderComponent={
          <Animated.View
            style={[styles.header, { backgroundColor: headerBackgroundColor[colorScheme] }, headerAnimatedStyle]}
          >
            {headerImage}
          </Animated.View>
        }
        {...flatListProps} // Pass all additional props to FlatList
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
});
