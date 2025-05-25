import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Divider, Button, TextInput, Snackbar, Switch, RadioButton } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ThemedText } from '../ThemedText';
import { useProfile } from '@/contexts/ProfileContext';
import * as Updates from 'expo-updates';
import { useTranslation } from 'react-i18next';
import i18n from '../../src/libs/i18n';

export const ProfileSettings: React.FC = () => {
  const { profile, updateProfile, changePassword, updateTheme, loading, error } = useProfile();
  // profile?.languageがnullの場合にデフォルト値0(日本語)を設定
  const [language, setLanguage] = useState(profile?.language ?? 0);
  // profileが更新されたらlanguage stateも更新
  React.useEffect(() => {
    setLanguage(profile?.language ?? 0);
  }, [profile?.language]);


  const { t } = useTranslation();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [themeUpdating, setThemeUpdating] = useState(false);
  const [languageUpdating, setLanguageUpdating] = useState(false);

  // 初回ロード時、またはprofileがまだロードされていない場合はローディング表示
  if (loading && !profile) {
    return (
      <View style={styles.container}>
        <ThemedText>{t('loading')}</ThemedText>
      </View>
    );
  }

  // デバッグ用: 現在のi18n.languageとprofile.languageを出力
  console.log('i18n.language:', i18n.language, 'profile.language:', profile?.language);

  // ProfileSchemaの定義をuseMemoでラップし、言語切り替え時に再生成されるようにする
  // tを依存配列に入れることで、言語切り替え時にバリデーションメッセージも更新される
  const ProfileSchema = useMemo(() => Yup.object().shape({
    name: Yup.string()
      .required(t('username_required'))
      .min(2, t('username_min'))
      .max(30, t('username_max')),
    x_url: Yup.string()
      .nullable()
      .test(
        'is-valid-url',
        t('url_invalid'),
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
        t('x_url_invalid'),
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
        then: (schema) => schema.required(t('current_password_required')),
        otherwise: (schema) => schema,
      }),
    newPassword: Yup.string()
      .test('empty-or-strong', t('new_password_rule'), (value) => {
        if (!value) return true;
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
      }),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), ''], t('passwords_must_match')),
  }), [t]); // tを依存配列に入れる

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
      setSnackbarMessage(t('theme_change_success'));
      setSnackbarVisible(true);
      // 変更が反映されるようにリロード
      setTimeout(async () => {
        await Updates.reloadAsync();
      }, 500);
    } catch (e: any) {
      setSnackbarMessage(t('theme_change_failed'));
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
      setLanguage(value); // UIのラジオボタンの状態を更新
      await updateProfile({ language: value }); // DBを更新

      // ★ここが修正点1: i18nライブラリの言語をここで切り替える
      const newLangCode = value === 0 ? 'ja' : 'en';
      await i18n.changeLanguage(newLangCode); // i18nの言語を更新

      setSnackbarMessage(t('language_change_success'));
      setSnackbarVisible(true);
      setTimeout(async () => {
        await Updates.reloadAsync(); // アプリ全体に反映するためリロード
      }, 500);
    } catch (e: any) {
      setSnackbarMessage(t('language_change_failed'));
      setSnackbarVisible(true);
    } finally {
      setLanguageUpdating(false);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.errorText}>
          {t('error_occurred')}: {error.message}
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          {t('profile_settings')}
        </ThemedText>
        <ThemedText style={styles.email}>
          {t('email')}: {profile?.email}
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
              setSnackbarMessage(t('profile_update_success'));
              setSnackbarVisible(true);
              setSubmitting(false);
              resetForm({ values: { ...values, currentPassword: '', newPassword: '', confirmPassword: '' } });
            } catch (e: any) {
              setSnackbarMessage(e?.message || t('profile_update_failed'));
              setSnackbarVisible(true);
              setSubmitting(false);
            }
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, dirty }) => (
            <View>
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('username')}</ThemedText>
              <TextInput
                label={t('username')}
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

              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('x_twitter_settings')}</ThemedText>
              <TextInput
                label={t('x_twitter_url')}
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

              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('change_password')}</ThemedText>
              <TextInput
                label={t('current_password')}
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
                label={t('new_password')}
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
                label={t('confirm_new_password')}
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
                {t('save_all')}
              </Button>
            </View>
          )}
        </Formik>

        <Divider style={styles.divider} />
        <ThemedText type="subtitle" style={styles.sectionTitle}>{t('language_settings')}</ThemedText>
        <RadioButton.Group
          onValueChange={value => handleLanguageChange(Number(value))}
          value={String(language)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <RadioButton value="0" disabled={languageUpdating} />
            <ThemedText>{t('japanese')}</ThemedText>
            <View style={{ marginLeft: 16 }}>
              <RadioButton value="1" disabled={languageUpdating} />
            </View>
            <ThemedText>{t('english')}</ThemedText>
          </View>
        </RadioButton.Group>

        <Divider style={styles.divider} />

        {/* テーマ設定：一時的に非表示 */}
        {false && (
          <View style={styles.themeSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>{t('theme_settings')}</ThemedText>
            <View style={styles.themeRow}>
              <ThemedText style={styles.themeLabel}>{t('dark_mode')}</ThemedText>
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
            label: t('close'),
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
