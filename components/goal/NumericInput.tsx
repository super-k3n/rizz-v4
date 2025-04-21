import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface NumericInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icon?: string;
}

export function NumericInput({
  label,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  icon,
}: NumericInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleTextChange = (text: string) => {
    // 入力値が数値でない場合は更新しない
    if (!/^\d*$/.test(text)) {
      return;
    }

    setInputValue(text);

    // 空の場合は0として扱う
    const numValue = text === '' ? 0 : parseInt(text, 10);
    if (numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      const newValue = value + 1;
      setInputValue(newValue.toString());
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      const newValue = value - 1;
      setInputValue(newValue.toString());
      onChange(newValue);
    }
  };

  // 入力フィールドのフォーカスが外れたときに値を検証
  const handleBlur = () => {
    let numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) {
      numValue = 0;
    }

    // 範囲外の値を境界値に修正
    if (numValue < min) {
      numValue = min;
    } else if (numValue > max) {
      numValue = max;
    }

    setInputValue(numValue.toString());
    onChange(numValue);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.labelContainer}>
        {icon && (
          <IconButton icon={icon as any} size={20} style={styles.icon} iconColor="#C09E5C" />
        )}
        <ThemedText style={styles.label}>{label}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.inputContainer}>
        <IconButton
          icon="minus"
          size={20}
          onPress={handleDecrement}
          disabled={value <= min}
          style={styles.button}
        />

        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          keyboardType="numeric"
          maxLength={5}
          mode="outlined"
          dense
          activeOutlineColor="#800020" // バーガンディレッド
        />

        <IconButton
          icon="plus"
          size={20}
          onPress={handleIncrement}
          disabled={value >= max}
          style={styles.button}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    margin: 0,
    padding: 0,
  },
  label: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    textAlign: 'center',
    height: 40,
    backgroundColor: 'transparent',
  },
  button: {
    margin: 0,
  },
});
