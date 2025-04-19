import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as authService from '../lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 認証状態の型定義
interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

// AuthContextで提供する値の型定義
interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

// AuthContextの作成
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProviderのpropsの型定義
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProviderコンポーネント
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    error: null,
  });

  // 初期化時にセッション情報を取得
  useEffect(() => {
    // 保存されたセッション情報を取得する関数
    async function loadSession() {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        // オフライン時のために保存されたセッション情報を確認
        const storedSession = await AsyncStorage.getItem('session');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          setState((prev) => ({
            ...prev,
            session: parsedSession.session,
            user: parsedSession.user,
            isLoading: false
          }));
        }

        // Supabaseからの最新のセッション情報を取得
        const { session, error } = await authService.getSession();

        if (error) throw error;

        // セッションがある場合は状態を更新し、AsyncStorageに保存
        if (session) {
          setState((prev) => ({
            ...prev,
            session,
            user: session.user,
            isLoading: false
          }));

          await AsyncStorage.setItem('session', JSON.stringify({
            session,
            user: session.user,
          }));
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('セッション読み込みエラー:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error(String(error)),
          isLoading: false
        }));
      }
    }

    // 初期セッション読み込み
    loadSession();

    // セッション変更監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        // セッションが存在する場合は常に認証済みとして扱う
        if (session) {
          console.log('認証状態が変更されました - ユーザーは認証済みです');
          setState((prev) => ({
            ...prev,
            session,
            user: session.user || null,
          }));

          // セッションの変更をAsyncStorageに保存
          await AsyncStorage.setItem('session', JSON.stringify({
            session,
            user: session.user,
          }));
        } else {
          console.log('認証状態が変更されました - ユーザーは未認証です');
          setState((prev) => ({
            ...prev,
            session: null,
            user: null,
          }));
          await AsyncStorage.removeItem('session');
        }
      }
    );

    // クリーンアップ関数
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // サインアップ処理
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { user, session, error } = await authService.signUp(email, password, name);

      if (error) throw error;

      // メール確認ステータスに関わらず認証済みとして扱う
      setState((prev) => ({
        ...prev,
        user,
        session,
        isLoading: false
      }));

      // サインアップ成功をログ
      console.log('サインアップ成功:', user?.id);

      // セッションがない場合は自動ログインを試行した結果として処理
      if (!session) {
        console.log('セッションがないため、追加の処理は行いません');
      }
    } catch (error) {
      console.error('サインアップエラー:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoading: false
      }));
      throw error;
    }
  };

  // サインイン処理
  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { user, session, error } = await authService.signIn(email, password);

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        user,
        session,
        isLoading: false
      }));
    } catch (error) {
      console.error('サインインエラー:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoading: false
      }));
      throw error;
    }
  };

  // サインアウト処理
  const signOut = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { error } = await authService.signOut();

      if (error) throw error;

      setState({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });

      // ローカルストレージからセッション情報を削除
      await AsyncStorage.removeItem('session');
    } catch (error) {
      console.error('サインアウトエラー:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoading: false
      }));
      throw error;
    }
  };

  // パスワードリセット処理
  const resetPassword = async (email: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { error } = await authService.resetPassword(email);

      setState((prev) => ({ ...prev, isLoading: false }));

      return { error };
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoading: false
      }));
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  // AuthContextに提供する値
  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// カスタムフック: useAuth
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
