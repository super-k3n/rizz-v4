import { Image, StyleSheet, Alert, View } from 'react-native';
import { Button } from 'react-native-paper';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { router } from 'expo-router';
import { useEffect } from 'react';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CounterButton } from '@/components/counter/CounterButton';
import { ProgressDisplay } from '@/components/counter/ProgressDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { useCounter } from '@/contexts/CounterContext';
import { useRecord } from '@/contexts/RecordContext';
import { debugAuthAndProfile } from '@/services/auth-debug';
import { resetCounters } from '@/services/reset-counters';

// 明示的なデフォルトエクスポート
function HomeScreen() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { counters, targets, loading: counterLoading, resetCounters: resetCounterContext } = useCounter();
  const { incrementCounter, loading: recordLoading, error, isOnline } = useRecord();
  const today = new Date();
  const formattedDate = format(today, 'yyyy年MM月dd日（EEEE）', { locale: ja });

  // 画面が表示されたとき、目標値を読み込む
  useEffect(() => {
    // アプリ初期表示時にカウンターと目標値をリセット
    resetCounterContext();
  }, []);

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut();
      console.log('ログアウト成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ログアウト中にエラーが発生しました';
      Alert.alert('エラー', errorMessage);
    }
  };

  // 目標設定画面への遷移
  const handleGoToGoalSettings = () => {
    router.push('/goal-settings' as any);
  };

  // カウンターリセット処理
  const handleResetCounters = async () => {
    try {
      const result = await resetCounters();
      if (result.success && result.data) {
        // カウンターリセット後に画面を再読み込み
        Alert.alert('カウンターリセット', 'DBから最新のデータを取得しました。\n\nカウンター値: ' +
          `声かけ数: ${result.data.approached}, ` +
          `連絡先取得: ${result.data.getContact}, ` +
          `即日デート: ${result.data.instantDate}, ` +
          `即CV: ${result.data.instantCv}`);

        // CounterContextの状態を直接更新
        await resetCounterContext();

        // 画面を再読み込み
        router.replace('/');
      } else {
        Alert.alert('エラー', 'カウンターのリセットに失敗しました。\n' + JSON.stringify(result.error));
      }
    } catch (error) {
      console.error('カウンターリセットエラー:', error);
      Alert.alert('エラー', '予期せぬエラーが発生しました。');
    }
  };

  // 目標値を再読み込み
  const reloadTargets = async () => {
    try {
      // CounterContextのリセット関数を呼び出し（これによってSupabaseからも読み込まれる）
      await resetCounterContext();
      Alert.alert('成功', 'カウンターと目標値を再読み込みしました');
    } catch (error) {
      console.error('目標値の再読み込みエラー:', error);
      Alert.alert('エラー', '目標値の再読み込み中にエラーが発生しました');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0A0F23', dark: '#0A0F23' }}
      headerImage={
        <ThemedView style={styles.headerContent}>
          <ThemedText
            type="title"
            style={styles.headerTitle}
            lightColor="#C09E5C"
            darkColor="#C09E5C"
          >Rizz</ThemedText>
          <ThemedText
            style={styles.headerDate}
            lightColor="#FFFFFF"
            darkColor="#FFFFFF"
          >
            {formattedDate}
          </ThemedText>
          <ThemedText
            style={styles.headerUserName}
            lightColor="#FFFFFF"
            darkColor="#FFFFFF"
          >
            {user?.user_metadata?.name ? `${user.user_metadata.name}さん` : 'ゲストさん'}
          </ThemedText>
        </ThemedView>
      }

      >

      {/* 統合カウンターセクション */}
      <ThemedView style={styles.counterSection}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText
            type="subtitle"
            lightColor="#C09E5C"
            darkColor="#C09E5C"
            style={styles.sectionTitle}
          >
            本日の記録
          </ThemedText>

          <Button
            mode="text"
            onPress={handleGoToGoalSettings}
            icon="cog"
            textColor="#C09E5C"
          >
            目標設定
          </Button>
        </ThemedView>

        {/* 声かけ数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#0A0F23"
              darkColor="#FFFFFF"
            >
              声かけ数: {counters.approached} / {targets.approached}
            </ThemedText>
            <View style={styles.progressContainer}>
              <ProgressDisplay
                type="approached"
                current={counters.approached}
                target={targets.approached}
                showLabel={false}
              />
            </View>
          </ThemedView>
          <CounterButton
            type="approached"
            count={counters.approached}
            onIncrement={() => incrementCounter('approached', new Date().toISOString().split('T')[0])}
            loading={counterLoading.approached || recordLoading}
            compact={true}
          />
        </ThemedView>

        {/* 連絡先ゲット数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#0A0F23"
              darkColor="#FFFFFF"
            >
              バンゲ数: {counters.getContact} / {targets.getContact}
            </ThemedText>
            <View style={styles.progressContainer}>
              <ProgressDisplay
                type="getContact"
                current={counters.getContact}
                target={targets.getContact}
                showLabel={false}
              />
            </View>
          </ThemedView>
          <CounterButton
            type="getContact"
            count={counters.getContact}
            onIncrement={() => incrementCounter('getContact', new Date().toISOString().split('T')[0])}
            loading={counterLoading.getContact || recordLoading}
            compact={true}
          />
        </ThemedView>

        {/* 即日デート数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#0A0F23"
              darkColor="#FFFFFF"
            >
              連れ出し数: {counters.instantDate} / {targets.instantDate}
            </ThemedText>
            <View style={styles.progressContainer}>
              <ProgressDisplay
                type="instantDate"
                current={counters.instantDate}
                target={targets.instantDate}
                showLabel={false}
              />
            </View>
          </ThemedView>
          <CounterButton
            type="instantDate"
            count={counters.instantDate}
            onIncrement={() => incrementCounter('instantDate', new Date().toISOString().split('T')[0])}
            loading={counterLoading.instantDate || recordLoading}
            compact={true}
          />
        </ThemedView>

        {/* 即(sex)数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#0A0F23"
              darkColor="#FFFFFF"
            >
              即数: {counters.instantCv} / {targets.instantCv}
            </ThemedText>
            <View style={styles.progressContainer}>
              <ProgressDisplay
                type="instantCv"
                current={counters.instantCv}
                target={targets.instantCv}
                showLabel={false}
              />
            </View>
          </ThemedView>
          <CounterButton
            type="instantCv"
            count={counters.instantCv}
            onIncrement={() => incrementCounter('instantCv', new Date().toISOString().split('T')[0])}
            loading={counterLoading.instantCv || recordLoading}
            compact={true}
          />
        </ThemedView>
      </ThemedView>

      {/* ネットワーク状態とエラー表示 */}
      {!isOnline && (
        <ThemedView style={[styles.statusContainer, styles.offlineContainer]}>
          <ThemedText style={styles.statusText}>オフラインモード: 変更は後で同期されます</ThemedText>
        </ThemedView>
      )}

      {error && (
        <ThemedView style={[styles.statusContainer, styles.errorContainer]}>
          <ThemedText style={styles.statusText}>エラー: {error}</ThemedText>
        </ThemedView>
      )}

      {/* 開発中は認証情報も表示しておく */}
      <ThemedView style={styles.devContainer}>
        <ThemedText type="subtitle">認証情報（開発用）</ThemedText>
        {user ? (
          <ThemedView>
            <ThemedText>メールアドレス: {user.email}</ThemedText>
            <ThemedText>ユーザーID: {user.id}</ThemedText>
            <ThemedText>目標値: {targets.approached}</ThemedText>
            <Button
              mode="contained"
              onPress={handleLogout}
              loading={authLoading}
              style={styles.logoutButton}
            >
              ログアウト
            </Button>
            <Button
              mode="outlined"
              onPress={handleResetCounters}
              style={{marginTop: 8, borderColor: '#5c6bc0'}}
            >
              カウンター再読込
            </Button>
            <Button
              mode="outlined"
              onPress={reloadTargets}
              style={{marginTop: 8, borderColor: '#5c6bc0'}}
            >
              目標値再読込
            </Button>
            <Button
              mode="outlined"
              onPress={debugAuthAndProfile}
              style={{marginTop: 8, borderColor: '#333'}}
            >
              認証診断実行
            </Button>
          </ThemedView>
        ) : (
          <ThemedText>ログインしていません</ThemedText>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    marginTop: 32,
    padding: 16,
  },
  headerTitle: {
    fontSize: 32,
    marginBottom: 8,
  },
  headerDate: {
    fontSize: 16,
    marginBottom: 4,
  },
  headerUserName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterSection: {
    gap: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(54, 69, 79, 0.2)', // チャコールグレー（薄め）
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 0, // sectionHeaderで調整するので0に
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  counterInfo: {
    flex: 1,
    marginRight: 16,
  },
  counterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressContainer: {
    flex: 1,
  },
  devContainer: {
    gap: 8,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
  },
  logoutButton: {
    marginTop: 16,
    backgroundColor: '#800020', // バーガンディレッド
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  offlineContainer: {
    backgroundColor: 'rgba(255, 204, 0, 0.2)', // 黄色（薄め）
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 0, 0.5)',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)', // 赤（薄め）
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

// 明示的にデフォルトエクスポートを定義
export default HomeScreen;