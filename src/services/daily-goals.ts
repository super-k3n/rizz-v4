import { supabase } from '@/lib/supabase';

export interface DailyGoal {
  id: string;
  user_id: string;
  target_date: string;
  approached_target: number;
  get_contacts_target: number;
  instant_dates_target: number;
  instant_cv_target: number;
  created_at: string;
  updated_at: string;
}

export interface UpsertDailyGoalParams {
  target_date: string;
  approached_target: number;
  get_contacts_target: number;
  instant_dates_target: number;
  instant_cv_target: number;
}

// 日次目標の取得
export const getDailyGoal = async (date: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('ユーザーが認証されていません') };
  }

  const { data, error } = await supabase
    .from('daily_goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('target_date', date)
    .single();

  return { data, error };
};

// 日次目標の作成・更新
export const upsertDailyGoal = async (params: UpsertDailyGoalParams) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('ユーザーが認証されていません') };
  }

  try {
    // 既存のレコードを確認
    const { data: existingGoal } = await supabase
      .from('daily_goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_date', params.target_date)
      .single();

    if (existingGoal) {
      // 既存のレコードを更新
      const { data, error } = await supabase
        .from('daily_goals')
        .update({
          approached_target: params.approached_target,
          get_contacts_target: params.get_contacts_target,
          instant_dates_target: params.instant_dates_target,
          instant_cv_target: params.instant_cv_target,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGoal.id)
        .select()
        .single();

      return { data, error };
    } else {
      // 新しいレコードを作成
      const { data, error } = await supabase
        .from('daily_goals')
        .insert([{
          user_id: user.id,
          target_date: params.target_date,
          approached_target: params.approached_target,
          get_contacts_target: params.get_contacts_target,
          instant_dates_target: params.instant_dates_target,
          instant_cv_target: params.instant_cv_target,
        }])
        .select()
        .single();

      return { data, error };
    }
  } catch (error) {
    console.error('日次目標の更新エラー:', error);
    return { data: null, error };
  }
};

// 日次目標の削除
export const deleteDailyGoal = async (date: string) => {
  const { error } = await supabase
    .from('daily_goals')
    .delete()
    .eq('target_date', date);

  return { error };
};

// 日付範囲での日次目標の取得
export const getDailyGoalsByDateRange = async (startDate: string, endDate: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('ユーザーが認証されていません') };
  }

  const { data, error } = await supabase
    .from('daily_goals')
    .select('*')
    .eq('user_id', user.id)
    .gte('target_date', startDate)
    .lte('target_date', endDate)
    .order('target_date', { ascending: true });

  return { data, error };
};
