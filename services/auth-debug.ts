import { supabase } from '@/lib/supabase';

/**
 * 認証情報とプロファイルの関連をデバッグする関数
 * メールアドレスとユーザーIDの対応関係を確認する
 */
export const debugAuthAndProfile = async () => {
  try {
    // 認証ユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('認証情報取得エラー:', authError || '認証ユーザーなし');
      return;
    }
    
    console.log('========== 認証診断 ==========');
    console.log('認証ユーザー情報:', {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    });
    
    // プロファイル情報をIDで検索
    const { data: profileById, error: profileByIdError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id);
      
    console.log('IDによるプロファイル検索結果:', {
      profileById,
      profileByIdError
    });
    
    // プロファイル情報をメールで検索
    if (user.email) {
      const { data: profileByEmail, error: profileByEmailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email);
        
      console.log('メールによるプロファイル検索結果:', {
        profileByEmail,
        profileByEmailError
      });
    }
    
    // 全プロファイルをリスト
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
      
    console.log('全プロファイル一覧 (最大10件):', {
      allProfiles,
      allProfilesError
    });
    
    // 本日の日付の記録を取得
    const today = new Date().toISOString().split('T')[0];
    const { data: todayRecords, error: todayRecordsError } = await supabase
      .from('daily_records')
      .select('*')
      .eq('game_date', today);
      
    console.log('本日の記録一覧:', {
      today,
      todayRecords,
      todayRecordsError
    });
    
    console.log('============================');
  } catch (error) {
    console.error('デバッグ関数エラー:', error);
  }
};
