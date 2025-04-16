import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Text } from 'react-native-paper';
import LoginForm from '../../components/auth/LoginForm';
import FormLayout from '../../components/auth/FormLayout';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);

  // 実際のログイン処理は後で実装されますが、今はモックします
  const handleLogin = (values: LoginFormValues) => {
    setIsLoading(true);

    // モックの非同期処理
    setTimeout(() => {
      console.log('ログイン情報:', values);
      setIsLoading(false);

      // ログイン成功後、ホーム画面に遷移する処理は後で実装されます
    }, 1500);
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
