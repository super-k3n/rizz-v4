import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { IconButton } from 'react-native-paper';
import FormInput from './FormInput';
import FormButton from './FormButton';

interface SignupFormValues {
  email: string;
  name: string;
  password: string;
}

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => void;
  isLoading?: boolean;
}

// バリデーションスキーマ
const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('有効なメールアドレスを入力してください')
    .required('メールアドレスは必須です'),
  name: Yup.string()
    .min(2, 'ユーザーネームは2文字以上必要です')
    .max(30, 'ユーザーネームは30文字以内である必要があります')
    .required('ユーザーネームは必須です'),
  password: Yup.string()
    .min(8, 'パスワードは8文字以上必要です')
    .matches(/[a-zA-Z]/, 'パスワードには英字を含める必要があります')
    .matches(/[0-9]/, 'パスワードには数字を含める必要があります')
    .required('パスワードは必須です'),
});

// 初期値
const initialValues: SignupFormValues = {
  email: '',
  name: '',
  password: '',
};

function SignupForm({ onSubmit, isLoading = false }: SignupFormProps) {
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
            label="ユーザーネーム"
            value={values.name}
            onChangeText={handleChange('name')}
            onBlur={handleBlur('name')}
            error={errors.name}
            touched={touched.name}
            placeholder="ユーザーネームを入力"
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
            title="アカウント作成"
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

export default SignupForm;
