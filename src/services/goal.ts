import { supabase } from '@/lib/supabase';
import { PeriodType } from '../types/goal';

// 目標データのインターフェース
export interface GoalData {
  id?: string;
  user_id: string;
  approached_target: number;
  get_contacts_target: number;
  instant_dates_target: number;
  instant_cv_target: number;
  period_type: PeriodType;
  created_at?: string;
  updated_at?: string;
}

// 単一の目標を取得
export const getGoal = async (userId: string, period: PeriodType) => {
  console.log(`getGoal呼び出し: userId=${userId}, period=${period}`);
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('period_type', period)
      .single();

    console.log(`getGoal結果:`, { data, error });
    return { data, error };
  } catch (err) {
    console.error('getGoalエラー:', err);
    return { data: null, error: err };
  }
};

// 全期間の目標を取得
export const getAllGoals = async (userId: string) => {
  console.log(`getAllGoals呼び出し: userId=${userId}`);
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    console.log(`getAllGoals結果:`, { data, error });
    return { data, error };
  } catch (err) {
    console.error('getAllGoalsエラー:', err);
    return { data: null, error: err };
  }
};

// 目標を作成または更新
export const upsertGoal = async (goalData: GoalData) => {
  console.log('upsertGoal呼び出し:', goalData);
  try {
    // supabaseクライアントのログ
    console.log('supabaseクライアントの状態:', supabase);
    
    const { data, error } = await supabase
      .from('goals')
      .upsert(goalData, { 
        onConflict: 'user_id,period_type',
        ignoreDuplicates: false
      })
      .select()
      .single();

    console.log('upsertGoal結果:', { data, error });
    return { data, error };
  } catch (err) {
    console.error('upsertGoalエラー:', err);
    return { data: null, error: err };
  }
};

// 目標を削除
export const deleteGoal = async (goalId: string) => {
  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    return { error };
  } catch (err) {
    console.error('deleteGoalエラー:', err);
    return { error: err };
  }
};

// デバッグ用にすべての目標を取得する関数
export const debugGoals = async () => {
  console.log('デバッグ用目標値取得開始');
  try {
    // goalsテーブルの構造を確認
    const { data: tableInfo, error: tableError } = await supabase
      .from('goals')
      .select('*')
      .limit(1);
    
    console.log('テーブル情報:', { tableInfo, tableError });
    
    // すべてのレコードを取得
    const { data, error } = await supabase
      .from('goals')
      .select('*');
    
    console.log('全データ取得結果:', { data, error });
    
    return { data, error, tableInfo, tableError };
  } catch (err) {
    console.error('デバッグ取得エラー:', err);
    return { data: null, error: err };
  }
};

// テスト用の目標値を挿入する関数
export const insertTestGoal = async (userId: string) => {
  console.log('テスト目標値挿入開始');
  
  const testData: GoalData = {
    user_id: userId,
    period_type: 'daily',
    approached_target: 42,
    get_contacts_target: 10,
    instant_dates_target: 5,
    instant_cv_target: 2
  };
  
  try {
    const { data, error } = await supabase
      .from('goals')
      .insert(testData)
      .select()
      .single();
    
    console.log('テストデータ挿入結果:', { data, error });
    
    return { data, error };
  } catch (err) {
    console.error('テストデータ挿入エラー:', err);
    return { data: null, error: err };
  }
};

// エラータイプの定義
export enum GoalErrorType {
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error',
  DATA_ERROR = 'data_error',
  UNKNOWN_ERROR = 'unknown_error',
}

// エラーハンドリング関数
export const handleGoalError = (error: any): { type: GoalErrorType; message: string } => {
  if (!navigator.onLine) {
    return {
      type: GoalErrorType.NETWORK_ERROR,
      message: 'ネットワーク接続がありません。オンラインに復帰すると自動的に同期されます。',
    };
  }

  if (error?.status === 401 || error?.status === 403) {
    return {
      type: GoalErrorType.AUTH_ERROR,
      message: '認証エラーが発生しました。再ログインしてください。',
    };
  }

  if (error?.code === 'PGRST116') {
    return {
      type: GoalErrorType.DATA_ERROR,
      message: '目標データが見つかりません。',
    };
  }

  return {
    type: GoalErrorType.UNKNOWN_ERROR,
    message: 'エラーが発生しました。しばらく経ってからお試しください。',
  };
};