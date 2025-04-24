import React, { useState, useEffect } from 'react';
import { StyleSheet, View, AppState } from 'react-native';
import { Switch, Snackbar } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '../ThemedText';
import { useProfile } from '@/contexts/ProfileContext';
import * as Updates from 'expo-updates';

export const ThemeToggle: React.FC = () => {
  const { profile, updateTheme, loading } = useProfile();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // プロフィールからテーマ設定を読み込み
  useEffect(() => {
    // 実際の画面の状態とスイッチの状態を同期させる
    const actualTheme = colorScheme || 'dark';
    setIsDarkMode(actualTheme === 'dark');

    // またプロフィールの設定が実際のテーマと異なる場合、プロフィールを更新
    if (profile && profile.theme_preference !== actualTheme) {
      console.log('テーマ設定の不一致を修正します:', {
        profileTheme: profile.theme_preference,
        actualTheme
      });
      updateTheme(actualTheme).catch(err => {
        console.error('テーマ設定の同期エラー:', err);
      });
    }
  }, [profile, colorScheme]);

  // アプリをリロードする関数
  const reloadApp = async () => {
    try {
      setIsUpdating(true);
      // ExpoのOTAアップデート機能を使用してアプリをリロード
      await Updates.reloadAsync();
    } catch (error) {
      console.error('アプリのリロードに失敗しました:', error);
      // 代替アプローチ: AppStateの変更を弾く
      AppState.currentState = 'inactive';
      setTimeout(() => {
        AppState.currentState = 'active';
      }, 100);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleTheme = async () => {
    try {
      setIsUpdating(true);
      // 現在の状態の反対を取得
      const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
      console.log('テーマを切り替えています:', { 現在: colorScheme, 新規: newTheme });

      // まずUIを即座に更新
      setIsDarkMode(newTheme === 'dark');
      setColorScheme(newTheme); // アプリ全体のテーマを変更

      // 次にプロフィールの設定を更新
      await updateTheme(newTheme);

      // テーマ変更を記録するメッセージを設定
      setSnackbarMessage(`テーマを${newTheme === 'dark' ? 'ダーク' : 'ライト'}モードに変更しました`);
      setSnackbarVisible(true);

      // 変更が反映されるように、短い遅延後にリロード
      setTimeout(async () => {
        await reloadApp();
      }, 500);
    } catch (error) {
      setSnackbarMessage('テーマの変更に失敗しました');
      setSnackbarVisible(true);
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        テーマ設定
      </ThemedText>

      <View style={styles.toggleContainer}>
        <ThemedText style={styles.label}>ダークモード (ON/OFF)</ThemedText>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          disabled={loading || isUpdating}
        />
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: '閉じる',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
  },
});
