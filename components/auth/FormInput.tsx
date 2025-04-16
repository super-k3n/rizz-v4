import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  disabled?: boolean;
  right?: React.ReactNode;
}

function FormInput({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  touched,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  disabled = false,
  right,
}: FormInputProps) {
  const showError = touched && !!error;

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        error={showError}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        disabled={disabled}
        style={styles.input}
        accessible={true}
        accessibilityLabel={label}
        accessibilityHint={placeholder}
        accessibilityState={{ disabled }}
        right={right}
      />
      {showError && (
        <HelperText
          type="error"
          style={styles.errorText}
          accessible={true}
          accessibilityRole="alert"
        >
          {error}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  errorText: {
    marginTop: 4,
  },
});

export default FormInput;
