import { supabase } from '@/lib/supabase';
import { CounterType } from '@/lib/types/record';

// Supabaseデータベースの日次記録型
export interface DailyRecordData {
  id?: string;
  user_id?: string;
  approached: number;
  get_contact: number;
  instant_date: number;
  instant_cv: number;
  game_area?: string;
  game_date: string; // YYYY-MM-DD形式
  game_time?: string; // HH:MM:SS形式
  created_at?: string;
  updated_at?: string;
}

// エラーレスポンスの型
interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

// 成功レスポンスの型
interface SuccessResponse<T> {
  data: T;
  error: null;
}

// エラーレスポンスの型
interface FailureResponse {
  data: null;
  error: ErrorResponse;
}

// レスポンスの型
type Response<T> = SuccessResponse<T> | FailureResponse;

/**
 * 特定日付の記録を取得する
 * @param date YYYY-MM-DD形式の日付
 * @returns 日次記録データまたはエラー
 */
export const getDailyRecord = async (date: string): Promise<Response<DailyRecordData | null>> => {
  try {
    // ユーザーIDを取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: null,
        error: {
          message: 'ユーザーが認証されていません',
          code: 'auth/not-authenticated',
        }
      };
    }

    // デバッグ用に認証情報を表示
    console.log('認証ユーザー情報:', {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    });

    // プロファイル情報の確認
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', user.email) // emailで一致させる
      .single();
    
    // デバッグ用にプロファイル情報を表示
    console.log('取得したプロファイル情報:', {
      profileData,
      profileError
    });
    
    if (profileError || !profileData) {
      console.error('プロファイルが存在しません:', profileError);
      return {
        data: null,
        error: {
          message: 'ユーザープロファイルが見つかりません',
          code: 'profile/not-found',
          details: profileError
        }
      };
    }

    // 日次記録を取得
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', profileData.id)
      .eq('game_date', date)
      .single();
    
    // デバッグ用に日次記録クエリ結果を表示
    console.log('日次記録クエリ結果:', {
      user_id: profileData.id,
      date,
      data,
      error
    });

    if (error) {
      // Not foundの場合はnullを返す（エラーではない）
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      
      throw error;
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('日次記録取得エラー:', error);
    return {
      data: null,
      error: {
        message: error.message || '日次記録の取得に失敗しました',
        code: error.code,
        details: error
      }
    };
  }
};

/**
 * 日次記録を作成または更新する
 * @param recordData 日次記録データ
 * @returns 成功またはエラー
 */
export const upsertDailyRecord = async (recordData: Partial<DailyRecordData>): Promise<Response<DailyRecordData>> => {
  console.log('upsertDailyRecord - 開始', recordData);
  try {
    // ユーザーIDを取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: null,
        error: {
          message: 'ユーザーが認証されていません',
          code: 'auth/not-authenticated',
        }
      };
    }

    // プロファイル情報の確認
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', user.email) // idではなくemailで一致させる
      .single();
    
    if (profileError || !profileData) {
      console.error('プロファイルが存在しません:', profileError);
      return {
        data: null,
        error: {
          message: 'ユーザープロファイルが見つかりません',
          code: 'profile/not-found',
          details: profileError
        }
      };
    }

    // game_dateがない場合は現在の日付を使用
    const gameDate = recordData.game_date || new Date().toISOString().split('T')[0];
    console.log(`upsertDailyRecord - 日付設定: ${gameDate}`);
    
    // 既存の記録を確認
    const { data: existingRecord } = await getDailyRecord(gameDate);
    console.log(`upsertDailyRecord - 既存記録: ${existingRecord ? 'あり' : 'なし'}`, existingRecord);
    
    // デバッグ用に日付と既存記録情報を表示
    console.log(`incrementCounter - 日付: ${gameDate}, 既存記録:`, existingRecord);
    
    // 必要なデータを準備
    let dataToUpsert: Partial<DailyRecordData> = {};
    
    if (existingRecord && existingRecord.game_date === gameDate) {
      console.log(`upsertDailyRecord - 同じ日付の既存記録を更新します`);
      // 既存記録をベースに更新
      dataToUpsert = {
        ...existingRecord,
        ...recordData,
        user_id: profileData.id,
        game_date: gameDate,
        updated_at: new Date().toISOString(),
      };
    } else {
      console.log(`upsertDailyRecord - 新しい日付の記録を作成します`);
      // 新規レコードを作成
      dataToUpsert = {
        id: undefined, // 新規レコードとして扱うためにidをクリア
        user_id: profileData.id,
        game_date: gameDate,
        approached: recordData.approached ?? 0,
        get_contact: recordData.get_contact ?? 0,
        instant_date: recordData.instant_date ?? 0,
        instant_cv: recordData.instant_cv ?? 0,
        game_area: recordData.game_area,
        game_time: recordData.game_time,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    
    console.log(`upsertDailyRecord - 更新データ:`, dataToUpsert);

    // 日次記録を作成または更新
    let data, error;
    
    if (existingRecord && existingRecord.game_date === gameDate) {
      // 同じ日付の既存記録なら更新
      console.log(`upsertDailyRecord - レコードを更新します ID: ${existingRecord.id}`);
      const result = await supabase
        .from('daily_records')
        .update(dataToUpsert)
        .eq('id', existingRecord.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // 新しい日付なら新規作成
      console.log(`upsertDailyRecord - 新規レコードを作成します`);
      const result = await supabase
        .from('daily_records')
        .insert(dataToUpsert)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('日次記録更新エラー:', error);
    return {
      data: null,
      error: {
        message: error.message || '日次記録の更新に失敗しました',
        code: error.code,
        details: error
      }
    };
  }
};

/**
 * カウンター値をインクリメントする
 * @param type カウンタータイプ
 * @param date YYYY-MM-DD形式の日付
 * @param count インクリメント数（デフォルト: 1）
 * @returns 成功またはエラー
 */
export const incrementCounter = async (
  type: CounterType,
  date: string,
  count: number = 1
): Promise<Response<DailyRecordData>> => {
  try {
    // ユーザーIDを取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: null,
        error: {
          message: 'ユーザーが認証されていません',
          code: 'auth/not-authenticated',
        }
      };
    }

    // プロファイル情報の確認
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', user.email) // idではなくemailで一致させる
      .single();
    
    if (profileError || !profileData) {
      console.error('プロファイルが存在しません:', profileError);
      return {
        data: null,
        error: {
          message: 'ユーザープロファイルが見つかりません',
          code: 'profile/not-found',
          details: profileError
        }
      };
    }

    // 日付が指定されていない場合は現在の日付を使用
    const gameDate = date || new Date().toISOString().split('T')[0];
    
    // 既存の記録を取得
    const { data: existingRecord } = await getDailyRecord(gameDate);
    
    // カウンタータイプをSupabaseのカラム名に変換
    const columnMap: Record<CounterType, string> = {
      approached: 'approached',
      getContact: 'get_contact',
      instantDate: 'instant_date',
      instantCv: 'instant_cv',
    };
    
    const column = columnMap[type];
    
    // 新しい値を計算
    const currentValue = existingRecord ? (existingRecord[column] || 0) : 0;
    const newValue = currentValue + count;
    console.log(`incrementCounter - カラム: ${column}, 現在値: ${currentValue}, 新値: ${newValue}`);
    
    // 更新データを準備
    const updateData: Partial<DailyRecordData> = {
      user_id: profileData.id, // プロファイルのIDを設定
      game_date: gameDate,
      [column]: newValue,
    };
    
    console.log('incrementCounter - 更新データ:', updateData);
    
    // 記録が存在しない場合は他のカウンターを0で初期化
    if (!existingRecord) {
      Object.keys(columnMap).forEach(key => {
        if (key !== type) {
          updateData[columnMap[key as CounterType]] = 0;
        }
      });
    }
    
    // 更新を実行
    return await upsertDailyRecord(updateData);
  } catch (error: any) {
    console.error('カウンターインクリメントエラー:', error);
    return {
      data: null,
      error: {
        message: error.message || 'カウンターのインクリメントに失敗しました',
        code: error.code,
        details: error
      }
    };
  }
};

/**
 * 声かけ数をインクリメントする
 * @param date YYYY-MM-DD形式の日付
 * @param count インクリメント数（デフォルト: 1）
 * @returns 成功またはエラー
 */
export const incrementApproached = async (
  date: string,
  count: number = 1
): Promise<Response<DailyRecordData>> => {
  return incrementCounter('approached', date, count);
};

/**
 * 連絡先取得数をインクリメントする
 * @param date YYYY-MM-DD形式の日付
 * @param count インクリメント数（デフォルト: 1）
 * @returns 成功またはエラー
 */
export const incrementGetContact = async (
  date: string,
  count: number = 1
): Promise<Response<DailyRecordData>> => {
  return incrementCounter('getContact', date, count);
};

/**
 * 即日デート数をインクリメントする
 * @param date YYYY-MM-DD形式の日付
 * @param count インクリメント数（デフォルト: 1）
 * @returns 成功またはエラー
 */
export const incrementInstantDate = async (
  date: string,
  count: number = 1
): Promise<Response<DailyRecordData>> => {
  return incrementCounter('instantDate', date, count);
};

/**
 * 即数をインクリメントする
 * @param date YYYY-MM-DD形式の日付
 * @param count インクリメント数（デフォルト: 1）
 * @returns 成功またはエラー
 */
export const incrementInstantCV = async (
  date: string,
  count: number = 1
): Promise<Response<DailyRecordData>> => {
  return incrementCounter('instantCv', date, count);
};

/**
 * 期間指定での記録取得
 * @param startDate 開始日（YYYY-MM-DD形式）
 * @param endDate 終了日（YYYY-MM-DD形式）
 * @returns 日次記録の配列またはエラー
 */
export const getDailyRecords = async (
  startDate: string,
  endDate: string
): Promise<Response<DailyRecordData[]>> => {
  try {
    // ユーザーIDを取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: null,
        error: {
          message: 'ユーザーが認証されていません',
          code: 'auth/not-authenticated',
        }
      };
    }

    // プロファイル情報の確認
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', user.email) // idではなくemailで一致させる
      .single();
    
    if (profileError || !profileData) {
      console.error('プロファイルが存在しません:', profileError);
      return {
        data: null,
        error: {
          message: 'ユーザープロファイルが見つかりません',
          code: 'profile/not-found',
          details: profileError
        }
      };
    }

    // 期間指定で記録を取得
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', profileData.id)
      .gte('game_date', startDate)
      .lte('game_date', endDate)
      .order('game_date', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('期間指定記録取得エラー:', error);
    return {
      data: null,
      error: {
        message: error.message || '期間指定での記録取得に失敗しました',
        code: error.code,
        details: error
      }
    };
  }
};

/**
 * 日次記録を削除する
 * @param date YYYY-MM-DD形式の日付
 * @returns 成功またはエラー
 */
export const deleteDailyRecord = async (date: string): Promise<Response<null>> => {
  try {
    // ユーザーIDを取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: null,
        error: {
          message: 'ユーザーが認証されていません',
          code: 'auth/not-authenticated',
        }
      };
    }

    // プロファイル情報の確認
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', user.email) // idではなくemailで一致させる
      .single();
    
    if (profileError || !profileData) {
      console.error('プロファイルが存在しません:', profileError);
      return {
        data: null,
        error: {
          message: 'ユーザープロファイルが見つかりません',
          code: 'profile/not-found',
          details: profileError
        }
      };
    }

    // 既存の記録を確認
    const { data: existingRecord } = await getDailyRecord(date);
    if (!existingRecord) {
      return { data: null, error: null }; // 削除対象が存在しない場合は成功扱い
    }

    // 日次記録を削除
    const { error } = await supabase
      .from('daily_records')
      .delete()
      .eq('user_id', profileData.id)
      .eq('game_date', date);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error: any) {
    console.error('日次記録削除エラー:', error);
    return {
      data: null,
      error: {
        message: error.message || '日次記録の削除に失敗しました',
        code: error.code,
        details: error
      }
    };
  }
};
