import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CounterType } from './CounterButton';

export interface ProgressDisplayProps {
  type: CounterType;
  current: number;
  target: number;
  color?: string;
  showLabel?: boolean;
}

// カウンタータイプごとの表示名
const counterLabels = {
  approached: '声かけ数',
  getContact: '連絡先ゲット数',
  instantDate: '即日デート数',
  instantCv: '即(sex)数',
};

export function ProgressDisplay({
  type,
  current,
  target,
  color,
  showLabel = true,
}: ProgressDisplayProps) {
  // 進捗率を計算（0〜100%）
  const progress = Math.min(current / (target || 1), 1) * 100;
  const label = counterLabels[type];

  return (
    <ThemedView style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <ThemedText
            style={styles.label}
            lightColor="#FFFFFF"
            darkColor="#FFFFFF"
          >
            {label}
          </ThemedText>
          <ThemedText
            style={styles.values}
            lightColor="#FFFFFF"
            darkColor="#FFFFFF"
          >
            {current} / {target}
          </ThemedText>
        </View>
      )}

      <View style={styles.progressBarContainer}>
        <LinearGradient
          colors={['#0A0F23', '#1A2342', '#D4AF37']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.progressBar,
            { width: `${progress}%` },
          ]}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  values: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
});
