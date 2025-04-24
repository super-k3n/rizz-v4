import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, TextInput, Snackbar } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ThemedText } from '../ThemedText';
import { useProfile } from '@/contexts/ProfileContext';

const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('現在のパスワードは必須です'),
  newPassword: Yup.string()
    .required('新しいパスワードは必須です')
    .min(8, 'パスワードは8文字以上で入力してください')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'パスワードには大文字、小文字、数字、特殊文字を含める必要があります'
    ),
  confirmPassword: Yup.string()
    .required('パスワードの確認は必須です')
    .oneOf([Yup.ref('newPassword')], 'パスワードが一致しません'),
});

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const PasswordForm: React.FC = () => {
  const { changePassword, loading } = useProfile();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (values: PasswordFormValues, { resetForm }: any) => {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      setSnackbarMessage('パスワードを変更しました');
      setSnackbarVisible(true);
      resetForm();
    } catch (error) {
      if (error instanceof Error) {
        setSnackbarMessage(error.message || 'パスワード変更に失敗しました');
      } else {
        setSnackbarMessage('パスワード変更に失敗しました');
      }
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        パスワード変更
      </ThemedText>

      <Formik
        initialValues={{
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }}
        validationSchema={PasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
            <TextInput
              label="現在のパスワード"
              value={values.currentPassword}
              onChangeText={handleChange('currentPassword')}
              onBlur={handleBlur('currentPassword')}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showCurrentPassword}
              error={touched.currentPassword && Boolean(errors.currentPassword)}
              right={
                <TextInput.Icon
                  icon={showCurrentPassword ? "eye-off" : "eye"}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                />
              }
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
              secureTextEntry={!showNewPassword}
              error={touched.newPassword && Boolean(errors.newPassword)}
              right={
                <TextInput.Icon
                  icon={showNewPassword ? "eye-off" : "eye"}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                />
              }
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
              secureTextEntry={!showConfirmPassword}
              error={touched.confirmPassword && Boolean(errors.confirmPassword)}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
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
              パスワードを変更
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
