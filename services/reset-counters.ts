import AsyncStorage from '@react-native-async-storage/async-storage';
import * as recordService from '@/services/record';

// AsyncStorageのキー
const COUNTERS_STORAGE_KEY = 'rizz_counters';

/**
 * カウンターをリセットし、DBから最新の値を取得する関数
 * 認証切り替えやプロファイル切り替え時に呼び出すことで、
 * 表示データと実際のDBデータの不一致を解消する
 */
export const resetCounters = async (): Promise<{
  success: boolean;
  data?: {
    approached: number;
    getContact: number;
    instantDate: number;
    instantCv: number;
  };
  error?: any;
}> => {
  try {
    // 現在の日付を取得
    const today = new Date().toISOString().split('T')[0];
    
    console.log('カウンターリセット処理開始...');
    
    // AsyncStorageのキャッシュをクリア
    await AsyncStorage.removeItem(COUNTERS_STORAGE_KEY);
    console.log('AsyncStorageのカウンターキャッシュをクリア');
    
    // DBから最新のデータを取得
    const { data: dbRecord, error } = await recordService.getDailyRecord(today);
    
    console.log('DBから当日のレコードを取得:', {
      today,
      dbRecord,
      error
    });
    
    if (dbRecord) {
      // DBから取得した値を新しい状態として設定
      const newCounters = {
        approached: dbRecord.approached || 0,
        getContact: dbRecord.get_contact || 0,
        instantDate: dbRecord.instant_date || 0,
        instantCv: dbRecord.instant_cv || 0,
      };
      
      // AsyncStorageに保存
      await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify({
        date: today,
        ...newCounters
      }));
      
      console.log('新しいカウンター値を設定:', newCounters);
      
      return {
        success: true,
        data: newCounters
      };
    } else {
      // DBにデータがない場合は0で初期化
      const zeroCounters = {
        approached: 0,
        getContact: 0,
        instantDate: 0,
        instantCv: 0
      };
      
      // AsyncStorageに保存
      await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify({
        date: today,
        ...zeroCounters
      }));
      
      console.log('データなし、カウンターを0にリセット');
      
      return {
        success: true,
        data: zeroCounters
      };
    }
  } catch (error) {
    console.error('カウンターリセットエラー:', error);
    return {
      success: false,
      error
    };
  }
};
