import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const theme = useRNColorScheme();
  return theme === 'dark' ? 'dark' : 'light';
}
