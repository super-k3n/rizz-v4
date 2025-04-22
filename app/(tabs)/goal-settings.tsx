import { StyleSheet, Alert, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { GoalForm, GoalValues } from '@/components/goal/GoalForm';
import { useCounter } from '@/contexts/CounterContext';
import { router } from 'expo-router';
import { useState } from 'react';

export default function GoalSettingsScreen() {
  const { targets, periodicTargets, currentPeriod, updateTargets, changePeriod } = useCounter();
  const [loading, setLoading] = useState(false);

  // 初期値を設定
  const initialValues = {
    period: currentPeriod,
    approached: targets.approached,
    getContact: targets.getContact,
    instantDate: targets.instantDate,
    instantCv: targets.instantCv,
  };

  // 目標設定の保存処理
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const result = await updateTargets(values.period, {
        approached: values.approached,
        getContact: values.getContact,
        instantDate: values.instantDate,
        instantCv: values.instantCv,
      });

      if (result.success) {
        Alert.alert('成功', '目標設定を保存しました');
        router.back();
      } else {
        Alert.alert('エラー', '目標設定の保存に失敗しました');
      }
    } catch (error) {
      console.error('目標設定エラー:', error);
      Alert.alert('エラー', '目標設定の保存中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    router.back();
  };

  // 期間変更処理
  const handlePeriodChange = (period: string) => {
    changePeriod(period as any);
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          目標設定
        </ThemedText>
        <ThemedText style={styles.description}>
          日、週、月、年ごとの目標を設定できます。
        </ThemedText>

        <GoalForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onPeriodChange={handlePeriodChange}
          loading={loading}
        />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
});
