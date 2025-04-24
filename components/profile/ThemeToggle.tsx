import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Switch, Snackbar } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '../ThemedText';
import { useProfile } from '@/contexts/ProfileContext';

export const ThemeToggle: React.FC = () => {
  const { profile, updateTheme, loading } = useProfile();
  const { setColorScheme } = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // プロフィールからテーマ設定を読み込み
  useEffect(() => {
    if (profile) {
      setIsDarkMode(profile.theme_preference === 'dark');
    }
  }, [profile]);

  const toggleTheme = async () => {
    try {
      const newTheme = isDarkMode ? 'light' : 'dark';
      await updateTheme(newTheme);
      setIsDarkMode(!isDarkMode);
      setColorScheme(newTheme); // アプリ全体のテーマを変更
      setSnackbarMessage(`テーマを${newTheme === 'dark' ? 'ダーク' : 'ライト'}モードに変更しました`);
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('テーマの変更に失敗しました');
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        テーマ設定
      </ThemedText>
      
      <View style={styles.toggleContainer}>
        <ThemedText style={styles.label}>ダークモード</ThemedText>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          disabled={loading}
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
