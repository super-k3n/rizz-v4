import React, { useEffect } from 'react';
import { StyleSheet, Alert, ScrollView, RefreshControl, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from 'react-native-paper';
import GoalForm from '../../src/components/goal/GoalForm';
import { useGoal } from '@/contexts/GoalContext';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator } from 'react-native-paper';
import { debugGoals, insertTestGoal } from '../../src/services/goal';

export default function GoalSettingsScreen() {
  const { loading, syncGoals, error } = useGoal();
  const { user } = useAuth();

  // 画面が表示されたときにデータを同期
  useEffect(() => {
    syncGoals();
  }, []);

  // エラー発生時にアラートを表示
  useEffect(() => {
    if (error) {
      Alert.alert('エラー', error.message);
    }
  }, [error]);

  // プルダウンリフレッシュの処理
  const onRefresh = React.useCallback(() => {
    syncGoals();
  }, [syncGoals]);

  // デバッグ機能: Supabaseデータ確認
  const runDebug = async () => {
    try {
      const result = await debugGoals();
      Alert.alert('Supabaseデータ確認結果', JSON.stringify(result, null, 2).substring(0, 1000));
    } catch (err) {
      Alert.alert('デバッグエラー', JSON.stringify(err, null, 2));
    }
  };

  // デバッグ機能: テストデータ挿入
  const insertTest = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインしていません');
      return;
    }

    try {
      const result = await insertTestGoal(user.id);
      Alert.alert('テストデータ挿入結果', JSON.stringify(result, null, 2));
    } catch (err) {
      Alert.alert('テストデータ挿入エラー', JSON.stringify(err, null, 2));
    }
  };

  // デバッグ機能: Supabaseユーザー確認
  const checkUser = () => {
    if (!user) {
      Alert.alert('エラー', 'ユーザーはログインしていません');
      return;
    }

    Alert.alert('ユーザー情報', JSON.stringify({
      id: user.id,
      email: user.email,
      metadata: user.user_metadata,
      created_at: user.created_at
    }, null, 2));
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          目標設定
        </ThemedText>
        <ThemedText style={styles.description}>
          日、週、月、年ごとの目標を設定できます。
        </ThemedText>

        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          <GoalForm initialPeriod="daily" />
        )}

        {/* デバッグセクション */}
        <View style={styles.debugContainer}>
          <ThemedText style={styles.debugTitle}>デバッグメニュー</ThemedText>

          <Button
            mode="outlined"
            onPress={runDebug}
            style={styles.debugButton}
          >
            Supabaseデータ確認
          </Button>

          <Button
            mode="outlined"
            onPress={insertTest}
            style={styles.debugButton}
          >
            テストデータ挿入
          </Button>

          <Button
            mode="outlined"
            onPress={checkUser}
            style={styles.debugButton}
          >
            ユーザー情報確認
          </Button>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  loader: {
    marginTop: 40,
  },
  debugContainer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  debugButton: {
    marginBottom: 8,
  },
});
