import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { PeriodType } from '../lib/types/goal';
import * as dailyGoalsService from '@/src/services/daily-goals';
import { format } from 'date-fns';

// 目標値の型定義
export interface GoalValues {
  period: PeriodType;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
  date?: string; // YYYY-MM-DD形式
}

// コンテキストの型定義
export interface GoalContextType {
  goals: Record<PeriodType, GoalValues>;
  loading: boolean;
  error: Error | null;
  isOnline: boolean;
  setGoal: (period: PeriodType, values: GoalValues) => Promise<void>;
  getGoal: (period: PeriodType, date?: string) => Promise<GoalValues | null>;
  updateGoal: (period: PeriodType, values: Partial<GoalValues>) => Promise<void>;
  resetGoal: (period: PeriodType) => Promise<void>;
  syncGoals: () => Promise<void>;
}

const GOALS_STORAGE_KEY = '@rizz_goals';

// デフォルトの目標値
const getDefaultGoalValues = (period: PeriodType, date?: string): GoalValues => ({
  period,
  approached: 0,
  getContact: 0,
  instantDate: 0,
  instantCv: 0,
  ...(date ? { date } : {}),
});

// デフォルトの全期間の目標値
const getDefaultGoals = (): Record<PeriodType, GoalValues> => ({
  daily: getDefaultGoalValues('daily'),
  weekly: getDefaultGoalValues('weekly'),
  monthly: getDefaultGoalValues('monthly'),
  yearly: getDefaultGoalValues('yearly'),
});

const GoalContext = createContext<GoalContextType | undefined>(undefined);

// オフライン変更キューを取得
const getGoalChangeQueue = async () => {
  const queueStr = await AsyncStorage.getItem('offlineGoalChangeQueue');
  return queueStr ? JSON.parse(queueStr) : [];
};

// オフライン変更をキューに追加
const addToGoalChangeQueue = async (period: PeriodType, data: Partial<GoalValues>) => {
  const queue = await getGoalChangeQueue();

  // 同じ期間の既存の変更があれば更新、なければ追加
  const existingIndex = queue.findIndex((item: any) =>
    item.data.period === period &&
    (!data.date || item.data.date === data.date)
  );

  if (existingIndex >= 0) {
    queue[existingIndex].data = { ...queue[existingIndex].data, ...data };
  } else {
    queue.push({
      action: 'upsertGoal',
      data: { period, ...data },
      timestamp: Date.now(),
    });
  }

  await AsyncStorage.setItem('offlineGoalChangeQueue', JSON.stringify(queue));
};

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Record<PeriodType, GoalValues>>(getDefaultGoals());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // ネットワーク状態監視
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
      if (state.isConnected) {
        syncOfflineChanges();
      }
    });
    return () => unsubscribe();
  }, []);

  // 初期ロード
  useEffect(() => {
    loadGoals();
  }, []);

  // ローカルストレージから目標を読み込む
  const loadGoals = async () => {
    try {
      const data = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      if (data) {
        setGoals(JSON.parse(data));
      }

      // 日次目標の場合は、Supabaseから最新のデータを取得
      const today = format(new Date(), 'yyyy-MM-dd');
      const dailyGoal = await dailyGoalsService.getDailyGoal(today);
      if (dailyGoal.data) {
        const updatedGoals = {
          ...goals,
          daily: {
            period: 'daily',
            approached: dailyGoal.data.approached_target,
            getContact: dailyGoal.data.get_contacts_target,
            instantDate: dailyGoal.data.instant_dates_target,
            instantCv: dailyGoal.data.instant_cv_target,
            date: today,
          },
        };
        setGoals(updatedGoals);
        await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(updatedGoals));
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
      setError(error instanceof Error ? error : new Error('目標データの読み込みに失敗しました'));
    } finally {
      setLoading(false);
    }
  };

  // 目標値の同期
  const syncGoals = async () => {
    setLoading(true);
    try {
      await loadGoals();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('目標データの同期に失敗しました'));
    } finally {
      setLoading(false);
    }
  };

  // オフライン変更の同期
  const syncOfflineChanges = async () => {
    if (!isOnline) return;

    const queue = await getGoalChangeQueue();
    if (queue.length === 0) return;

    let success = true;

    for (const item of queue) {
      try {
        if (item.action === 'upsertGoal') {
          if (item.data.period === 'daily' && item.data.date) {
            // daily_goalsテーブルに保存
            await dailyGoalsService.upsertDailyGoal({
              target_date: item.data.date,
              approached_target: item.data.approached,
              get_contacts_target: item.data.getContact,
              instant_dates_target: item.data.instantDate,
              instant_cv_target: item.data.instantCv,
            });
          }

          // ローカルストレージも更新
          const period = item.data.period;
          const newGoals = { ...goals };
          newGoals[period] = { ...newGoals[period], ...item.data };
          await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(newGoals));
          setGoals(newGoals);
        }
      } catch (error) {
        console.error('同期エラー:', error);
        success = false;
        break;
      }
    }

    if (success) {
      await AsyncStorage.removeItem('offlineGoalChangeQueue');
    }
  };

  // 目標値の設定
  const setGoal = useCallback(async (period: PeriodType, values: GoalValues) => {
    try {
      if (period === 'daily' && values.date) {
        // daily_goalsテーブルに保存
        await dailyGoalsService.upsertDailyGoal({
          target_date: values.date,
          approached_target: values.approached,
          get_contacts_target: values.getContact,
          instant_dates_target: values.instantDate,
          instant_cv_target: values.instantCv,
        });
      }

      const newGoals = { ...goals, [period]: values };
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(newGoals));
      setGoals(newGoals);
    } catch (error) {
      console.error('Failed to save goals:', error);
      setError(error instanceof Error ? error : new Error('目標の保存に失敗しました'));
    }
  }, [goals]);

  // 目標値の取得
  const getGoal = useCallback(async (period: PeriodType, date?: string): Promise<GoalValues | null> => {
    if (period === 'daily' && date) {
      try {
        const result = await dailyGoalsService.getDailyGoal(date);
        if (result.data) {
          return {
            period: 'daily',
            approached: result.data.approached_target,
            getContact: result.data.get_contacts_target,
            instantDate: result.data.instant_dates_target,
            instantCv: result.data.instant_cv_target,
            date,
          };
        }
      } catch (error) {
        console.error('Failed to fetch daily goal:', error);
      }
    }
    return goals[period];
  }, [goals]);

  // 目標値の更新（部分更新）
  const updateGoal = async (period: PeriodType, values: Partial<GoalValues>) => {
    try {
      if (period === 'daily' && values.date) {
        // daily_goalsテーブルに保存
        await dailyGoalsService.upsertDailyGoal({
          target_date: values.date,
          approached_target: values.approached ?? goals[period].approached,
          get_contacts_target: values.getContact ?? goals[period].getContact,
          instant_dates_target: values.instantDate ?? goals[period].instantDate,
          instant_cv_target: values.instantCv ?? goals[period].instantCv,
        });
      }

      // ローカル状態を更新
      const updatedGoals = { ...goals };
      updatedGoals[period] = {
        ...updatedGoals[period],
        ...values,
      };

      setGoals(updatedGoals);

      // ローカルストレージに保存
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(updatedGoals));

      // オフラインならキューに追加
      if (!isOnline) {
        await addToGoalChangeQueue(period, values);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '目標の更新に失敗しました';
      setError(new Error(errorMessage));
    }
  };

  // 目標値のリセット
  const resetGoal = async (period: PeriodType) => {
    try {
      const defaultValue = getDefaultGoalValues(period);
      await setGoal(period, defaultValue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '目標のリセットに失敗しました';
      setError(new Error(errorMessage));
    }
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
        loading,
        error,
        isOnline,
        setGoal,
        getGoal,
        updateGoal,
        resetGoal,
        syncGoals,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
};

export const useGoal = () => {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoal must be used within a GoalProvider');
  }
  return context;
};
