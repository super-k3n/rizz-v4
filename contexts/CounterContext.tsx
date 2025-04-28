import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CounterType } from '@/components/counter/CounterButton';
import { useAuth } from '@/contexts/AuthContext';
import * as recordService from '@/services/record';
import * as goalService from '@/src/services/goal';
import * as dailyGoalsService from '@/src/services/daily-goals';
import { format } from 'date-fns';
import { Alert } from 'react-native';

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
    approached: 0,
    getContact: 0,
    instantDate: 0,
    instantCv: 0,
  },
  weekly: {
    approached: 0,
    getContact: 0,
    instantDate: 0,
    instantCv: 0,
  },
  monthly: {
    approached: 0,
    getContact: 0,
    instantDate: 0,
    instantCv: 0,
  },
  yearly: {
    approached: 0,
    getContact: 0,
    instantDate: 0,
    instantCv: 0,
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
      console.log('Supabaseから目標値を読み込み開始...');

      const periods: PeriodType[] = ['daily', 'weekly', 'monthly', 'yearly'];
      const newPeriodicTargets = { ...defaultTargets }; // デフォルト値から始める
      let hasUpdates = false;

      // 日次目標の取得
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: dailyGoal, error: dailyError } = await dailyGoalsService.getDailyGoal(today);

        if (!dailyError && dailyGoal) {
          console.log('日次目標データ取得成功:', dailyGoal);
          newPeriodicTargets.daily = {
            approached: dailyGoal.approached_target,
            getContact: dailyGoal.get_contacts_target,
            instantDate: dailyGoal.instant_dates_target,
            instantCv: dailyGoal.instant_cv_target,
          };
          hasUpdates = true;
        }
      } catch (dailyError) {
        console.error('日次目標データ取得エラー:', dailyError);
      }

      // 週次、月次、年次目標の取得
      try {
        const { data: otherGoals, error: otherError } = await goalService.getAllGoals(user.id);

        if (!otherError && otherGoals && otherGoals.length > 0) {
          console.log('その他の期間の目標データ取得成功:', otherGoals);

          otherGoals.forEach(goal => {
            const period = goal.period_type as PeriodType;
            if (period !== 'daily' && periods.includes(period)) {
              newPeriodicTargets[period] = {
                approached: goal.approached_target,
                getContact: goal.get_contacts_target,
                instantDate: goal.instant_dates_target,
                instantCv: goal.instant_cv_target,
              };
              hasUpdates = true;
            }
          });
        }
      } catch (otherError) {
        console.error('その他の期間の目標データ取得エラー:', otherError);
      }

      if (hasUpdates) {
        setPeriodicTargets(newPeriodicTargets);
        console.log('目標値をセットしました:', newPeriodicTargets);
        await AsyncStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(newPeriodicTargets));
      }
    } catch (err) {
      console.error('Supabaseからの目標値読み込みエラー:', err);
    }
  }, [user]);

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
    console.log(`CounterContext.resetCounters - 現在の日付: ${today}`);

    try {
      // 前回のカウンター状態を取得
      const storedCountersStr = await AsyncStorage.getItem(COUNTERS_STORAGE_KEY);
      const storedCounters = storedCountersStr ? JSON.parse(storedCountersStr) : null;

      console.log(`CounterContext.resetCounters - 前回のカウンター:`, storedCounters);

      // 日付が変わったかチェック
      const dateChanged = !storedCounters || storedCounters.date !== today;
      console.log(`CounterContext.resetCounters - 日付変更確認: ${dateChanged}`);

      // AsyncStorageのキャッシュをクリア
      if (dateChanged) {
        await AsyncStorage.removeItem(COUNTERS_STORAGE_KEY);
        console.log(`CounterContext.resetCounters - 日付が変わったためキャッシュをクリア`);
      }

      // ユーザーがログインしていればSupabaseから目標値も読み込む
      if (user) {
        await loadTargetsFromSupabase();
        console.log('resetCounters内で目標値を読み込みました');
      }

      // DBからデータを再取得
      const { data: dbRecord, error } = await recordService.getDailyRecord(today);

      console.log('カウンターリセット時のデータ取得結果:', {
        dbRecord,
        error,
        dateChanged
      });

      // デバッグ用に日付の状態を詳しく出力
      if (storedCounters && dateChanged) {
        console.log(`日付変更検出: 前回=${storedCounters.date}, 今回=${today}`);
      }

      if (dbRecord) {
        // DBから取得した値を設定
        const newCounters = {
          approached: dbRecord.approached || 0,
          getContact: dbRecord.get_contact || 0,
          instantDate: dbRecord.instant_date || 0,
          instantCv: dbRecord.instant_cv || 0,
        };

        console.log(`既存レコードからカウンター値を設定:`, newCounters);

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

        console.log(`${today}のレコードが存在しないため、ゼロで初期化します`);

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
  const updateTargets = async (period: PeriodType, newTargets: Partial<TargetState>) => {
    if (!user) {
      return { success: false, error: new Error('ユーザーが認証されていません') };
    }

    try {
      setLoading(prev => ({
        ...prev,
        approached: true,
      }));

      if (period === 'daily') {
        // 日次目標の更新
        const today = format(new Date(), 'yyyy-MM-dd');
        const { error } = await dailyGoalsService.upsertDailyGoal({
          target_date: today,
          approached_target: newTargets.approached ?? periodicTargets[period].approached,
          get_contacts_target: newTargets.getContact ?? periodicTargets[period].getContact,
          instant_dates_target: newTargets.instantDate ?? periodicTargets[period].instantDate,
          instant_cv_target: newTargets.instantCv ?? periodicTargets[period].instantCv,
        });

        if (error) throw error;
      } else {
        // その他の期間の目標更新
        const { error } = await goalService.upsertGoal({
          user_id: user.id,
          period_type: period,
          approached_target: newTargets.approached ?? periodicTargets[period].approached,
          get_contacts_target: newTargets.getContact ?? periodicTargets[period].getContact,
          instant_dates_target: newTargets.instantDate ?? periodicTargets[period].instantDate,
          instant_cv_target: newTargets.instantCv ?? periodicTargets[period].instantCv,
        });

        if (error) throw error;
      }

      // ローカルステートの更新
      const updatedTargets = {
        ...periodicTargets,
        [period]: {
          ...periodicTargets[period],
          ...newTargets,
        },
      };

      setPeriodicTargets(updatedTargets);
      await AsyncStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(updatedTargets));

      return { success: true, error: null };
    } catch (error) {
      console.error('目標値の更新に失敗しました:', error);
      return { success: false, error };
    } finally {
      setLoading(prev => ({
        ...prev,
        approached: false,
      }));
    }
  };

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
