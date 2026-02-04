import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated, Easing } from "react-native";
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { colors } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TREE_WIDTH = SCREEN_WIDTH * 0.85;
const TREE_HEIGHT = TREE_WIDTH * 0.9;

interface GrowthTreeProps {
  insightsCount?: number;
  sessionsCount?: number;
}

// Leaf positions - representing insights gained
const LEAF_POSITIONS = [
  // Left branch leaves
  { x: 55, y: 85, scale: 0.8, delay: 0 },
  { x: 45, y: 70, scale: 0.9, delay: 200 },
  { x: 65, y: 65, scale: 0.7, delay: 400 },
  { x: 35, y: 55, scale: 0.85, delay: 600 },
  { x: 50, y: 50, scale: 0.75, delay: 800 },
  // Center leaves
  { x: 100, y: 40, scale: 1, delay: 100 },
  { x: 90, y: 55, scale: 0.9, delay: 300 },
  { x: 110, y: 50, scale: 0.85, delay: 500 },
  { x: 95, y: 65, scale: 0.8, delay: 700 },
  { x: 105, y: 75, scale: 0.7, delay: 900 },
  // Right branch leaves
  { x: 145, y: 85, scale: 0.8, delay: 150 },
  { x: 155, y: 70, scale: 0.9, delay: 350 },
  { x: 135, y: 65, scale: 0.7, delay: 550 },
  { x: 165, y: 55, scale: 0.85, delay: 750 },
  { x: 150, y: 50, scale: 0.75, delay: 950 },
  // Top leaves
  { x: 80, y: 35, scale: 0.7, delay: 250 },
  { x: 120, y: 30, scale: 0.75, delay: 450 },
  { x: 100, y: 25, scale: 0.8, delay: 650 },
];

// Glowing insight positions (yellow sparkles)
const GLOW_POSITIONS = [
  { x: 50, y: 60, delay: 0 },
  { x: 100, y: 35, delay: 500 },
  { x: 150, y: 65, delay: 1000 },
  { x: 75, y: 45, delay: 1500 },
  { x: 125, y: 55, delay: 2000 },
  { x: 90, y: 70, delay: 2500 },
  { x: 110, y: 45, delay: 3000 },
];

const AnimatedLeaf = ({ x, y, scale, delay }: { x: number; y: number; scale: number; delay: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: 3,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, translateY]);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: (x / 200) * TREE_WIDTH - 10 * scale,
          top: (y / 150) * TREE_HEIGHT - 10 * scale,
          transform: [{ translateY }],
        },
      ]}
    >
      <Svg width={20 * scale} height={20 * scale} viewBox="0 0 20 20">
        <Defs>
          <RadialGradient id={`leafGrad${x}${y}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.treeLeafLight} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.treeLeaf} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Circle cx="10" cy="10" r="8" fill={`url(#leafGrad${x}${y})`} />
      </Svg>
    </Animated.View>
  );
};

const GlowingInsight = ({ x, y, delay }: { x: number; y: number; delay: number }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    opacityAnimation.start();
    scaleAnimation.start();

    return () => {
      opacityAnimation.stop();
      scaleAnimation.stop();
    };
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: (x / 200) * TREE_WIDTH - 6,
          top: (y / 150) * TREE_HEIGHT - 6,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: colors.treeGlow,
          shadowColor: "#FFD700",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 8,
          elevation: 4,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

export function GrowthTree({ insightsCount = 0, sessionsCount = 0 }: GrowthTreeProps) {
  // Show leaves based on insights count (max 18)
  const visibleLeaves = Math.min(insightsCount + 5, LEAF_POSITIONS.length);
  // Show glows based on sessions (max 7)
  const visibleGlows = Math.min(Math.floor(sessionsCount / 2) + 2, GLOW_POSITIONS.length);

  return (
    <View style={styles.container}>
      {/* Tree SVG */}
      <Svg width={TREE_WIDTH} height={TREE_HEIGHT} viewBox="0 0 200 150">
        <Defs>
          <RadialGradient id="trunkGrad" cx="50%" cy="100%" r="80%">
            <Stop offset="0%" stopColor="#A67C52" stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.treeTrunk} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Main trunk */}
        <Path
          d="M95 150 Q90 130 85 110 Q80 95 90 85 L100 85 L110 85 Q120 95 115 110 Q110 130 105 150 Z"
          fill="url(#trunkGrad)"
        />
        
        {/* Left branch */}
        <Path
          d="M90 90 Q70 80 50 75 Q45 74 45 70 Q45 66 55 68 Q75 72 92 82"
          fill="none"
          stroke={colors.treeTrunk}
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* Right branch */}
        <Path
          d="M110 90 Q130 80 150 75 Q155 74 155 70 Q155 66 145 68 Q125 72 108 82"
          fill="none"
          stroke={colors.treeTrunk}
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* Center upper branch */}
        <Path
          d="M100 85 Q100 60 100 45 Q100 40 100 35"
          fill="none"
          stroke={colors.treeTrunk}
          strokeWidth="5"
          strokeLinecap="round"
        />
        
        {/* Small left upper branch */}
        <Path
          d="M95 70 Q80 55 70 50"
          fill="none"
          stroke={colors.treeTrunk}
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Small right upper branch */}
        <Path
          d="M105 70 Q120 55 130 50"
          fill="none"
          stroke={colors.treeTrunk}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </Svg>

      {/* Animated leaves */}
      {LEAF_POSITIONS.slice(0, visibleLeaves).map((leaf, index) => (
        <AnimatedLeaf key={`leaf-${index}`} {...leaf} />
      ))}

      {/* Glowing insights */}
      {GLOW_POSITIONS.slice(0, visibleGlows).map((glow, index) => (
        <GlowingInsight key={`glow-${index}`} {...glow} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TREE_WIDTH,
    height: TREE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});

export default GrowthTree;
