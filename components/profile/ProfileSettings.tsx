import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Divider } from 'react-native-paper';
import { ThemedText } from '../ThemedText';
import { UsernameForm } from './UsernameForm';
import { XUrlForm } from './XUrlForm';
import { PasswordForm } from './PasswordForm';
import { ThemeToggle } from './ThemeToggle';
import { useProfile } from '@/contexts/ProfileContext';

export const ProfileSettings: React.FC = () => {
  const { profile, loading, error } = useProfile();

  if (loading && !profile) {
    return (
      <View style={styles.container}>
        <ThemedText>読み込み中...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.errorText}>
          エラーが発生しました: {error.message}
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          プロフィール設定
        </ThemedText>
        
        <ThemedText style={styles.email}>
          メールアドレス: {profile?.email}
        </ThemedText>
        
        <UsernameForm />
        
        <Divider style={styles.divider} />
        
        <XUrlForm />
        
        <Divider style={styles.divider} />
        
        <PasswordForm />
        
        <Divider style={styles.divider} />
        
        <ThemeToggle />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  email: {
    fontSize: 14,
    marginBottom: 24,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
});
