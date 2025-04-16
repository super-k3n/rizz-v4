import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface FormButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  mode?: 'text' | 'outlined' | 'contained';
  style?: object;
}

function FormButton({
  onPress,
  title,
  loading = false,
  disabled = false,
  mode = 'contained',
  style,
}: FormButtonProps) {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={loading || disabled}
      style={[styles.button, style]}
      labelStyle={styles.buttonLabel}
      accessible={true}
      accessibilityLabel={title}
      accessibilityState={{ disabled: loading || disabled }}
    >
      {title}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
    marginTop: 16,
  },
  buttonLabel: {
    fontSize: 16,
    paddingVertical: 6,
  },
});

export default FormButton;
