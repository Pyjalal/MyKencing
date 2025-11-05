/**
 * SplashScreen - Loading screen with MyKencing logo
 * Matches Figma design: Loading 1.png
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onFinish?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Pill-shaped logo with gradient */}
        <View style={styles.pillContainer}>
          {/* Top half - Blue gradient */}
          <View style={styles.topHalf}>
            <LinearGradient
              colors={[Colors.primary.main, Colors.primary.light]}
              style={styles.gradientTop}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>

          {/* Bottom half - White to light blue */}
          <View style={styles.bottomHalf}>
            <LinearGradient
              colors={[Colors.primary.contrast, Colors.primary[50]]}
              style={styles.gradientBottom}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>

          {/* Orange arc overlay */}
          <View style={styles.arcOverlay}>
            <LinearGradient
              colors={[Colors.accent.main, Colors.accent.light]}
              style={styles.gradientArc}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  topHalf: {
    position: 'absolute',
    top: 0,
    left: 15,
    right: 0,
    bottom: '50%',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    overflow: 'hidden',
  },
  gradientTop: {
    flex: 1,
  },
  bottomHalf: {
    position: 'absolute',
    top: '50%',
    left: 15,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: 'hidden',
  },
  gradientBottom: {
    flex: 1,
  },
  arcOverlay: {
    position: 'absolute',
    left: 0,
    top: '10%',
    width: 30,
    height: 100,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden',
  },
  gradientArc: {
    flex: 1,
  },
});