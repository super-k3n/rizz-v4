// app.config.js - Expoの設定を動的に構成

// .envファイルから環境変数を読み込む
import 'dotenv/config';

// フォールバック値
const fallbackUrl = 'https://ssclasajhkkcwhfeagik.supabase.co';
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY2xhc2FqaGtrY3doZmVhZ2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NzI1MDAsImV4cCI6MjA2MDM0ODUwMH0.YmBwpfb2In__PBVt7U4QpqGKlri-uS17JVaFiSsCteY';

export default {
  expo: {
    name: "rizz-v4",
    slug: "rizz-v4",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rizz",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.rizz.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.rizz.app"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      // 環境変数をExpo configのextraフィールドに追加
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || fallbackUrl,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || fallbackAnonKey,
      eas: {
        projectId: "rizz-v4"
      }
    }
  }
};
