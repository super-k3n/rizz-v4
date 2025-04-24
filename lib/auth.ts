import { supabase } from './supabase';

/**
 * ユーザーをメールアドレスとパスワードで登録
 */
export async function signUp(email: string, password: string, name: string) {
  try {
    // サインアップ時にメール認証をスキップするためのオプション
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        // メール確認をスキップする（開発環境用）
        emailRedirectTo: undefined
      },
    });

    if (error) throw error;

    // ユーザープロフィールをデータベースに保存
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name,
              email,
              theme_preference: 'dark', // ダークモードをデフォルトに設定
            },
          ]);

        if (profileError) {
          console.warn('プロフィール保存エラー:', profileError);
          // プロフィール保存エラーは無視して続行
        }
      } catch (profileErr) {
        console.warn('プロフィール保存例外:', profileErr);
        // プロフィール保存例外は無視して続行
      }

      // サインアップ後、すぐにログインを試みる
      if (!data.session) {
        console.log('セッションが取得できなかったため、明示的にログインを試みます');
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            console.warn('自動ログイン試行エラー:', signInError);
          } else {
            console.log('サインアップ後の自動ログインに成功しました');
            return { user: signInData.user, session: signInData.session, error: null };
          }
        } catch (signInErr) {
          console.warn('自動ログイン例外:', signInErr);
          // 自動ログイン失敗は無視して続行
        }
      }
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    // エラーメッセージを取得して表示
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('サインアップエラー:', errorMessage);
    return { user: null, session: null, error };
  }
}

/**
 * ユーザーをメールアドレスとパスワードでログイン
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('ログインエラー:', errorMessage);
    return { user: null, session: null, error };
  }
}

/**
 * 現在のセッションからユーザーをログアウト
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('ログアウトエラー:', error);
    return { error };
  }
}

/**
 * 現在のセッション情報を取得
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session, error: null };
  } catch (error) {
    console.error('セッション取得エラー:', error);
    return { session: null, error };
  }
}

/**
 * パスワードリセットのためのメールを送信
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'rizz://reset-password',
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    return { error };
  }
}
