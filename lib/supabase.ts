import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { getEnv, logAllEnv } from './env';

// 環境変数のデバッグ情報を出力
logAllEnv();

// 環境変数からSupabaseの接続情報を取得
const supabaseUrl = getEnv('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

// 環境変数が取得できない場合のフォールバック値
const fallbackUrl = 'https://ssclasajhkkcwhfeagik.supabase.co';
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY2xhc2FqaGtrY3doZmVhZ2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NzI1MDAsImV4cCI6MjA2MDM0ODUwMH0.YmBwpfb2In__PBVt7U4QpqGKlri-uS17JVaFiSsCteY';

// 実際に使用する値を決定
const actualUrl = supabaseUrl || fallbackUrl;
const actualAnonKey = supabaseAnonKey || fallbackAnonKey;

// デバッグ用にコンソールに環境変数の状態を表示
console.log('Supabase configuration:');
console.log('使用するSupabase URL:', actualUrl);
console.log('使用するSupabase Anon Key exists:', !!actualAnonKey);

// Supabaseクライアントのオプション
const supabaseOptions = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
};

// Supabaseクライアントを初期化して公開
export const supabase = createClient(
  actualUrl,
  actualAnonKey,
  supabaseOptions
);
