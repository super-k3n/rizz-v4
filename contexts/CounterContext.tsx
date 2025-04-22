import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CounterType } from '@/components/counter/CounterButton';

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

  // AsyncStorageから目標値を読み込む
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

  // 現在の期間の目標値を取得
  const targets = periodicTargets[currentPeriod];

  // カウンターをインクリメントする関数
  const incrementCounter = useCallback(async (type: CounterType) => {
    // ローディング状態を開始
    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      // 実際のアプリではここでSupabase APIを呼び出す
      // とりあえずローカルステートを更新

      // 0.5秒の遅延を入れて非同期操作をシミュレート
      await new Promise(resolve => setTimeout(resolve, 500));

      // カウンター値を更新
      setCounters(prev => ({
        ...prev,
        [type]: prev[type] + 1,
      }));
    } catch (error) {
      console.error('カウンター更新エラー:', error);
      // エラーハンドリングをここに追加
    } finally {
      // ローディング状態を終了
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  }, []);

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
