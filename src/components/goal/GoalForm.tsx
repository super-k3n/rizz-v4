import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput, SegmentedButtons, HelperText } from 'react-native-paper';
import { PeriodType } from '../../types/goal';
import { useCounter } from '@/contexts/CounterContext';

interface GoalFormProps {
  initialPeriod?: PeriodType;
}

const GoalForm: React.FC<GoalFormProps> = ({ initialPeriod = 'daily' }) => {
  const { periodicTargets, updateTargets, loading: ctxLoading } = useCounter();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(initialPeriod);
  const [approached, setApproached] = useState('0');
  const [getContact, setGetContact] = useState('0');
  const [instantDate, setInstantDate] = useState('0');
  const [instantCv, setInstantCv] = useState('0');
  const [loading, setLoading] = useState(false);

  // 選択された期間が変わったら、フォームの値を更新
  useEffect(() => {
    const currentGoal = periodicTargets[selectedPeriod];
    if (currentGoal) {
      setApproached(currentGoal.approached.toString());
      setGetContact(currentGoal.getContact.toString());
      setInstantDate(currentGoal.instantDate.toString());
      setInstantCv(currentGoal.instantCv.toString());
    }
  }, [selectedPeriod, periodicTargets]);

  // 数値入力のバリデーション
  const validateNumber = (value: string) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 0;
  };

  // フォーム送信処理
  const handleSubmit = async () => {
    // 入力値のバリデーション
    if (!validateNumber(approached) ||
        !validateNumber(getContact) ||
        !validateNumber(instantDate) ||
        !validateNumber(instantCv)) {
      Alert.alert('入力エラー', '有効な数値を入力してください。');
      return;
    }

    setLoading(true);
    try {
      // 目標値の更新
      const result = await updateTargets(selectedPeriod, {
        approached: parseInt(approached, 10),
        getContact: parseInt(getContact, 10),
        instantDate: parseInt(instantDate, 10),
        instantCv: parseInt(instantCv, 10),
      });

      if (result.success) {
        Alert.alert('保存完了', `${selectedPeriod === 'daily' ? '本日' : selectedPeriod}の目標値を更新しました。`);
      } else {
        const errorMessage = result.error?.message || JSON.stringify(result.error);
        Alert.alert('エラー', `目標値の更新に失敗しました: ${errorMessage}`);
      }
    } catch (error) {
      console.error('目標値更新エラー:', error);
      Alert.alert('エラー', '目標値の更新中にエラーが発生しました。ネットワーク接続を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  // 期間に応じたラベルを取得
  const getPeriodLabel = (period: PeriodType) => {
    switch (period) {
      case 'daily': return '日次';
      case 'weekly': return '週次';
      case 'monthly': return '月次';
      case 'yearly': return '年次';
      default: return period;
    }
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={selectedPeriod}
        onValueChange={value => setSelectedPeriod(value as PeriodType)}
        buttons={[
          { value: 'daily', label: '日次' },
          { value: 'weekly', label: '週次' },
          { value: 'monthly', label: '月次' },
          { value: 'yearly', label: '年次' },
        ]}
        style={styles.segmentedButtons}
        theme={{
          colors: {
            secondaryContainer: '#800020',
            onSecondaryContainer: '#FFF',
          },
        }}
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>声かけ数</Text>
        <TextInput
          mode="outlined"
          value={approached}
          onChangeText={setApproached}
          keyboardType="numeric"
          error={!validateNumber(approached)}
          style={styles.input}
          textColor='#0A0F23'
        />
        {!validateNumber(approached) && (
          <HelperText type="error">有効な数値を入力してください</HelperText>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>連絡先取得数</Text>
        <TextInput
          mode="outlined"
          value={getContact}
          onChangeText={setGetContact}
          keyboardType="numeric"
          error={!validateNumber(getContact)}
          style={styles.input}
        />
        {!validateNumber(getContact) && (
          <HelperText type="error">有効な数値を入力してください</HelperText>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>即日デート数</Text>
        <TextInput
          mode="outlined"
          value={instantDate}
          onChangeText={setInstantDate}
          keyboardType="numeric"
          error={!validateNumber(instantDate)}
          style={styles.input}
        />
        {!validateNumber(instantDate) && (
          <HelperText type="error">有効な数値を入力してください</HelperText>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>即数（sex）</Text>
        <TextInput
          mode="outlined"
          value={instantCv}
          onChangeText={setInstantCv}
          keyboardType="numeric"
          error={!validateNumber(instantCv)}
          style={styles.input}
        />
        {!validateNumber(instantCv) && (
          <HelperText type="error">有効な数値を入力してください</HelperText>
        )}
      </View>

      <Button
        mode="contained"
        buttonColor="#800020"
        textColor='#FFF'
        onPress={handleSubmit}
        loading={loading || ctxLoading.approached}
        disabled={loading || ctxLoading.approached}
        style={styles.button}
      >
        {`${getPeriodLabel(selectedPeriod)}の目標を保存`}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ddd',
  },
  button: {
    marginTop: 24,
    padding: 4,
  },
  offlineContainer: {
    backgroundColor: '#ffcccc',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  offlineText: {
    color: '#cc0000',
    textAlign: 'center',
  },
});

export default GoalForm;
