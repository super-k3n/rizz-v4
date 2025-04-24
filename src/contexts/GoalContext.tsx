import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { PeriodType } from '../types/goal';
import { useAuth } from '../hooks/useAuth';
import { 
  GoalData, 
  getGoal, 
  getAllGoals, 
  upsertGoal, 
  GoalErrorType, 
  handleGoalError 
} from '../services/goal';

// 目標値の型定義
export interface GoalValues {
  period: PeriodType;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
}

// コンテキストの型定義
interface GoalContextType {
  goals: Record<PeriodType, GoalValues>;
  loading: boolean;
  error: Error | null;
  isOnline: boolean;
  updateGoal: (period: PeriodType, values: Partial<GoalValues>) => Promise<void>;
  resetGoal: (period: PeriodType) => Promise<void>;
  syncGoals: () => Promise<void>;
}

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

// コンテキストの作成
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

// プロバイダーコンポーネント
export const GoalProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [goals, setGoals] = useState<Record<PeriodType, GoalValues>>(getDefaultGoals());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { user } = useAuth();  // 認証コンテキストからユーザー情報を取得

  // ネットワーク状態監視
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
      if (state.isConnected) {
        syncOfflineChanges();
      }
    });
    return () => unsubscribe();
  }, [user]);

  // 初期ロード
  useEffect(() => {
    loadGoals();
  }, [user]);

  // ローカルストレージから目標を読み込む
  const loadGoals = async () => {
    setLoading(true);
    try {
      // ローカルストレージからデータ取得
      const localGoalsStr = await AsyncStorage.getItem('goals');
      const localGoals = localGoalsStr ? JSON.parse(localGoalsStr) : getDefaultGoals();
      
      setGoals(localGoals);
      
      // オンラインならサーバーからデータ同期
      if (isOnline && user) {
        await syncGoals();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('目標データの読み込みに失敗しました'));
    } finally {
      setLoading(false);
    }
  };

  // 目標値の同期
  const syncGoals = async () => {
    if (!user || !isOnline) return;

    setLoading(true);
    try {
      // まずオフライン変更を同期
      await syncOfflineChanges();
      
      // サーバーからデータ取得
      const periods: PeriodType[] = ['daily', 'weekly', 'monthly', 'yearly'];
      const newGoals = { ...getDefaultGoals() };
      
      for (const period of periods) {
        const { data, error } = await getGoal(user.id, period);
        
        if (error) {
          if (error.code === 'PGRST116') {
            // データが存在しない場合は無視
            continue;
          }
          throw error;
        }
        
        if (data) {
          newGoals[period] = {
            period,
            approached: data.approached_target,
            getContact: data.get_contacts_target,
            instantDate: data.instant_dates_target,
            instantCv: data.instant_cv_target,
          };
        }
      }
      
      setGoals(newGoals);
      
      // ローカルストレージに保存
      await AsyncStorage.setItem('goals', JSON.stringify(newGoals));
    } catch (err) {
      const errorInfo = handleGoalError(err);
      setError(new Error(errorInfo.message));
    } finally {
      setLoading(false);
    }
  };

  // オフライン変更の同期
  const syncOfflineChanges = async () => {
    if (!user || !isOnline) return;

    const queue = await getGoalChangeQueue();
    if (queue.length === 0) return;
    
    let success = true;
    
    for (const item of queue) {
      try {
        if (item.action === 'upsertGoal') {
          const goalData: GoalData = {
            user_id: user.id,
            period_type: item.data.period,
            approached_target: item.data.approached || 0,
            get_contacts_target: item.data.getContact || 0,
            instant_dates_target: item.data.instantDate || 0,
            instant_cv_target: item.data.instantCv || 0
          };
          
          await upsertGoal(goalData);
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

  // 目標値の更新
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
      await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
      
      // オンラインならサーバーに保存、オフラインならキューに追加
      if (isOnline && user) {
        const goalData: GoalData = {
          user_id: user.id,
          period_type: period,
          approached_target: updatedGoals[period].approached,
          get_contacts_target: updatedGoals[period].getContact,
          instant_dates_target: updatedGoals[period].instantDate,
          instant_cv_target: updatedGoals[period].instantCv
        };
        
        await upsertGoal(goalData);
      } else {
        await addToGoalChangeQueue(period, values);
      }
    } catch (err) {
      const errorInfo = handleGoalError(err);
      setError(new Error(errorInfo.message));
    }
  };

  // 目標値のリセット
  const resetGoal = async (period: PeriodType) => {
    await updateGoal(period, getDefaultGoalValues(period));
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
        loading,
        error,
        isOnline,
        updateGoal,
        resetGoal,
        syncGoals,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
};

// カスタムフック
export const useGoal = () => {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoal must be used within a GoalProvider');
  }
  return context;
};