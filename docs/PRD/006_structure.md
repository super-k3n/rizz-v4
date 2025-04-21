## 概要

Rizzアプリケーションは、Expo + React Nativeで構築されたモバイルアプリと、Supabaseを利用したバックエンドで構成されています。

本ドキュメントでは、アプリケーションのソースコード構造について説明します。

## ディレクトリ構造

```
rizz-app/
├── .expo/               # Expo設定ファイル
├── app/                 # Expoルーター（ページ）
│   ├── _layout.tsx      # レイアウト設定
│   ├── index.tsx        # ホーム画面（カウンター）
│   ├── goal/            # 目標設定画面
│   ├── data/            # 統計データ画面
│   └── setting/         # 設定画面
├── src/                 # ソースコード
│   ├── components/      # 共通コンポーネント
│   ├── contexts/        # Contextプロバイダー
│   ├── hooks/           # カスタムフック
│   ├── lib/             # 共通ライブラリ
│   ├── services/        # API連携サービス
│   ├── types/           # 型定義
│   └── utils/           # ユーティリティ関数
├── assets/              # 画像、フォントなどの静的ファイル
├── app.json             # Expoアプリ設定
├── eas.json             # EASビルド設定
├── package.json         # 依存パッケージ設定
└── tsconfig.json        # TypeScript設定
```

## 主要ディレクトリの内容

### app/ - Expoルーター

Expoルーターによるファイルベースのルーティングを採用しています。各ファイルは対応するページコンポーネントを表します。

```
app/
├── _layout.tsx          # 全体レイアウト（BottomNavigation含む）
├── index.tsx            # ホーム画面（カウンターボタン+プログレスバー）
├── goal/
│   └── index.tsx        # 目標設定画面
├── data/
│   └── index.tsx        # 統計データ画面（グラフ表示）
└── setting/
    └── index.tsx        # 設定画面（プロフィール、認証設定）
```

### src/components/ - 共通コンポーネント

再利用可能なUIコンポーネントを格納します。

```
components/
├── common/              # 汎用コンポーネント
│   ├── Button.tsx       # カスタムボタン
│   ├── Card.tsx         # カードコンポーネント
│   ├── Loading.tsx      # ローディング表示
│   └── ErrorMessage.tsx # エラーメッセージ
├── counter/             # カウンター関連コンポーネント
│   ├── CounterButton.tsx       # カウンターボタン
│   └── ProgressDisplay.tsx     # 進捗表示
├── goal/                # 目標設定関連コンポーネント
│   ├── GoalForm.tsx     # 目標入力フォーム
│   └── PeriodSelector.tsx # 期間選択UI
├── data/                # データ分析関連コンポーネント
│   ├── Chart.tsx        # グラフコンポーネント
│   ├── DataTable.tsx    # データテーブル
│   └── PeriodFilter.tsx # 期間フィルター
└── settings/            # 設定関連コンポーネント
    ├── ProfileForm.tsx  # プロフィール編集フォーム
    └── AuthSettings.tsx # 認証設定
```

### src/contexts/ - コンテキストプロバイダー

アプリケーション全体で共有される状態管理のためのContextを提供します。

```
contexts/
├── AuthContext.tsx      # 認証状態管理
└── RecordContext.tsx    # 記録データ状態管理
```

### src/hooks/ - カスタムフック

React Hooksの機能を拡張したカスタムフックを提供します。

```
hooks/
├── useAuth.ts           # 認証関連フック
├── useCounter.ts        # カウンター操作フック
├── useGoal.ts           # 目標設定フック
├── useRecord.ts         # 記録データフック
└── useStats.ts          # 統計データフック
```

### src/services/ - API連携サービス

Supabaseとの通信を担当するサービスモジュールです。

```
services/
├── supabase.ts          # Supabaseクライアント初期化
├── auth.ts              # 認証関連API
├── record.ts            # 記録関連API
├── goal.ts              # 目標設定関連API
└── stats.ts             # 統計データ関連API
```

### src/types/ - 型定義

TypeScriptの型定義ファイルを格納します。

```
types/
├── auth.ts              # 認証関連の型
├── record.ts            # 記録データの型
├── goal.ts              # 目標設定の型
├── stats.ts             # 統計データの型
└── supabase.ts          # Supabase関連の型
```

### src/utils/ - ユーティリティ関数

共通のヘルパー関数を提供します。

```
utils/
├── date.ts              # 日付操作ユーティリティ
├── storage.ts           # ローカルストレージ操作
├── validation.ts        # バリデーション関数
└── analytics.ts         # 分析用ユーティリティ
```

## データフロー

アプリケーションのデータフローは以下の通りです：

1. **ユーザー操作** → コンポーネントのイベントハンドラ
2. **イベントハンドラ** → カスタムフックの関数呼び出し
3. **カスタムフック** → Contextの状態更新とサービス呼び出し
4. **サービス** → Supabase APIとの通信
5. **Supabase** → データベース操作（PostgreSQL）
6. **結果** → サービス → カスタムフック → Context更新 → UI再レンダリング

## 主要ファイルの役割

### カウンター機能

- `app/index.tsx` - ホーム画面のメインコンポーネント
- `src/components/counter/CounterButton.tsx` - カウンター操作ボタン
- `src/hooks/useCounter.ts` - カウンター操作ロジック
- `src/services/record.ts` - 記録データAPI連携

### 目標設定機能

- `app/goal/index.tsx` - 目標設定画面
- `src/components/goal/GoalForm.tsx` - 目標入力フォーム
- `src/hooks/useGoal.ts` - 目標操作ロジック
- `src/services/goal.ts` - 目標データAPI連携

### 統計データ表示

- `app/data/index.tsx` - 統計データ画面
- `src/components/data/Chart.tsx` - グラフ表示コンポーネント
- `src/hooks/useStats.ts` - 統計データ取得ロジック
- `src/services/stats.ts` - 統計データAPI連携

## データベースとの連携

Supabaseを使用して、以下のテーブルとの連携を行います：

1. **users** - ユーザー情報
2. **daily_records** - 日次記録データ
3. **goals** - 目標設定データ

詳細なテーブル構造はER図ドキュメントを参照してください。

## 認証フロー

4. `src/contexts/AuthContext.tsx` で認証状態を管理
5. `src/services/auth.ts` でSupabase Authとの連携
6. ログイン/ログアウト状態に応じたナビゲーション制御

## オフライン対応

7. `src/utils/storage.ts` でローカルストレージ操作
8. オフライン時のデータキャッシュとオンライン復帰時の同期処理

## スタイリング

React Native PaperとExpo Vector Iconsを使用したUIコンポーネント実装。

## まとめ

Rizzアプリケーションは、Expo + React NativeとSupabaseを組み合わせた現代的なアーキテクチャを採用しています。TypeScriptによる型安全性を確保しながら、Context APIとカスタムフックによる状態管理を実現しています。

ファイルベースのルーティングにより直感的なページ管理を実現し、コンポーネントの再利用性と責務の分離を意識した構造になっています。
