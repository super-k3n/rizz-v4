import { Image, StyleSheet, Alert, View } from 'react-native';
import { Button } from 'react-native-paper';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CounterButton } from '@/components/counter/CounterButton';
import { ProgressDisplay } from '@/components/counter/ProgressDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { useCounter } from '@/hooks/useCounter';

// 明示的なデフォルトエクスポート
function HomeScreen() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { counters, targets, loading, incrementCounter } = useCounter();
  const today = new Date();
  const formattedDate = format(today, 'yyyy年MM月dd日（EEEE）', { locale: ja });

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
          >
            Rizz
          </ThemedText>
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
      }>

      {/* 統合カウンターセクション */}
      <ThemedView style={styles.counterSection}>
        <ThemedText
          type="subtitle"
          lightColor="#C09E5C"
          darkColor="#C09E5C"
          style={styles.sectionTitle}
        >
          本日の記録
        </ThemedText>

        {/* 声かけ数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#FFFFFF"
              darkColor="#FFFFFF"
            >
              声かけ数 / {targets.approached}
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
            onIncrement={() => incrementCounter('approached')}
            loading={loading.approached}
            compact={true}
          />
        </ThemedView>

        {/* 連絡先ゲット数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#FFFFFF"
              darkColor="#FFFFFF"
            >
              連絡先確保数 / {targets.getContact}
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
            onIncrement={() => incrementCounter('getContact')}
            loading={loading.getContact}
            compact={true}
          />
        </ThemedView>

        {/* 即日デート数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#FFFFFF"
              darkColor="#FFFFFF"
            >
              連れ出し数 / {targets.instantDate}
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
            onIncrement={() => incrementCounter('instantDate')}
            loading={loading.instantDate}
            compact={true}
          />
        </ThemedView>

        {/* 即(sex)数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#FFFFFF"
              darkColor="#FFFFFF"
            >
              sex数 / {targets.instantCv}
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
            onIncrement={() => incrementCounter('instantCv')}
            loading={loading.instantCv}
            compact={true}
          />
        </ThemedView>
      </ThemedView>

      {/* 開発中は認証情報も表示しておく */}
      <ThemedView style={styles.devContainer}>
        <ThemedText type="subtitle">認証情報（開発用）</ThemedText>
        {user ? (
          <ThemedView>
            <ThemedText>メールアドレス: {user.email}</ThemedText>
            <ThemedText>ユーザーID: {user.id}</ThemedText>
            <Button
              mode="contained"
              onPress={handleLogout}
              loading={authLoading}
              style={styles.logoutButton}
            >
              ログアウト
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
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  headerTitle: {
    fontSize: 42,
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
  sectionTitle: {
    marginBottom: 8,
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
});

// 明示的にデフォルトエクスポートを定義
export default HomeScreen;
