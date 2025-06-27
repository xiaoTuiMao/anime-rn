import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

export interface BaseProps {
  title?: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  duration?: number;
}

const Base = ({
  title = '点击我',
  onPress,
  style,
  textStyle,
  duration = 1000,
}: BaseProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const handlePress = () => {
    // 触发点击回调
    onPress?.();

    // 开始消失动画
    opacity.value = withTiming(0, { duration }, () => {
      runOnJS(setIsVisible)(false);
    });
    scale.value = withTiming(0.8, { duration });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, textStyle]}>{title}12 2热更新测试</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Base;