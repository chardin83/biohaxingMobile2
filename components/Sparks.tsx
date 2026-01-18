import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View, ViewStyle } from 'react-native';

const { width, height } = Dimensions.get('window');

type SparkProps = {
  id: number;
  onComplete: (id: number) => void;
};

const Spark: React.FC<SparkProps> = ({ id, onComplete }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const positionY = useRef(new Animated.Value(0)).current;

  const baseX = Math.random() * width;
  const offsetX = useRef(new Animated.Value(0)).current;
  const amplitude = Math.random() * 20 + 5;
  const upwardDuration = 6000 + Math.random() * 2000;
  const scale = Math.random() * 0.5 + 0.5;

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
  }, []);

  return (
    <Animated.View
      style={[
        styles.spark,
        {
          opacity,
          transform: [
            { translateY: positionY },
            { translateX: Animated.add(offsetX, new Animated.Value(baseX)) },
            { scale },
          ],
        },
      ]}
    />
  );
};

const Sparks: React.FC = () => {
  const [sparkList, setSparkList] = useState<number[]>([]);

  useEffect(() => {
    // Skapa en ny gnista var 600ms
    const interval = setInterval(() => {
      setSparkList(prev => [...prev, Date.now() + Math.random()]);
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const removeSpark = (idToRemove: number) => {
    setSparkList(prev => prev.filter(id => id !== idToRemove));
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, pointerEvents: 'none' }]}>
      {sparkList.map(id => (
        <Spark key={id} id={id} onComplete={removeSpark} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
