export const COLORS = {
  primary: '#8B7355',
  primaryLight: '#A89279',
  primaryDark: '#6B563F',
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F3EF',
  text: '#2D2D2D',
  textSecondary: '#6B6B6B',
  textLight: '#9B9B9B',
  border: '#E8E5DF',
  success: '#7CB46B',
  error: '#D4736A',
  warning: '#D4A74A',
  accent: '#6B8FA3',
  overlay: 'rgba(0, 0, 0, 0.5)',
  white: '#FFFFFF',
  shadow: '#000000',
};

export const FONTS = {
  regular: { fontSize: 16, color: COLORS.text },
  small: { fontSize: 14, color: COLORS.textSecondary },
  tiny: { fontSize: 12, color: COLORS.textLight },
  heading: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  subheading: { fontSize: 20, fontWeight: '600', color: COLORS.text },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  body: { fontSize: 16, color: COLORS.text, lineHeight: 24 },
  caption: { fontSize: 12, color: COLORS.textLight },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
};
