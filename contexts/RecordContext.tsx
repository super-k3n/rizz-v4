import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { CounterType, PeriodType } from '@/lib/types/record';
import { useCounter } from './CounterContext';
import * as recordService from '@/services/record';
import { DailyRecordData } from '@/services/record';

// AsyncStorageのキー
const OFFLINE_QUEUE_KEY = 'rizz_offline_queue';
const DAILY_RECORDS_CACHE_KEY = 'rizz_daily_records_cache';
const COUNTERS_STORAGE_KEY = 'rizz_counters_storage';

// 変更キューアイテムの型
interface ChangeQueueItem {
  action: 'increment';
  type: CounterType;
  date: string;
  count: number;
  timestamp: number;
}

// RecordContextの型定義
interface RecordContextType {
  dailyRecords: Record<string, DailyRecordData>;
  loading: Record<CounterType, boolean>;
  error: string | null;
  isOnline: boolean;
  fetchDailyRecord: (date: string) => Promise<DailyRecordData | null>;
  incrementCounter: (type: CounterType, date: string, count?: number) => Promise<void>;
  syncOfflineChanges: () => Promise<void>;
  getOfflineChangeCount: () => Promise<number>;
}

// コンテキストの作成
const RecordContext = createContext<RecordContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function RecordProvider({ children }: { children: React.ReactNode }) {
  const { incrementCounter: incrementCounterLocal } = useCounter();
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecordData>>({});
  const [loading, setLoading] = useState<Record<CounterType, boolean>>({
    approached: false,
    getContact: false,
    instantDate: false,
    instantCv: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // キャッシュからデータをロード
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cachedData = await AsyncStorage.getItem(DAILY_RECORDS_CACHE_KEY);
        if (cachedData) {
          setDailyRecords(JSON.parse(cachedData));
        }
      } catch (err) {
        console.error('キャッシュの読み込みエラー:', err);
      }
    };

    loadCache();
  }, []);

  // ネットワーク状態の監視
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!state.isConnected;
      setIsOnline(online);

      // オンラインに復帰した場合、オフライン変更を同期
      if (online) {
        syncOfflineChanges();
      }
    });

    // ネットワーク状態の初期確認
    NetInfo.fetch().then(state => {
      setIsOnline(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // オフライン変更キューの取得
  const getChangeQueue = useCallback(async (): Promise<ChangeQueueItem[]> => {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('変更キューの取得エラー:', err);
      return [];
    }
  }, []);

  // オフライン変更キューの保存
  const saveChangeQueue = useCallback(async (queue: ChangeQueueItem[]) => {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('変更キューの保存エラー:', err);
    }
  }, []);

  // オフライン変更キューの件数取得
  const getOfflineChangeCount = useCallback(async (): Promise<number> => {
    const queue = await getChangeQueue();
    return queue.length;
  }, [getChangeQueue]);

  // オフライン変更のキューへの追加
  const addToChangeQueue = useCallback(async (item: ChangeQueueItem) => {
    const queue = await getChangeQueue();
    queue.push(item);
    await saveChangeQueue(queue);
  }, [getChangeQueue, saveChangeQueue]);

  // データキャッシュの更新
  const updateCache = useCallback(async (date: string, data: DailyRecordData) => {
    try {
      setDailyRecords(prev => {
        const updated = { ...prev, [date]: data };
        // AsyncStorageに保存
        AsyncStorage.setItem(DAILY_RECORDS_CACHE_KEY, JSON.stringify(updated))
          .catch(err => console.error('キャッシュ保存エラー:', err));
        return updated;
      });
    } catch (err) {
      console.error('キャッシュ更新エラー:', err);
    }
  }, []);

  // オフラインの変更を同期
  const syncOfflineChanges = useCallback(async () => {
    // オフラインの場合は何もしない
    if (!isOnline) return;

    setLoading(prev => ({ ...prev, approached: true, getContact: true, instantDate: true, instantCv: true }));
    setError(null);

    try {
      const queue = await getChangeQueue();
      if (queue.length === 0) {
        setLoading(prev => ({ ...prev, approached: false, getContact: false, instantDate: false, instantCv: false }));
        return;
      }

      console.log(`オフライン変更を同期: ${queue.length}件`);

      // キューを古い順に処理
      const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);

      for (const item of sortedQueue) {
        if (item.action === 'increment') {
          const { type, date, count } = item;

          // Supabaseに反映
          const { data, error } = await recordService.incrementCounter(type, date, count);

          if (error) {
            console.error('同期エラー:', error);
            setError(`同期エラー: ${error.message}`);
            setLoading(prev => ({ ...prev, [type]: false }));
            return; // エラーが発生した場合は中断
          }

          if (data) {
            // キャッシュを更新
            await updateCache(date, data);
          }
        }
      }

      // 成功したら変更キューをクリア
      await saveChangeQueue([]);
      console.log('同期完了');
    } catch (err: any) {
      console.error('同期エラー:', err);
      setError(`同期エラー: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, approached: false, getContact: false, instantDate: false, instantCv: false }));
    }
  }, [isOnline, getChangeQueue, saveChangeQueue, updateCache]);

  // 特定日の記録を取得
  const fetchDailyRecord = useCallback(async (date: string): Promise<DailyRecordData | null> => {
    setLoading(prev => ({ ...prev, approached: true, getContact: true, instantDate: true, instantCv: true }));
    setError(null);

    try {
      // キャッシュにある場合はキャッシュから返す
      if (dailyRecords[date]) {
        setLoading(prev => ({ ...prev, approached: false, getContact: false, instantDate: false, instantCv: false }));
        return dailyRecords[date];
      }

      // オフラインの場合はnullを返す
      if (!isOnline) {
        setLoading(prev => ({ ...prev, approached: false, getContact: false, instantDate: false, instantCv: false }));
        return null;
      }

      // Supabaseから取得
      const { data, error } = await recordService.getDailyRecord(date);

      if (error) {
        setError(error.message);
        setLoading(prev => ({ ...prev, approached: false, getContact: false, instantDate: false, instantCv: false }));
        return null;
      }

      if (data) {
        // キャッシュを更新
        await updateCache(date, data);
      }

      setLoading(prev => ({ ...prev, approached: false, getContact: false, instantDate: false, instantCv: false }));
      return data;
    } catch (err: any) {
      console.error('記録取得エラー:', err);
      setError(err.message || 'Unknown error');
      setLoading(prev => ({ ...prev, approached: false, getContact: false, instantDate: false, instantCv: false }));
      return null;
    }
  }, [isOnline, dailyRecords, updateCache]);

  // カウンターをインクリメント
  const incrementCounter = useCallback(async (
    type: CounterType,
    date: string = new Date().toISOString().split('T')[0],
    count: number = 1
  ) => {
    console.log(`RecordContext.incrementCounter - タイプ: ${type}, 日付: ${date}, 値: ${count}`);
    setLoading(prev => ({ ...prev, [type]: true }));
    setError(null);

    try {
      // ローカルカウンターを更新
      await incrementCounterLocal(type);

      // オフラインの場合はキューに追加
      if (!isOnline) {
        console.log(`RecordContext.incrementCounter - オフラインモードで実行`);
        await addToChangeQueue({
          action: 'increment',
          type,
          date,
          count,
          timestamp: Date.now()
        });

        // キャッシュ内のカウンターも更新
        const current = dailyRecords[date] || {
          game_date: date,
          approached: 0,
          get_contact: 0,
          instant_date: 0,
          instant_cv: 0
        };

        const columnMap: Record<CounterType, keyof DailyRecordData> = {
          approached: 'approached',
          getContact: 'get_contact',
          instantDate: 'instant_date',
          instantCv: 'instant_cv',
        };

        const column = columnMap[type];
        const updatedRecord: DailyRecordData = {
          ...current,
          [column]: (Number(current[column]) || 0) + count
        };

        await updateCache(date, updatedRecord);

        // AsyncStorageにも保存
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify({
          date: today,
          approached: updatedRecord.approached || 0,
          getContact: updatedRecord.get_contact || 0,
          instantDate: updatedRecord.instant_date || 0,
          instantCv: updatedRecord.instant_cv || 0,
        }));

        setLoading(prev => ({ ...prev, [type]: false }));
        return;
      }

      // オンラインの場合はSupabaseに直接更新
      console.log(`RecordContext.incrementCounter - オンラインモードで実行: ${date}`);
      const { data, error } = await recordService.incrementCounter(type, date, count);

      if (error) {
        setError(error.message);
        setLoading(prev => ({ ...prev, [type]: false }));
        return;
      }

      if (data) {
        // キャッシュを更新
        await updateCache(date, data);

        // AsyncStorageにも保存
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify({
          date: today,
          approached: data.approached || 0,
          getContact: data.get_contact || 0,
          instantDate: data.instant_date || 0,
          instantCv: data.instant_cv || 0,
        }));
      }
    } catch (err: any) {
      console.error('カウンター更新エラー:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  }, [isOnline, incrementCounterLocal, addToChangeQueue, dailyRecords, updateCache]);

  // コンテキストの値
  const value = {
    dailyRecords,
    loading,
    error,
    isOnline,
    fetchDailyRecord,
    incrementCounter,
    syncOfflineChanges,
    getOfflineChangeCount
  };

  return (
    <RecordContext.Provider value={value}>
      {children}
    </RecordContext.Provider>
  );
}

// カスタムフック
export function useRecord() {
  const context = useContext(RecordContext);
  if (context === undefined) {
    throw new Error('useRecord must be used within a RecordProvider');
  }
  return context;
}
