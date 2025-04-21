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
  loading?: boolean;
  icon?: string;
  color?: string;
  compact?: boolean;
}

// カウンタータイプごとの表示名とデフォルトアイコン
const counterConfig = {
  approached: {
    label: '声かけ数',
    icon: 'microphone',
    color: '#800020', // バーガンディレッド
  },
  getContact: {
    label: '連絡先ゲット数',
    icon: 'contacts',
    color: '#800020', // バーガンディレッド
  },
  instantDate: {
    label: '即日デート数',
    icon: 'calendar-clock',
    color: '#800020', // バーガンディレッド
  },
  instantCv: {
    label: '即(sex)数',
    icon: 'heart',
    color: '#800020', // バーガンディレッド
  },
};

export function CounterButton({
  type,
  count,
  onIncrement,
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

      <ThemedText
        style={styles.count}
        lightColor="#FFFFFF"
        darkColor="#FFFFFF"
      >
        {count}
      </ThemedText>
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
  },
  compactButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
