import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { PeriodType } from '../lib/types/goal';

// 目標値の型定義
export interface GoalValues {
  period: PeriodType;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
}

// コンテキストの型定義
export interface GoalContextType {
  goals: Record<PeriodType, GoalValues>;
  loading: boolean;
  error: Error | null;
  isOnline: boolean;
  setGoal: (period: PeriodType, values: GoalValues) => Promise<void>;
  getGoal: (period: PeriodType) => GoalValues;
  updateGoal: (period: PeriodType, values: Partial<GoalValues>) => Promise<void>;
  resetGoal: (period: PeriodType) => Promise<void>;
  syncGoals: () => Promise<void>;
}

const GOALS_STORAGE_KEY = '@rizz_goals';

// デフォルトの目標値
const getDefaultGoalValues = (period: PeriodType): GoalValues => ({
  period,
  approached: 0,
  getContact: 0,
  instantDate: 0,
  instantCv: 0,
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
  const existingIndex = queue.findIndex((item: any) => item.data.period === period);
  
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
      // ローカルストレージからデータ再読み込み
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
          // ここでは実際のAPIコールはしないでローカルに保存するだけ
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
      const newGoals = { ...goals, [period]: values };
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(newGoals));
      setGoals(newGoals);
    } catch (error) {
      console.error('Failed to save goals:', error);
      setError(error instanceof Error ? error : new Error('目標の保存に失敗しました'));
    }
  }, [goals]);

  // 目標値の取得
  const getGoal = useCallback((period: PeriodType): GoalValues => {
    return goals[period];
  }, [goals]);

  // 目標値の更新（部分更新）
  const updateGoal = async (period: PeriodType, values: Partial<GoalValues>) => {
    try {
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
    await updateGoal(period, getDefaultGoalValues(period));
  };

  const value: GoalContextType = {
    goals,
    loading,
    error,
    isOnline,
    setGoal,
    getGoal,
    updateGoal,
    resetGoal,
    syncGoals,
  };

  return (
    <GoalContext.Provider value={value}>
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
