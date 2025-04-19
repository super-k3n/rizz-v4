import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Text } from 'react-native-paper';
import LoginForm from '../../components/auth/LoginForm';
import FormLayout from '../../components/auth/FormLayout';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
}

// 明示的なデフォルトエクスポート
function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  // ログイン処理
  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      await signIn(values.email, values.password);
      // 成功した場合、リダイレクト処理はuseRedirectByAuthで自動的に行われます
      console.log('ログイン成功');
    } catch (error) {
      // エラーをユーザーに表示
      const errorMessage = error instanceof Error ? error.message : '認証エラーが発生しました';
      Alert.alert('ログインエラー', errorMessage);
      console.error('ログインエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const footerContent = (
    <View style={styles.footer}>
      <Text style={styles.footerText}>アカウントをお持ちでないですか？</Text>
      <Link href="/signup" asChild>
        <Text style={styles.linkText}>新規登録</Text>
      </Link>
    </View>
  );

  return (
    <FormLayout
      title="ログイン"
      subtitle="アカウントにログインして、あなたの実績を記録しましょう"
      footer={footerContent}
    >
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginRight: 8,
  },
  linkText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

// 明示的にデフォルトエクスポートを定義
export default LoginScreen;
