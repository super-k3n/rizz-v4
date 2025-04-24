import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, TextInput, Snackbar } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ThemedText } from '../ThemedText';
import { useProfile } from '@/contexts/ProfileContext';

const UsernameSchema = Yup.object().shape({
  name: Yup.string()
    .required('ユーザー名は必須です')
    .min(2, 'ユーザー名は2文字以上で入力してください')
    .max(30, 'ユーザー名は30文字以内で入力してください'),
});

export const UsernameForm: React.FC = () => {
  const { profile, updateProfile, loading } = useProfile();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSubmit = async (values: { name: string }) => {
    try {
      await updateProfile({ name: values.name });
      setSnackbarMessage('ユーザー名を更新しました');
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('ユーザー名の更新に失敗しました');
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        ユーザー名設定
      </ThemedText>

      <Formik
        initialValues={{ name: profile?.name || '' }}
        validationSchema={UsernameSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
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

            <Button
              mode="contained"
              buttonColor="#800020"
              textColor='#FFF'
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
  input: {
    marginBottom: 8,
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
