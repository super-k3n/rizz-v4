import Constants from 'expo-constants';

/**
 * 環境変数を取得するヘルパー関数
 * @param key 取得したい環境変数のキー
 * @returns 環境変数の値（存在しない場合はundefined）
 */
export function getEnv(key: string): string | undefined {
  return Constants.expoConfig?.extra?.[key];
}

/**
 * 全ての環境変数をコンソールに出力する（デバッグ用）
 */
export function logAllEnv(): void {
  console.log('===== Environment Variables =====');
  console.log('process.env:', Object.keys(process.env));
  console.log('Constants.expoConfig:', Constants.expoConfig);
  console.log('Constants.expoConfig.extra:', Constants.expoConfig?.extra);
  console.log('EXPO_PUBLIC_SUPABASE_URL:', getEnv('EXPO_PUBLIC_SUPABASE_URL'));
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY exists:', !!getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'));
  console.log('===============================');
}
