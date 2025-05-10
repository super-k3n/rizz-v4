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
import * as recordService from '@/services/record';
import * as dailyGoalsService from '@/src/services/daily-goals';

// 明示的なデフォルトエクスポート
function HomeScreen() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { counters, loading: counterLoading, resetCounters: resetCounterContext, incrementCounter, decrementCounter } = useCounter();
  const { incrementCounter: recordIncrementCounter, loading: recordLoading, error, isOnline, dailyRecords } = useRecord();
  const { getGoal, goals } = useGoal();
  const [targets, setTargets] = useState({
    approached: 0,
    getContact: 0,
    instantDate: 0,
    instantCv: 0,
  });
  const [todayRecord, setTodayRecord] = useState({
    approached: 0,
    get_contact: 0,
    instant_date: 0,
    instant_cv: 0,
  });
  const today = new Date();
  const { t } = useTranslation();
  const formattedDate = format(today, t('date_format', { defaultValue: 'yyyy年MM月dd日（EEEE）' }), { locale: ja });

  // 画面が表示されたとき、カウンターと目標値をリセット
  useEffect(() => {
    const init = async () => {
      const today = new Date().toISOString().split('T')[0];
      await reloadTargets(today);
    };
    init();
  }, []);

  // GoalContextのgoals.dailyが変化したらtargets stateを同期
  useEffect(() => {
    if (goals && goals.daily) {
      setTargets({
        approached: goals.daily.approached ?? 0,
        getContact: goals.daily.getContact ?? 0,
        instantDate: goals.daily.instantDate ?? 0,
        instantCv: goals.daily.instantCv ?? 0,
      });
    }
  }, [goals.daily]);

  // 日次目標を読み込む
  const loadDailyGoals = async (date: string) => {
    try {
      const goal = await getGoal('daily', date);
      if (goal) {
        setTargets({
          approached: goal.approached ?? 0,
          getContact: goal.getContact ?? 0,
          instantDate: goal.instantDate ?? 0,
          instantCv: goal.instantCv ?? 0,
        });
      } else {
        // デフォルト値をセット
        setTargets({
          approached: 0,
          getContact: 0,
          instantDate: 0,
          instantCv: 0,
        });
      }
    } catch (error) {
      // エラー時もデフォルト値をセット
      setTargets({
        approached: 0,
        getContact: 0,
        instantDate: 0,
        instantCv: 0,
      });
      console.error('Failed to load daily goals:', error);
    }
  };

  // 現在の日付を取得する関数
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // カウンターボタンのクリックハンドラ
  const handleCounterIncrement = async (type: CounterType) => {
    const today = getCurrentDate();
    await recordIncrementCounter(type, today, 1);
    // DBから最新値を取得してtodayRecordを更新
    const { data: updated } = await recordService.getDailyRecord(today);
    setTodayRecord({
      approached: updated?.approached ?? 0,
      get_contact: updated?.get_contact ?? 0,
      instant_date: updated?.instant_date ?? 0,
      instant_cv: updated?.instant_cv ?? 0,
    });
  };

  // カウンターボタンのデクリメントハンドラ
  const handleCounterDecrement = async (type: CounterType) => {
    const today = getCurrentDate();
    await recordIncrementCounter(type, today, -1);
    const { data: updated } = await recordService.getDailyRecord(today);
    setTodayRecord({
      approached: updated?.approached ?? 0,
      get_contact: updated?.get_contact ?? 0,
      instant_date: updated?.instant_date ?? 0,
      instant_cv: updated?.instant_cv ?? 0,
    });
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
  const reloadTargets = async (dateParam?: string) => {
    try {
      const today = dateParam || getCurrentDate();
      // daily_records
      let { data: record } = await recordService.getDailyRecord(today);
      if (!record) {
        const res = await recordService.upsertDailyRecord({
          game_date: today,
          approached: 0,
          get_contact: 0,
          instant_date: 0,
          instant_cv: 0,
        });
        record = res.data;
      }
      // daily_goals
      let { data: goal } = await dailyGoalsService.getDailyGoal(today);
      if (!goal) {
        const res = await dailyGoalsService.upsertDailyGoal({
          target_date: today,
          approached_target: 0,
          get_contacts_target: 0,
          instant_dates_target: 0,
          instant_cv_target: 0,
        });
        goal = res.data;
      }
      // UI stateに反映
      setTargets({
        approached: goal?.approached_target ?? 0,
        getContact: goal?.get_contacts_target ?? 0,
        instantDate: goal?.instant_dates_target ?? 0,
        instantCv: goal?.instant_cv_target ?? 0,
      });
      setTodayRecord({
        approached: record?.approached ?? 0,
        get_contact: record?.get_contact ?? 0,
        instant_date: record?.instant_date ?? 0,
        instant_cv: record?.instant_cv ?? 0,
      });
      Alert.alert(t('success'), t('reload_success'));
    } catch (error) {
      Alert.alert(t('error'), t('reload_error'));
    }
  };

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
              onPress={() => reloadTargets()}
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
