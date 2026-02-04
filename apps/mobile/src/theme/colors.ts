// Compass Design System Colors - Premium UI
// Matching aicoachui/ design tokens with enhancements

export const colors = {
  // Base colors
  background: "#FFFFFF",
  foreground: "#1A1A1A",
  
  // Card colors
  card: "#FFFFFF",
  cardForeground: "#1A1A1A",
  
  // Primary (refined dark gray with subtle warmth)
  primary: "#2D2D2D",
  primaryForeground: "#FFFFFF",
  primaryLight: "#4A4A4A",
  primaryDark: "#1A1A1A",
  
  // Secondary (light gray backgrounds)
  secondary: "#F5F5F5",
  secondaryForeground: "#2D2D2D",
  
  // Muted/subtle text
  muted: "#F8F8F8",
  mutedForeground: "#6B6B6B",
  
  // Borders
  border: "#E5E5E5",
  input: "#F0F0F0",
  
  // Success/positive
  success: "#10B981",
  successLight: "#D1FAE5",
  
  // Destructive/error
  destructive: "#EF4444",
  destructiveLight: "#FEE2E2",
  
  // Accent (for highlights)
  accent: "#6366F1",
  accentForeground: "#FFFFFF",
  accentLight: "#EEF2FF",
  
  // Info/Warning
  info: "#3B82F6",
  infoLight: "#DBEAFE",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  
  // Overlay
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.1)",
  
  // Gradient colors (warm organic theme)
  gradientStart: "#E8E8E8",
  gradientEnd: "#F5D5C0",
  
  // Glassmorphism
  glass: "rgba(255, 255, 255, 0.85)",
  glassBorder: "rgba(255, 255, 255, 0.5)",
  glassLight: "rgba(255, 255, 255, 0.7)",
  
  // Tree/Nature colors
  treeTrunk: "#8B6914",
  treeLeaf: "#7CB342",
  treeLeafLight: "#AED581",
  treeGlow: "rgba(255, 235, 59, 0.6)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

// Shadow/elevation system
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Line heights for better readability
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};
