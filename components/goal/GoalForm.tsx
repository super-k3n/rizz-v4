import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { PeriodSelector } from '@/components/goal/PeriodSelector';
import { NumericInput } from '@/components/goal/NumericInput';
import { PeriodType } from '@/contexts/CounterContext';

// GoalValuesの型定義
export type GoalValues = {
  period: PeriodType;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
};

interface GoalFormProps {
  initialValues: GoalValues;
  onSubmit: (values: GoalValues) => void;
  onCancel: () => void;
  onPeriodChange?: (period: PeriodType) => void;
  loading?: boolean;
}

export function GoalForm({
  initialValues,
  onSubmit,
  onCancel,
  onPeriodChange,
  loading = false
}: GoalFormProps) {
  const [values, setValues] = useState<GoalValues>(initialValues);

  // initialValuesが変更されたらvaluesを更新
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handlePeriodChange = (period: PeriodType) => {
    setValues(prev => ({ ...prev, period }));
    // 親コンポーネントに期間変更を通知
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  };

  const handleValueChange = (field: keyof Omit<GoalValues, 'period'>, value: number) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(values);
  };

  // 各カウンターの最大値を定義
  const maxValues = {
    approached: 1000,
    getContact: 500,
    instantDate: 100,
    instantCv: 50,
  };

  return (
    <ThemedView style={styles.container}>
      <PeriodSelector
        value={values.period}
        onChange={handlePeriodChange}
      />

      <ThemedView style={styles.inputsContainer}>
        <ThemedText
          type="subtitle"
          lightColor="#C09E5C"
          darkColor="#C09E5C"
          style={styles.sectionTitle}
        >
          {values.period === 'daily' ? '日次' :
           values.period === 'weekly' ? '週次' :
           values.period === 'monthly' ? '月次' : '年次'}目標
        </ThemedText>

        <NumericInput
          label="声かけ数"
          value={values.approached}
          onChange={(value: number) => handleValueChange('approached', value)}
          min={0}
          max={maxValues.approached}
          icon="microphone"
        />

        <NumericInput
          label="連絡先確保数"
          value={values.getContact}
          onChange={(value: number) => handleValueChange('getContact', value)}
          min={0}
          max={maxValues.getContact}
          icon="contacts"
        />

        <NumericInput
          label="連れ出し数"
          value={values.instantDate}
          onChange={(value: number) => handleValueChange('instantDate', value)}
          min={0}
          max={maxValues.instantDate}
          icon="calendar-clock"
        />

        <NumericInput
          label="sex数"
          value={values.instantCv}
          onChange={(value: number) => handleValueChange('instantCv', value)}
          min={0}
          max={maxValues.instantCv}
          icon="heart"
        />
      </ThemedView>

      <ThemedView style={styles.buttonsContainer}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.cancelButton}
          disabled={loading}
        >
          キャンセル
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.saveButton}
          loading={loading}
          disabled={loading}
        >
          保存
        </Button>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  inputsContainer: {
    gap: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#800020', // バーガンディレッド
  },
  cancelButton: {
    flex: 1,
    borderColor: '#800020', // バーガンディレッド
  },
});
