import React, { useState } from 'react';
import { StyleSheet, View, Linking } from 'react-native';
import { Button, TextInput, Snackbar, IconButton } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ThemedText } from '../ThemedText';
import { useProfile } from '@/contexts/ProfileContext';

const XUrlSchema = Yup.object().shape({
  x_url: Yup.string()
    .nullable()
    .test(
      'is-valid-url',
      'URLの形式が正しくありません',
      (value) => {
        if (!value) return true; // 空の場合は検証をスキップ
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
        if (!value) return true; // 空の場合は検証をスキップ
        try {
          const url = new URL(value);
          return url.hostname === 'twitter.com' || 
                 url.hostname === 'www.twitter.com' || 
                 url.hostname === 'x.com' || 
                 url.hostname === 'www.x.com';
        } catch (e) {
          return false;
        }
      }
    ),
});

export const XUrlForm: React.FC = () => {
  const { profile, updateProfile, loading } = useProfile();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSubmit = async (values: { x_url: string | null }) => {
    try {
      await updateProfile({ x_url: values.x_url });
      setSnackbarMessage('X(Twitter)URLを更新しました');
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('X(Twitter)URLの更新に失敗しました');
      setSnackbarVisible(true);
    }
  };

  const openUrl = (url: string | null) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        X(Twitter)設定
      </ThemedText>
      
      <Formik
        initialValues={{ x_url: profile?.x_url || '' }}
        validationSchema={XUrlSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
            <View style={styles.inputContainer}>
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
              {values.x_url && (
                <IconButton
                  icon="open-in-new"
                  onPress={() => openUrl(values.x_url)}
                  style={styles.linkButton}
                />
              )}
            </View>
            
            {touched.x_url && errors.x_url && (
              <ThemedText style={styles.errorText}>{errors.x_url}</ThemedText>
            )}
            
            <Button 
              mode="contained"
              onPress={() => handleSubmit()}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              保存
            </Button>
          </View>
        )}
      </Formik>
      
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
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginBottom: 8,
  },
  linkButton: {
    marginLeft: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
    fontSize: 12,
  },
  button: {
    marginTop: 16,
  },
});
