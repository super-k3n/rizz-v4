import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Text } from 'react-native-paper';
import SignupForm from '../../components/auth/SignupForm';
import FormLayout from '../../components/auth/FormLayout';

interface SignupFormValues {
  email: string;
  name: string;
  password: string;
}

export default function SignupScreen() {
  const [isLoading, setIsLoading] = useState(false);

  // 実際のサインアップ処理は後で実装されますが、今はモックします
  const handleSignup = (values: SignupFormValues) => {
    setIsLoading(true);

    // モックの非同期処理
    setTimeout(() => {
      console.log('サインアップ情報:', values);
      setIsLoading(false);

      // サインアップ成功後、ホーム画面に遷移する処理は後で実装されます
    }, 1500);
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
