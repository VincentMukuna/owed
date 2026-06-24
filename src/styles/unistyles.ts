import { StyleSheet } from 'react-native-unistyles';

import { appThemes, type AppTheme } from './themes';

StyleSheet.configure({
  themes: appThemes,
  settings: {
    initialTheme: 'light',
  },
});

type AppThemes = {
  light: AppTheme;
};

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}
