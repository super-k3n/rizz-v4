import { useState, useCallback } from 'react';
import { CounterType } from '@/components/counter/CounterButton';

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

export function useCounter() {
  // 実際の値（仮のローカルステート）
  const [counters, setCounters] = useState<CounterState>({
    approached: 0,
    getContact: 0,
    instantDate: 0,
    instantCv: 0,
  });

  // 目標値（仮のローカルステート）
  const [targets, setTargets] = useState<TargetState>({
    approached: 10,
    getContact: 5,
    instantDate: 2,
    instantCv: 1,
  });

  // ローディング状態
  const [loading, setLoading] = useState<Record<CounterType, boolean>>({
    approached: false,
    getContact: false,
    instantDate: false,
    instantCv: false,
  });

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

  return {
    counters,
    targets,
    loading,
    incrementCounter,
  };
}
