import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Divider, Button, TextInput, Snackbar, Switch, RadioButton } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ThemedText } from '../ThemedText';
import { useProfile } from '@/contexts/ProfileContext';
import * as Updates from 'expo-updates';

const ProfileSchema = Yup.object().shape({
  name: Yup.string()
    .required('ユーザー名は必須です')
    .min(2, 'ユーザー名は2文字以上で入力してください')
    .max(30, 'ユーザー名は30文字以内で入力してください'),
  x_url: Yup.string()
    .nullable()
    .test(
      'is-valid-url',
      'URLの形式が正しくありません',
      (value) => {
        if (!value) return true;
        try {
          const url = new URL(value);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (e) {
          return false;
        }
      }
    )
    .test(
      'is-twitter-url',
      'XまたはTwitterのURLを入力してください',
      (value) => {
        if (!value) return true;
        try {
          const url = new URL(value);
          return (
            url.hostname === 'twitter.com' ||
            url.hostname === 'www.twitter.com' ||
            url.hostname === 'x.com' ||
            url.hostname === 'www.x.com'
          );
        } catch (e) {
          return false;
        }
      }
    ),
  currentPassword: Yup.string()
    .when(['newPassword', 'confirmPassword'], {
      is: (newPassword: string, confirmPassword: string) => newPassword || confirmPassword,
      then: (schema) => schema.required('現在のパスワードは必須です'),
      otherwise: (schema) => schema,
    }),
  newPassword: Yup.string()
    .test('empty-or-strong', '新しいパスワードは8文字以上、大文字・小文字・数字・記号を含めてください', (value) => {
      if (!value) return true;
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
    }),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), ''], 'パスワードが一致しません'),
});

export const ProfileSettings: React.FC = () => {
  const { profile, updateProfile, changePassword, updateTheme, loading, error } = useProfile();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [themeUpdating, setThemeUpdating] = useState(false);
  const [language, setLanguage] = useState(profile?.language ?? 0);
  const [languageUpdating, setLanguageUpdating] = useState(false);

  const initialValues = useMemo(() => ({
    name: profile?.name || '',
    x_url: profile?.x_url || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }), [profile]);

  // テーマ切替ハンドラ
  const handleThemeToggle = async () => {
    if (!profile) return;
    const newTheme = profile.theme_preference === 'dark' ? 'light' : 'dark';
    try {
      setThemeUpdating(true);
      await updateTheme(newTheme);
      setSnackbarMessage(`テーマを${newTheme === 'dark' ? 'ダーク' : 'ライト'}モードに変更しました`);
      setSnackbarVisible(true);
      // 変更が反映されるようにリロード
      setTimeout(async () => {
        await Updates.reloadAsync();
      }, 500);
    } catch (e: any) {
      setSnackbarMessage('テーマの変更に失敗しました');
      setSnackbarVisible(true);
    } finally {
      setThemeUpdating(false);
    }
  };

  // 言語切替ハンドラ
  const handleLanguageChange = async (value: number) => {
    if (!profile) return;
    try {
      setLanguageUpdating(true);
      setLanguage(value);
      await updateProfile({ language: value });
      setSnackbarMessage(`言語を${value === 0 ? '日本語' : '英語'}に変更しました。リロードします...`);
      setSnackbarVisible(true);
      setTimeout(async () => {
        await Updates.reloadAsync();
      }, 500);
    } catch (e: any) {
      setSnackbarMessage('言語の変更に失敗しました');
      setSnackbarVisible(true);
    } finally {
      setLanguageUpdating(false);
    }
  };

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
    <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          プロフィール設定
        </ThemedText>
        <ThemedText style={styles.email}>
          メールアドレス: {profile?.email}
        </ThemedText>

        <Formik
          initialValues={initialValues}
          validationSchema={ProfileSchema}
          enableReinitialize
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              await updateProfile({
                name: values.name,
                x_url: values.x_url,
              });
              if (values.newPassword) {
                await changePassword(values.currentPassword, values.newPassword);
              }
              setSnackbarMessage('プロフィールを更新しました');
              setSnackbarVisible(true);
              setSubmitting(false);
              resetForm({ values: { ...values, currentPassword: '', newPassword: '', confirmPassword: '' } });
            } catch (e: any) {
              setSnackbarMessage(e?.message || 'プロフィールの更新に失敗しました');
              setSnackbarVisible(true);
              setSubmitting(false);
            }
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, dirty }) => (
            <View>
              <ThemedText type="subtitle" style={styles.sectionTitle}>ユーザー名</ThemedText>
              <TextInput
                label="ユーザー名"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                mode="outlined"
                style={styles.input}
                error={touched.name && Boolean(errors.name)}
              />
              {touched.name && errors.name && (
                <ThemedText style={styles.errorText}>{errors.name}</ThemedText>
              )}

              <Divider style={styles.divider} />

              <ThemedText type="subtitle" style={styles.sectionTitle}>X(Twitter)設定</ThemedText>
              <TextInput
                label="X(Twitter)URL"
                value={values.x_url || ''}
                onChangeText={handleChange('x_url')}
                onBlur={handleBlur('x_url')}
                mode="outlined"
                style={styles.input}
                error={touched.x_url && Boolean(errors.x_url)}
                placeholder="https://x.com/username"
              />
              {touched.x_url && errors.x_url && (
                <ThemedText style={styles.errorText}>{errors.x_url}</ThemedText>
              )}

              <Divider style={styles.divider} />

              <ThemedText type="subtitle" style={styles.sectionTitle}>パスワード変更</ThemedText>
              <TextInput
                label="現在のパスワード"
                value={values.currentPassword}
                onChangeText={handleChange('currentPassword')}
                onBlur={handleBlur('currentPassword')}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                error={touched.currentPassword && Boolean(errors.currentPassword)}
              />
              {touched.currentPassword && errors.currentPassword && (
                <ThemedText style={styles.errorText}>{errors.currentPassword}</ThemedText>
              )}
              <TextInput
                label="新しいパスワード"
                value={values.newPassword}
                onChangeText={handleChange('newPassword')}
                onBlur={handleBlur('newPassword')}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                error={touched.newPassword && Boolean(errors.newPassword)}
              />
              {touched.newPassword && errors.newPassword && (
                <ThemedText style={styles.errorText}>{errors.newPassword}</ThemedText>
              )}
              <TextInput
                label="新しいパスワード（確認）"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                error={touched.confirmPassword && Boolean(errors.confirmPassword)}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
              )}

              <Button
                mode="contained"
                buttonColor="#800020"
                textColor="#FFF"
                onPress={() => handleSubmit()}
                loading={isSubmitting || loading}
                disabled={isSubmitting || loading || !dirty}
                style={styles.saveButton}
              >
                一括保存
              </Button>
            </View>
          )}
        </Formik>

        <Divider style={styles.divider} />
        <ThemedText type="subtitle" style={styles.sectionTitle}>言語設定</ThemedText>
        <RadioButton.Group
          onValueChange={value => handleLanguageChange(Number(value))}
          value={String(language)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <RadioButton value="0" disabled={languageUpdating} />
            <ThemedText>日本語</ThemedText>
            <RadioButton value="1" disabled={languageUpdating} style={{ marginLeft: 16 }} />
            <ThemedText>English</ThemedText>
          </View>
        </RadioButton.Group>

        <Divider style={styles.divider} />

        {/* テーマ設定：一時的に非表示 */}
        {false && (
          <View style={styles.themeSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>テーマ設定</ThemedText>
            <View style={styles.themeRow}>
              <ThemedText style={styles.themeLabel}>ダークモード (ON/OFF)</ThemedText>
              <Switch
                value={profile?.theme_preference === 'dark'}
                onValueChange={handleThemeToggle}
                disabled={themeUpdating || loading}
              />
            </View>
          </View>
        )}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: '閉じる',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
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
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    marginBottom: 8,
  },
  themeSection: {
    marginTop: 32,
    marginBottom: 16,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  themeLabel: {
    fontSize: 16,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 8,
  },
});
