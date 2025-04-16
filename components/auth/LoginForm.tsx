import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { IconButton } from 'react-native-paper';
import FormInput from './FormInput';
import FormButton from './FormButton';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void;
  isLoading?: boolean;
}

// バリデーションスキーマ
const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('有効なメールアドレスを入力してください')
    .required('メールアドレスは必須です'),
  password: Yup.string()
    .min(8, 'パスワードは8文字以上必要です')
    .required('パスワードは必須です'),
});

// 初期値
const initialValues: LoginFormValues = {
  email: '',
  password: '',
};

function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
        <View style={styles.container}>
          <FormInput
            label="メールアドレス"
            value={values.email}
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
            error={errors.email}
            touched={touched.email}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="example@email.com"
          />

          <FormInput
            label="パスワード"
            value={values.password}
            onChangeText={handleChange('password')}
            onBlur={handleBlur('password')}
            error={errors.password}
            touched={touched.password}
            secureTextEntry={!showPassword}
            placeholder="パスワードを入力"
            right={
              <IconButton
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={togglePasswordVisibility}
                size={20}
              />
            }
          />

          <FormButton
            title="ログイン"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>
      )}
    </Formik>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default LoginForm;
