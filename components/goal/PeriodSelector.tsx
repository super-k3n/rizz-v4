import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PeriodType } from '@/contexts/CounterContext';

interface PeriodSelectorProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText
        style={styles.label}
        lightColor="#C09E5C"
        darkColor="#C09E5C"
      >
        目標設定期間
      </ThemedText>

      <SegmentedButtons
        value={value}
        onValueChange={(newValue) => onChange(newValue as PeriodType)}
        buttons={[
          {
            value: 'daily',
            label: '日次',
            style: value === 'daily' ? styles.selectedButton : styles.button,
          },
          {
            value: 'weekly',
            label: '週次',
            style: value === 'weekly' ? styles.selectedButton : styles.button,
          },
          {
            value: 'monthly',
            label: '月次',
            style: value === 'monthly' ? styles.selectedButton : styles.button,
          },
          {
            value: 'yearly',
            label: '年次',
            style: value === 'yearly' ? styles.selectedButton : styles.button,
          },
        ]}
        style={styles.segmentedButtons}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  button: {
    borderColor: '#800020', // バーガンディレッド
  },
  selectedButton: {
    backgroundColor: '#800020', // バーガンディレッド
  },
});
