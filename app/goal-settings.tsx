import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { GoalForm } from '@/components/goal/GoalForm';
import { useCounter, PeriodType } from '@/hooks/useCounter';

export type GoalValues = {
  period: PeriodType;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
};

export default function GoalSettingsScreen() {
  const { targets, periodicTargets, currentPeriod, changePeriod, updateTargets } = useCounter();
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(currentPeriod);

  // 初期値の設定
  const getInitialValues = (): GoalValues => {
    return {
      period: selectedPeriod,
      approached: periodicTargets[selectedPeriod].approached,
      getContact: periodicTargets[selectedPeriod].getContact,
      instantDate: periodicTargets[selectedPeriod].instantDate,
      instantCv: periodicTargets[selectedPeriod].instantCv,
    };
  };

  const [initialValues, setInitialValues] = useState<GoalValues>(getInitialValues());

  // 期間が変更されたら初期値を更新
  useEffect(() => {
    setInitialValues(getInitialValues());
  }, [selectedPeriod]);

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
    changePeriod(period);
  };

  const handleSubmit = async (values: GoalValues) => {
    setLoading(true);
    try {
      // 実際のアプリではここでSupabaseに保存する処理を追加
      // 今はローカルステートを更新するのみ
      const result = await updateTargets(values.period, {
        approached: values.approached,
        getContact: values.getContact,
        instantDate: values.instantDate,
        instantCv: values.instantCv,
      });

      if (result.success) {
        // 保存成功メッセージを表示
        setSnackbarVisible(true);
        setErrorMessage(null);

        // 1.5秒後にホーム画面に戻る
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        setErrorMessage('保存に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('目標設定エラー:', error);
      setErrorMessage('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <ThemedView style={styles.content}>
          <ThemedText
            type="title"
            style={styles.title}
            lightColor="#C09E5C"
            darkColor="#C09E5C"
          >
            目標設定
          </ThemedText>

          <ThemedText style={styles.description}>
            期間ごとの目標値を設定してください。設定した目標はプログレスバーに反映されます。
          </ThemedText>

          <GoalForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            onPeriodChange={handlePeriodChange}
          />

          {errorMessage && (
            <ThemedView style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
        style={styles.snackbar}
      >
        目標の変更が完了しました
      </Snackbar>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(220, 50, 50, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3232',
  },
  errorText: {
    color: '#DC3232',
  },
  snackbar: {
    backgroundColor: '#0A0F23', // リッチブラック
    borderLeftWidth: 4,
    borderLeftColor: '#C09E5C', // アンティークゴールド
  },
});
