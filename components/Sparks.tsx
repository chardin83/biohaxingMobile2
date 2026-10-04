import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View, ViewStyle } from 'react-native';

const { width, height } = Dimensions.get('window');

// Only varies decorative sparks; never used for security-sensitive values.
const randomForAnimation = () => Math.random(); // NOSONAR: Non-security animation randomness is safe here.

type SparkProps = {
  id: number;
  onComplete: (id: number) => void;
};

const Spark: React.FC<SparkProps> = ({ id, onComplete }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const positionY = useRef(new Animated.Value(0)).current;

  const baseX = randomForAnimation() * width;
  const offsetX = useRef(new Animated.Value(0)).current;
  const amplitude = randomForAnimation() * 20 + 5;
  const upwardDuration = 6000 + randomForAnimation() * 2000;
  const scale = randomForAnimation() * 0.5 + 0.5;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(positionY, {
        toValue: -height * 0.8,
        duration: upwardDuration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: upwardDuration,
        useNativeDriver: true,
      }),
    ]).start(() => onComplete(id));

    Animated.loop(
      Animated.sequence([
        Animated.timing(offsetX, {
          toValue: amplitude,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(offsetX, {
          toValue: -amplitude,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [amplitude, offsetX, positionY, opacity, onComplete, id, upwardDuration]);

  return (
    <Animated.View
      style={[
        styles.spark,
        {
          opacity,
          transform: [{ translateY: positionY }, { translateX: Animated.add(offsetX, new Animated.Value(baseX)) }, { scale }],
        },
      ]}
    />
  );
};

const Sparks: React.FC = () => {
  const [sparkList, setSparkList] = useState<number[]>([]);
  const nextSparkId = useRef(0);

  useEffect(() => {
    // Skapa en ny gnista var 600ms
    const interval = setInterval(() => {
      const id = nextSparkId.current++;
      setSparkList(prev => [...prev, id]);
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const removeSpark = (idToRemove: number) => {
    setSparkList(prev => prev.filter(id => id !== idToRemove));
  };

  return (
    <View style={styles.overlay} pointerEvents="none">
      {sparkList.map(id => (
        <Spark key={id} id={id} onComplete={removeSpark} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  spark: {
    position: 'absolute',
    top: height - 80, // Starta nära botten
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  } as ViewStyle,
});

export default Sparks;
