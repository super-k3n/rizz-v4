import { Image, StyleSheet, Platform, Alert } from 'react-native';
import { Button } from 'react-native-paper';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';

// 明示的なデフォルトエクスポート
function HomeScreen() {
  const { user, signOut, isLoading } = useAuth();

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
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Rizzへようこそ！</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.userInfoContainer}>
        <ThemedText type="subtitle">認証情報</ThemedText>
        {user ? (
          <ThemedView>
            <ThemedText>メールアドレス: {user.email}</ThemedText>
            <ThemedText>ユーザーID: {user.id}</ThemedText>
            <ThemedText>名前: {user.user_metadata?.name || 'Not set'}</ThemedText>
            <Button
              mode="contained"
              onPress={handleLogout}
              loading={isLoading}
              style={styles.logoutButton}
            >
              ログアウト
            </Button>
          </ThemedView>
        ) : (
          <ThemedText>ログインしていません</ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">アプリについて</ThemedText>
        <ThemedText>
          このアプリはRizz（ストリートナンパの実績記録・分析アプリ）です。
          毎日の活動を記録し、目標に向かって進捗を管理しましょう。
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfoContainer: {
    gap: 8,
    marginBottom: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  logoutButton: {
    marginTop: 16,
  },
});

// 明示的にデフォルトエクスポートを定義
export default HomeScreen;
