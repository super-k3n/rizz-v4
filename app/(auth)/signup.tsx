import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Text } from 'react-native-paper';
import SignupForm from '../../components/auth/SignupForm';
import FormLayout from '../../components/auth/FormLayout';
import { useAuth } from '../../contexts/AuthContext';

interface SignupFormValues {
  email: string;
  name: string;
  password: string;
}

// 明示的なデフォルトエクスポート
function SignupScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  // サインアップ処理
  const handleSignup = async (values: SignupFormValues) => {
    setIsLoading(true);

    try {
      await signUp(values.email, values.password, values.name);
      // 成功した場合、リダイレクト処理はuseRedirectByAuthで自動的に行われます
      console.log('サインアップ成功');
    } catch (error) {
      // エラーをユーザーに表示
      const errorMessage = error instanceof Error ? error.message : '登録エラーが発生しました';
      Alert.alert('サインアップエラー', errorMessage);
      console.error('サインアップエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const footerContent = (
    <View style={styles.footer}>
      <Text style={styles.footerText}>すでにアカウントをお持ちですか？</Text>
      <Link href="/login" asChild>
        <Text style={styles.linkText}>ログイン</Text>
      </Link>
    </View>
  );

  return (
    <FormLayout
      title="新規登録"
      subtitle="アカウントを作成して、あなたの実績を記録・分析しましょう"
      footer={footerContent}
    >
      <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
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
export default SignupScreen;
