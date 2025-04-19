import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

/**
 * 認証状態に基づいてリダイレクトするカスタムフック
 * - 認証が必要なルートで未認証の場合はログイン画面にリダイレクト
 * - 認証済みでログイン/サインアップ画面にいる場合はホーム画面にリダイレクト
 */
export function useRedirectByAuth() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // ロード中は何もしない
    if (isLoading) {
      return;
    }

    // 現在のルートが認証必須か判定（(auth)グループ以外は認証必須）
    const isAuthGroup = segments[0] === '(auth)';
    
    // リダイレクト状態を追跡するためのフラグ
    const shouldRedirectToLogin = !user && !isAuthGroup;
    const shouldRedirectToHome = user && isAuthGroup;

    // 一度だけリダイレクトを実行
    if (shouldRedirectToLogin) {
      // 未認証かつ認証必須ルートにいる場合はログイン画面へ
      console.log('未認証のためログイン画面へリダイレクトします');
      router.replace('/(auth)/login');
    } else if (shouldRedirectToHome) {
      // 認証済みかつ認証系画面にいる場合はホーム画面へ
      console.log('認証済みのためホーム画面へリダイレクトします');
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);
}
