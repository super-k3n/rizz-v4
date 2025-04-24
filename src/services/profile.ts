import { supabase } from './supabase';
import { Profile, ProfileUpdateData } from '../types/profile';

// プロフィール情報を取得
export const getProfile = async (): Promise<Profile | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('ユーザーが認証されていません');
    }
    
    // user_idでプロフィールを検索
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.user.id)
      .single();
    
    if (error) {
      // プロフィールが見つからない場合、IDでも試す
      const { data: profileById, error: idError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();
      
      if (idError) {
        throw idError;
      }
      
      return profileById as Profile;
    }
    
    return data as Profile;
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    throw error;
  }
};

// プロフィール情報を更新
export const updateProfile = async (profileData: ProfileUpdateData): Promise<Profile> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('ユーザーが認証されていません');
    }
    
    // まずプロフィールを取得
    const profile = await getProfile();
    
    if (!profile) {
      throw new Error('プロフィールが見つかりません');
    }
    
    // プロフィールを更新
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as Profile;
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    throw error;
  }
};

// パスワード変更
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    // 現在のパスワードを検証（サインインを試みる）
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('ユーザーが認証されていません');
    }
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.user.email!,
      password: currentPassword,
    });
    
    if (signInError) {
      throw new Error('現在のパスワードが正しくありません');
    }
    
    // パスワードを変更
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('パスワード変更エラー:', error);
    throw error;
  }
};

// テーマ設定を更新
export const updateTheme = async (theme: 'light' | 'dark'): Promise<Profile> => {
  try {
    return await updateProfile({ theme_preference: theme });
  } catch (error) {
    console.error('テーマ更新エラー:', error);
    throw error;
  }
};
