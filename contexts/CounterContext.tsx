import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CounterType } from '@/components/counter/CounterButton';
import { useAuth } from '@/contexts/AuthContext';
import * as recordService from '@/services/record';
import * as goalService from '../src/services/goal';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface CounterState {
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
}

interface TargetState {
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
}

// 期間ごとの目標値を管理するための型
interface PeriodicTargetsState {
  daily: TargetState;
  weekly: TargetState;
  monthly: TargetState;
  yearly: TargetState;
}

// AsyncStorageのキー
const TARGETS_STORAGE_KEY = 'rizz_targets';
const COUNTERS_STORAGE_KEY = 'rizz_counters';

// デフォルトの目標値
const defaultTargets: PeriodicTargetsState = {
  daily: {
    approached: 10,
    getContact: 2,
    instantDate: 1,
    instantCv: 1,
  },
  weekly: {
    approached: 50,
    getContact: 10,
    instantDate: 3,
    instantCv: 1,
  },
  monthly: {
    approached: 100,
    getContact: 12,
    instantDate: 4,
    instantCv: 2,
  },
  yearly: {
    approached: 365,
    getContact: 100,
    instantDate: 30,
    instantCv: 12,
  },
};

// コンテキストの型定義
interface CounterContextType {
  counters: CounterState;
  targets: TargetState;
  loading: Record<CounterType, boolean>;
  currentPeriod: PeriodType;
  periodicTargets: PeriodicTargetsState;
  incrementCounter: (type: CounterType) => Promise<void>;
  updateTargets: (period: PeriodType, newTargets: Partial<TargetState>) => Promise<{ success: boolean; error: any }>;
  changePeriod: (period: PeriodType) => void;
  resetCounters: () => Promise<void>;
}

// コンテキストの作成
const CounterContext = createContext<CounterContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function CounterProvider({ children }: { children: React.ReactNode }) {
  // 認証情報
  const { user } = useAuth();
  
  // 現在の期間（デフォルトは日次）
  const [currentPeriod, setCurrentPeriod] = useState<PeriodType>('daily');

  // 実際の値（仮のローカルステート）
  const [counters, setCounters] = useState<CounterState>({
    approached: 0,
    getContact: 0,
    instantDate: 0,
    instantCv: 0,
  });

  // 期間ごとの目標値
  const [periodicTargets, setPeriodicTargets] = useState<PeriodicTargetsState>(defaultTargets);

  // ローディング状態
  const [loading, setLoading] = useState<Record<CounterType, boolean>>({
    approached: false,
    getContact: false,
    instantDate: false,
    instantCv: false,
  });

  // スキーマの変更に合わせてloadTargetsFromSupabase関数を修正
  const loadTargetsFromSupabase = useCallback(async () => {
    if (!user) return;
    
    try {
      // 全期間の目標を取得
      const periods: PeriodType[] = ['daily', 'weekly', 'monthly', 'yearly'];
      const newPeriodicTargets = { ...periodicTargets };
      let hasUpdates = false;
      
      for (const period of periods) {
        const { data, error } = await goalService.getGoal(user.id, period);
        
        if (error) {
          if (error.code === 'PGRST116') {
            // データが存在しない場合は無視
            console.log(`${period}の目標がまだ設定されていません`);
            continue;
          }
          throw error;
        }
        
        if (data) {
          console.log(`${period}の目標をロード:`, data);
          newPeriodicTargets[period] = {
            approached: data.approached_target,
            getContact: data.get_contacts_target,
            instantDate: data.instant_dates_target,
            instantCv: data.instant_cv_target,
          };
          hasUpdates = true;
        }
      }
      
      if (hasUpdates) {
        // ステートを更新
        setPeriodicTargets(newPeriodicTargets);
        console.log('目標値をセットしました:', newPeriodicTargets);
        
        // AsyncStorageに保存
        await AsyncStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(newPeriodicTargets));
        console.log('Supabaseから目標値を読み込みました');
      }
    } catch (err) {
      console.error('Supabaseからの目標値読み込みエラー:', err);
    }
  }, [user, periodicTargets]);

  // 目標値の読み込み
  useEffect(() => {
    const loadTargets = async () => {
      try {
        // まずローカルストレージから読み込み
        const storedTargets = await AsyncStorage.getItem(TARGETS_STORAGE_KEY);
        if (storedTargets) {
          setPeriodicTargets(JSON.parse(storedTargets));
        }
        
        // ユーザーがログインしていればSupabaseからも読み込み
        if (user) {
          await loadTargetsFromSupabase();
        }
      } catch (error) {
        console.error('目標値の読み込みエラー:', error);
      }
    };

    loadTargets();
  }, [user]);

  // カウンターの初期化処理
  const resetCounters = useCallback(async () => {
    // 現在の日付を取得
    const today = new Date().toISOString().split('T')[0];

    try {
      // AsyncStorageのキャッシュをクリア
      await AsyncStorage.removeItem(COUNTERS_STORAGE_KEY);

      // ユーザーがログインしていればSupabaseから目標値も読み込む
      if (user) {
        await loadTargetsFromSupabase();
        console.log('resetCounters内で目標値を読み込みました');
      }

      // DBからデータを再取得
      const { data: dbRecord, error } = await recordService.getDailyRecord(today);

      console.log('カウンターリセット時のデータ取得結果:', {
        dbRecord,
        error
      });

      if (dbRecord) {
        // DBから取得した値を設定
        const newCounters = {
          approached: dbRecord.approached || 0,
          getContact: dbRecord.get_contact || 0,
          instantDate: dbRecord.instant_date || 0,
          instantCv: dbRecord.instant_cv || 0,
        };

        // Contextの状態を更新
        setCounters(newCounters);

        // AsyncStorageに新しい値を保存
        await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify({
          date: today,
          ...newCounters
        }));

        console.log('カウンターリセット完了:', newCounters);
      } else {
        // データがない場合はゼロで初期化
        const zeroCounters = {
          approached: 0,
          getContact: 0,
          instantDate: 0,
          instantCv: 0
        };

        setCounters(zeroCounters);

        await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify({
          date: today,
          ...zeroCounters
        }));

        console.log('データなし、カウンターをゼロにリセット');
      }
    } catch (error) {
      console.error('カウンターリセットエラー:', error);
      // エラー時はAsyncStorageから読み込みを試みる
      try {
        const storedCounters = await AsyncStorage.getItem(COUNTERS_STORAGE_KEY);
        if (storedCounters) {
          const parsedCounters = JSON.parse(storedCounters);
          if (parsedCounters.date === today) {
            setCounters({
              approached: parsedCounters.approached || 0,
              getContact: parsedCounters.getContact || 0,
              instantDate: parsedCounters.instantDate || 0,
              instantCv: parsedCounters.instantCv || 0,
            });
          }
        }
      } catch (storageError) {
        console.error('AsyncStorageからの読み込みエラー:', storageError);
      }
    }
  }, [user, loadTargetsFromSupabase]);

  // アプリ起動時に明示的に再初期化
  useEffect(() => {
    resetCounters();
    
    // ユーザーがログインしていればSupabaseから目標も読み込む
    if (user) {
      loadTargetsFromSupabase();
    }
  }, [resetCounters, user]);

  // 現在の期間の目標値を取得
  const targets = periodicTargets[currentPeriod];

  // カウンターをインクリメントする関数
  const incrementCounter = useCallback(async (type: CounterType) => {
    // ローディング状態を開始
    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      // カウンター値を更新
      const newCounters = {
        ...counters,
        [type]: counters[type] + 1,
      };

      // ステートを更新
      setCounters(newCounters);

      // AsyncStorageに保存
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify({
        date: today,
        ...newCounters
      }));
    } catch (error) {
      console.error('カウンター更新エラー:', error);
      // エラーハンドリングをここに追加
    } finally {
      // ローディング状態を終了
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  }, [counters]);

  // 目標値を更新する関数
  const updateTargets = useCallback(async (period: PeriodType, newTargets: Partial<TargetState>) => {
    try {
      // Supabaseのusersテーブルの情報を確認
      console.log('更新前のユーザー確認:', user);

      // 期間ごとの目標値を更新
      const updatedPeriodicTargets = {
        ...periodicTargets,
        [period]: {
          ...periodicTargets[period],
          ...newTargets,
        },
      };

      // ステートを更新
      setPeriodicTargets(updatedPeriodicTargets);

      // AsyncStorageに保存
      await AsyncStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(updatedPeriodicTargets));
      
      // ユーザーがログインしていればSupabaseにも保存
      if (user) {
        console.log('目標値をSupabaseに保存開始:', period, updatedPeriodicTargets[period]);
        
        const goalData = {
          user_id: user.id,
          period_type: period,
          approached_target: updatedPeriodicTargets[period].approached,
          get_contacts_target: updatedPeriodicTargets[period].getContact,
          instant_dates_target: updatedPeriodicTargets[period].instantDate,
          instant_cv_target: updatedPeriodicTargets[period].instantCv
        };
        
        console.log('送信するgolデータ:', goalData);
        
        const { data, error } = await goalService.upsertGoal(goalData);
        
        console.log('目標値保存結果:', { data, error });
        
        if (error) {
          console.error('Supabaseへの目標値保存エラー:', error);
          return { success: false, error };
        }
        
        console.log('Supabaseに目標値を保存しました:', period);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('目標値更新エラー:', error);
      return { success: false, error };
    }
  }, [periodicTargets, user]);

  // 期間を切り替える関数
  const changePeriod = useCallback((period: PeriodType) => {
    setCurrentPeriod(period);
  }, []);

  // コンテキストの値
  const value = {
    counters,
    targets,
    loading,
    currentPeriod,
    periodicTargets,
    incrementCounter,
    updateTargets,
    changePeriod,
    resetCounters,
  };

  return (
    <CounterContext.Provider value={value}>
      {children}
    </CounterContext.Provider>
  );
}

// カスタムフック
export function useCounter() {
  const context = useContext(CounterContext);
  if (context === undefined) {
    throw new Error('useCounter must be used within a CounterProvider');
  }
  return context;
}
