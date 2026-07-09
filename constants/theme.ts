import { Platform } from 'react-native';

const tintColorLight = '#6C63FF';
const tintColorDark = '#8B83FF';

export const Colors = {
  light: {
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    background: '#F8F9FC',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F1F5',
    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    border: '#E5E7EB',
    card: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    accent: '#FF6B6B',
    accentTeal: '#4ECDC4',
    accentAmber: '#FFE66D',
    fab: '#6C63FF',
    fabText: '#FFFFFF',
    danger: '#EF4444',
    success: '#10B981',
    inputBackground: '#F3F4F6',
    placeholder: '#9CA3AF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    text: '#F0F0F5',
    textSecondary: '#9CA3AF',
    background: '#0F0F1A',
    surface: '#1A1A2E',
    surfaceElevated: '#252540',
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    border: '#2D2D4A',
    card: '#1A1A2E',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    accent: '#FF6B6B',
    accentTeal: '#4ECDC4',
    accentAmber: '#FFE66D',
    fab: '#6C63FF',
    fabText: '#FFFFFF',
    danger: '#EF4444',
    success: '#10B981',
    inputBackground: '#252540',
    placeholder: '#6B7280',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export type ThemeColors = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
