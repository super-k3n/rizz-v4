import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider as PaperProvider, MD3LightTheme as PaperDefaultTheme, MD3DarkTheme as PaperDarkTheme } from 'react-native-paper';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RecordProvider } from '@/contexts/RecordContext';
import { GoalProvider } from '@/contexts/GoalContext';
import { CounterProvider } from '@/contexts/CounterContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// 認証状態によるリダイレクトを行うコンポーネント
function AuthRedirect() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // ロード中は何もしない
    if (isLoading) {
      return;
    }

    // 現在のルートが認証必須か判定（(auth)グループ以外は認証必須）
    const isAuthGroup = segments[0] === '(auth)';

    // リダイレクト状態を追跡するためのフラグ
    const shouldRedirectToLogin = !user && !isAuthGroup;
    const shouldRedirectToHome = user && isAuthGroup;

    // 一度だけリダイレクトを実行
    if (shouldRedirectToLogin) {
      // 未認証かつ認証必須ルートにいる場合はログイン画面へ
      console.log('未認証のためログイン画面へリダイレクトします');
      router.replace('/(auth)/login');
    } else if (shouldRedirectToHome) {
      // 認証済みかつ認証系画面にいる場合はホーム画面へ
      console.log('認証済みのためホーム画面へリダイレクトします');
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading, router]);

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
      <CounterProvider>
        <RecordProvider>
          <GoalProvider>
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
          </GoalProvider>
        </RecordProvider>
      </CounterProvider>
    </AuthProvider>
  );
}

// 明示的にデフォルトエクスポートを定義
export default RootLayout;
