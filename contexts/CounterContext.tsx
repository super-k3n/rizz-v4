import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CounterType } from '@/components/counter/CounterButton';
import * as recordService from '@/services/record';

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

  // 目標値の読み込み
  useEffect(() => {
    const loadTargets = async () => {
      try {
        const storedTargets = await AsyncStorage.getItem(TARGETS_STORAGE_KEY);
        if (storedTargets) {
          setPeriodicTargets(JSON.parse(storedTargets));
        }
      } catch (error) {
        console.error('目標値の読み込みエラー:', error);
      }
    };

    loadTargets();
  }, []);

  // カウンターの初期化処理
  const resetCounters = useCallback(async () => {
    // 現在の日付を取得
    const today = new Date().toISOString().split('T')[0];

    try {
      // AsyncStorageのキャッシュをクリア
      await AsyncStorage.removeItem(COUNTERS_STORAGE_KEY);

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
  }, []);

  // アプリ起動時に明示的に再初期化
  useEffect(() => {
    resetCounters();
  }, [resetCounters]);

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
      // 実際のアプリではここでSupabase APIを呼び出す
      // とりあえずローカルステートを更新

      // 0.5秒の遅延を入れて非同期操作をシミュレート
      await new Promise(resolve => setTimeout(resolve, 500));

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

      return { success: true, error: null };
    } catch (error) {
      console.error('目標値更新エラー:', error);
      return { success: false, error };
    }
  }, [periodicTargets]);

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
