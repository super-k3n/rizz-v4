import { useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark' | null;

interface ColorSchemeHook {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: 'light' | 'dark') => void;
  resetColorScheme: () => void;
}

const COLOR_SCHEME_KEY = '@rizz_app_color_scheme';

export const useColorScheme = (): ColorSchemeHook => {
  const nativeColorScheme = useNativeColorScheme() as ColorScheme;
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(null);

  // 初期化時に保存されたカラースキームを読み込み
  useEffect(() => {
    const loadStoredColorScheme = async () => {
      try {
        const storedColorScheme = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
        if (storedColorScheme) {
          setColorSchemeState(storedColorScheme as ColorScheme);
        } else {
          setColorSchemeState(nativeColorScheme);
        }
      } catch (error) {
        console.error('カラースキームの読み込みエラー:', error);
        setColorSchemeState(nativeColorScheme);
      }
    };

    loadStoredColorScheme();
  }, [nativeColorScheme]);

  // カラースキームを設定し、永続化
  const setColorScheme = async (scheme: 'light' | 'dark') => {
    try {
      await AsyncStorage.setItem(COLOR_SCHEME_KEY, scheme);
      setColorSchemeState(scheme);
    } catch (error) {
      console.error('カラースキームの保存エラー:', error);
    }
  };

  // カラースキームをシステムデフォルトにリセット
  const resetColorScheme = async () => {
    try {
      await AsyncStorage.removeItem(COLOR_SCHEME_KEY);
      setColorSchemeState(nativeColorScheme);
    } catch (error) {
      console.error('カラースキームのリセットエラー:', error);
    }
  };

  return {
    colorScheme: colorScheme || nativeColorScheme,
    setColorScheme,
    resetColorScheme,
  };
};
