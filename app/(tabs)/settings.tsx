import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        設定
      </ThemedText>
      <ThemedText style={styles.description}>
        プロフィール画像設定、ユーザーネーム設定・変更、X(旧Twitter)アカウントURL記入・変更、メールアドレス変更、パスワード変更ができます。
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
});
