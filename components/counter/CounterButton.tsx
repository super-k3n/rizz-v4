import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export type CounterType = 'approached' | 'getContact' | 'instantDate' | 'instantCv';

export interface CounterButtonProps {
  type: CounterType;
  count: number;
  onIncrement: () => void;
  onDecrement?: () => void;
  loading?: boolean;
  icon?: string;
  color?: string;
  compact?: boolean;
}

// カウンタータイプごとの表示名とデフォルトアイコン
const counterConfig = {
  approached: {
    label: '声かけ数',
    icon: 'plus',
    color: '#800020', // バーガンディレッド
  },
  getContact: {
    label: '連絡先ゲット数',
    icon: 'plus',
    color: '#800020', // バーガンディレッド
  },
  instantDate: {
    label: '即日デート数',
    icon: 'plus',
    color: '#800020', // バーガンディレッド
  },
  instantCv: {
    label: '即(sex)数',
    icon: 'plus',
    color: '#800020', // バーガンディレッド
  },
};

export function CounterButton({
  type,
  count,
  onIncrement,
  onDecrement,
  loading = false,
  icon,
  color,
  compact = false,
}: CounterButtonProps) {
  const config = counterConfig[type];
  const iconName = icon || config.icon;
  const buttonColor = color || config.color;

  if (compact) {
    return (
      <ThemedView style={styles.compactContainer}>
        <TouchableOpacity
          style={[styles.compactButton, { backgroundColor: buttonColor }]}
          onPress={onDecrement}
          disabled={loading || !onDecrement || count <= 0}
          activeOpacity={0.7}
          accessibilityLabel={`${config.label}を減らす`}
          accessibilityHint="タップすると数値が1減ります"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="minus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.compactButton, { backgroundColor: buttonColor }]}
          onPress={onIncrement}
          disabled={loading}
          activeOpacity={0.7}
          accessibilityLabel={`${config.label}を増やす`}
          accessibilityHint="タップすると数値が1増えます"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size={18} />
          ) : (
            <MaterialCommunityIcons name={iconName as any} size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText
        style={styles.label}
        lightColor="#FFFFFF"
        darkColor="#FFFFFF"
      >
        {config.label}
      </ThemedText>
      <ThemedView style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonColor }]}
          onPress={onDecrement}
          disabled={loading || !onDecrement || count <= 0}
          activeOpacity={0.7}
          accessibilityLabel={`${config.label}を減らす`}
          accessibilityHint="タップすると数値が1減ります"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="minus" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText
          style={styles.count}
          lightColor="#FFFFFF"
          darkColor="#FFFFFF"
        >
          {count}
        </ThemedText>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonColor }]}
          onPress={onIncrement}
          disabled={loading}
          activeOpacity={0.7}
          accessibilityLabel={`${config.label}を増やす`}
          accessibilityHint="タップすると数値が1増えます"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size={24} />
          ) : (
            <MaterialCommunityIcons name={iconName as any} size={32} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  count: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 32,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
