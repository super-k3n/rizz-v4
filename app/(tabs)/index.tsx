import { Image, StyleSheet, Alert, View } from 'react-native';
import { Button } from 'react-native-paper';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import type { CounterType } from '@/lib/types/record';
import { useTranslation } from 'react-i18next';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CounterButton } from '@/components/counter/CounterButton';
import { ProgressDisplay } from '@/components/counter/ProgressDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { useCounter } from '@/contexts/CounterContext';
import { useRecord } from '@/contexts/RecordContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useGoal } from '@/contexts/GoalContext';
import { debugAuthAndProfile } from '@/services/auth-debug';
import { resetCounters } from '@/services/reset-counters';

// 明示的なデフォルトエクスポート
function HomeScreen() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { counters, loading: counterLoading, resetCounters: resetCounterContext, incrementCounter, decrementCounter } = useCounter();
  const { incrementCounter: recordIncrementCounter, loading: recordLoading, error, isOnline, dailyRecords } = useRecord();
  const { getGoal, loading: goalLoading } = useGoal();
  const [targets, setTargets] = useState({
    approached: 0,
    getContact: 0,
    instantDate: 0,
    instantCv: 0,
  });
  const today = new Date();
  const { t } = useTranslation();
  const formattedDate = format(today, t('date_format', { defaultValue: 'yyyy年MM月dd日（EEEE）' }), { locale: ja });

  // 画面が表示されたとき、カウンターと目標値をリセット
  useEffect(() => {
    // 現在の日付を取得
    const today = new Date().toISOString().split('T')[0];
    console.log(`ホーム画面表示 - 現在の日付: ${today}`);

    // カウンターと目標値をリセット
    resetCounterContext();
    loadDailyGoals(today);
  }, []);

  // 日次目標を読み込む
  const loadDailyGoals = async (date: string) => {
    try {
      const goal = await getGoal('daily', date);
      if (goal) {
        setTargets({
          approached: goal.approached,
          getContact: goal.getContact,
          instantDate: goal.instantDate,
          instantCv: goal.instantCv,
        });
      }
    } catch (error) {
      console.error('Failed to load daily goals:', error);
    }
  };

  // 現在の日付を取得する関数
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // カウンターボタンのクリックハンドラ
  const handleCounterIncrement = (type: CounterType) => {
    const today = getCurrentDate();
    console.log(`カウンタークリック - タイプ: ${type}, 日付: ${today}`);
    recordIncrementCounter(type, today, 1);
  };

  // カウンターボタンのデクリメントハンドラ
  const handleCounterDecrement = (type: CounterType) => {
    const today = getCurrentDate();
    console.log(`カウンターデクリメント - タイプ: ${type}, 日付: ${today}`);
    recordIncrementCounter(type, today, -1);
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut();
      console.log(t('logout_success'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('logout_error');
      Alert.alert(t('error'), errorMessage);
    }
  };

  // 目標設定画面への遷移
  const handleGoToGoalSettings = () => {
    router.push('/goal-settings' as any);
  };

  // 実績値と目標値を両方再読み込み
  const reloadTargets = async () => {
    try {
      // 実績値（カウンター）と目標値を両方リセット
      await resetCounterContext();
      const today = getCurrentDate();
      await loadDailyGoals(today);
      Alert.alert(t('success'), t('reload_success'));
    } catch (error) {
      console.error('再読み込みエラー:', error);
      Alert.alert(t('error'), t('reload_error'));
    }
  };

  // 今日の日付
  const todayStr = getCurrentDate();
  const todayRecord = dailyRecords[todayStr] || {};

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0A0F23', dark: '#0A0F23' }}
      headerImage={
        <ThemedView style={styles.headerContent}>
          <ThemedText
            type="title"
            style={styles.headerTitle}
            lightColor="#C09E5C"
            darkColor="#C09E5C"
          >Rizz</ThemedText>
          <ThemedText
            style={styles.headerDate}
            lightColor="#0A0F23"
            darkColor="#FFFFFF"
          >
            {formattedDate}
          </ThemedText>
          <ThemedText
            style={styles.headerUserName}
            lightColor="#0A0F23"
            darkColor="#FFFFFF"
          >
            {profile?.name ? profile.name : t('greeting_guest')}
          </ThemedText>
        </ThemedView>
      }
      >
      {/* 統合カウンターセクション */}
      <ThemedView style={styles.counterSection}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText
            type="subtitle"
            lightColor="#C09E5C"
            darkColor="#C09E5C"
            style={styles.sectionTitle}
          >
            {t('today_record')}
          </ThemedText>

          <Button
            mode="text"
            onPress={handleGoToGoalSettings}
            icon="cog"
            textColor="#C09E5C"
          >
            {t('goal_settings')}
          </Button>
        </ThemedView>

        {/* 声かけ数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#0A0F23"
              darkColor="#FFFFFF"
            >
              {t('approached')}: {todayRecord.approached ?? 0} / {targets.approached}{' '}
              <ThemedText
                style={[styles.counterLabel, styles.progressText]}
                lightColor="#D4AF37"
                darkColor="#D4AF37"
              >
                ({Math.round(((todayRecord.approached ?? 0) / (targets.approached || 1)) * 100)}%)
              </ThemedText>
            </ThemedText>
            <View style={styles.progressContainer}>
              <ProgressDisplay
                type="approached"
                current={todayRecord.approached ?? 0}
                target={targets.approached}
                showLabel={false}
              />
            </View>
          </ThemedView>
          <CounterButton
            type="approached"
            count={todayRecord.approached ?? 0}
            onIncrement={() => handleCounterIncrement('approached')}
            onDecrement={() => handleCounterDecrement('approached')}
            loading={recordLoading.approached}
            compact={true}
          />
        </ThemedView>

        {/* 連絡先ゲット数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#0A0F23"
              darkColor="#FFFFFF"
            >
              {t('get_contact')}: {todayRecord.get_contact ?? 0} / {targets.getContact}{' '}
              <ThemedText
                style={[styles.counterLabel, styles.progressText]}
                lightColor="#D4AF37"
                darkColor="#D4AF37"
              >
                ({Math.round(((todayRecord.get_contact ?? 0) / (targets.getContact || 1)) * 100)}%)
              </ThemedText>
            </ThemedText>
            <View style={styles.progressContainer}>
              <ProgressDisplay
                type="getContact"
                current={todayRecord.get_contact ?? 0}
                target={targets.getContact}
                showLabel={false}
              />
            </View>
          </ThemedView>
          <CounterButton
            type="getContact"
            count={todayRecord.get_contact ?? 0}
            onIncrement={() => handleCounterIncrement('getContact')}
            onDecrement={() => handleCounterDecrement('getContact')}
            loading={recordLoading.getContact}
            compact={true}
          />
        </ThemedView>

        {/* 即日デート数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#0A0F23"
              darkColor="#FFFFFF"
            >
              {t('instant_date')}: {todayRecord.instant_date ?? 0} / {targets.instantDate}{' '}
              <ThemedText
                style={[styles.counterLabel, styles.progressText]}
                lightColor="#D4AF37"
                darkColor="#D4AF37"
              >
                ({Math.round(((todayRecord.instant_date ?? 0) / (targets.instantDate || 1)) * 100)}%)
              </ThemedText>
            </ThemedText>
            <View style={styles.progressContainer}>
              <ProgressDisplay
                type="instantDate"
                current={todayRecord.instant_date ?? 0}
                target={targets.instantDate}
                showLabel={false}
              />
            </View>
          </ThemedView>
          <CounterButton
            type="instantDate"
            count={todayRecord.instant_date ?? 0}
            onIncrement={() => handleCounterIncrement('instantDate')}
            onDecrement={() => handleCounterDecrement('instantDate')}
            loading={recordLoading.instantDate}
            compact={true}
          />
        </ThemedView>

        {/* 即(sex)数 */}
        <ThemedView style={styles.counterRow}>
          <ThemedView style={styles.counterInfo}>
            <ThemedText
              style={styles.counterLabel}
              lightColor="#0A0F23"
              darkColor="#FFFFFF"
            >
              {t('instant_cv')}: {todayRecord.instant_cv ?? 0} / {targets.instantCv}{' '}
              <ThemedText
                style={[styles.counterLabel, styles.progressText]}
                lightColor="#D4AF37"
                darkColor="#D4AF37"
              >
                ({Math.round(((todayRecord.instant_cv ?? 0) / (targets.instantCv || 1)) * 100)}%)
              </ThemedText>
            </ThemedText>
            <View style={styles.progressContainer}>
              <ProgressDisplay
                type="instantCv"
                current={todayRecord.instant_cv ?? 0}
                target={targets.instantCv}
                showLabel={false}
              />
            </View>
          </ThemedView>
          <CounterButton
            type="instantCv"
            count={todayRecord.instant_cv ?? 0}
            onIncrement={() => handleCounterIncrement('instantCv')}
            onDecrement={() => handleCounterDecrement('instantCv')}
            loading={recordLoading.instantCv}
            compact={true}
          />
        </ThemedView>
      </ThemedView>

      {/* ネットワーク状態とエラー表示 */}
      {!isOnline && (
        <ThemedView style={[styles.statusContainer, styles.offlineContainer]}>
          <ThemedText style={styles.statusText}>{t('offline_mode')}</ThemedText>
        </ThemedView>
      )}

      {error && (
        <ThemedView style={[styles.statusContainer, styles.errorContainer]}>
          <ThemedText style={styles.statusText}>{t('error')}: {error}</ThemedText>
        </ThemedView>
      )}

      {/* 開発中は認証情報も表示しておく */}
      <ThemedView style={styles.devContainer}>
        {user ? (
          <ThemedView>
            <Button
              mode="outlined"
              onPress={reloadTargets}
              style={{marginTop: 8, borderColor: '#5c6bc0'}}
            >
              {t('reload_button')}
            </Button>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutButton}
              textColor="#FFF"
            >
              {t('logout')}
            </Button>
          </ThemedView>
        ) : null}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    marginTop: 32,
    paddingLeft: 16,
  },
  headerTitle: {
    fontSize: 32,
    marginBottom: 8,
  },
  headerDate: {
    fontSize: 16,
    marginBottom: 4,
  },
  headerUserName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterSection: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 0, // sectionHeaderで調整するので0に
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  counterInfo: {
    flex: 1,
    marginRight: 16,
  },
  counterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressContainer: {
    flex: 1,
  },
  devContainer: {
    gap: 8,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
  },
  logoutButton: {
    marginTop: 16,
    backgroundColor: '#800020', // バーガンディレッド
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  offlineContainer: {
    backgroundColor: 'rgba(255, 204, 0, 0.2)', // 黄色（薄め）
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 0, 0.5)',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)', // 赤（薄め）
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressText: {
    fontWeight: 'bold',
  },
});

// 明示的にデフォルトエクスポートを定義
export default HomeScreen;
