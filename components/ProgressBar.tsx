import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRecord } from '../contexts/RecordContext';
import { useGoal } from '../contexts/GoalContext';
import { PeriodType } from '../lib/types/record';
import { getStartDateByPeriod } from '../lib/utils/date';

interface ProgressBarProps {
  period: PeriodType;
  type: 'approached' | 'getContact' | 'instantDate' | 'instantCv';
  label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ period, type, label }) => {
  const { getRecordsByPeriod } = useRecord();
  const { getGoal } = useGoal();

  const progress = useMemo(() => {
    const startDate = getStartDateByPeriod(period, new Date());
    const record = getRecordsByPeriod(period, startDate);
    const goal = getGoal(period);

    const current = record[type];
    const target = goal[type];

    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  }, [period, type, getRecordsByPeriod, getGoal]);

  const record = useMemo(() => {
    const startDate = getStartDateByPeriod(period, new Date());
    return getRecordsByPeriod(period, startDate);
  }, [period, getRecordsByPeriod]);

  const goal = useMemo(() => {
    return getGoal(period);
  }, [period, getGoal]);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {record[type]} / {goal[type]}
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <LinearGradient
          colors={['#4CAF50', '#8BC34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progress, { width: `${progress}%` }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
});
