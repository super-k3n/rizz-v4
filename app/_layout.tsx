import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider as PaperProvider, MD3LightTheme as PaperDefaultTheme, MD3DarkTheme as PaperDarkTheme } from 'react-native-paper';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { useRedirectByAuth } from '@/hooks/useRedirectByAuth';
import { RecordProvider } from '../contexts/RecordContext';
import { GoalProvider } from '../contexts/GoalContext';
import { CounterProvider } from '../contexts/CounterContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// 認証状態によるリダイレクトを行うコンポーネント
function AuthRedirect() {
  // リダイレクトロジックを有効化
  useRedirectByAuth();
  return null;
}

// 明示的なデフォルトエクスポート
function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // React Navigation用のテーマとReact Native Paper用のテーマを結合
  const combinedDefaultTheme = {
    ...DefaultTheme,
    ...PaperDefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      ...PaperDefaultTheme.colors,
    },
  };

  const combinedDarkTheme = {
    ...DarkTheme,
    ...PaperDarkTheme,
    colors: {
      ...DarkTheme.colors,
      ...PaperDarkTheme.colors,
    },
  };

  // 現在のカラースキームに基づくテーマを選択
  const theme = colorScheme === 'dark' ? combinedDarkTheme : combinedDefaultTheme;

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RecordProvider>
        <GoalProvider>
          <CounterProvider>
            <PaperProvider theme={theme}>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                {/* AuthRedirectコンポーネントを有効化 */}
                <AuthRedirect />
                <Stack initialRouteName="(auth)">
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </PaperProvider>
          </CounterProvider>
        </GoalProvider>
      </RecordProvider>
    </AuthProvider>
  );
}

// 明示的にデフォルトエクスポートを定義
export default RootLayout;
