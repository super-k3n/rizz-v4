# イシュータイトル
日次目標の日付別管理機能の実装

## 概要
現在の`goals`テーブルでは日次目標を日付ごとに管理できない課題があります。`daily_records`テーブルと同様に、日次目標も日付ごとに管理できるように改修を行います。これにより、ユーザーは日付ごとに異なる目標を設定できるようになり、より柔軟な目標管理が可能になります。

## 実施内容

### パート1: データベース設計と移行
- [x] `daily_goals`テーブルの作成
  - [x] 必要なカラムの設定
  - [x] インデックスの作成
  - [x] RLSポリシーの設定
- [x] データ移行スクリプトの作成
  - [x] 既存の日次目標データの移行
  - [x] 移行後の整合性チェック
- [x] `goals`テーブルからの日次目標データの削除（移行完了後）

### パート2: APIとバックエンド実装
- [x] Supabase APIの実装
  - [x] 日次目標のCRUD操作
  - [x] 日付範囲での目標取得
  - [x] バッチ更新処理
- [x] バリデーションの実装
  - [x] 入力値の検証
  - [x] 日付の重複チェック

### パート3: フロントエンド実装（最小限の変更）
- [x] GoalContextの修正
  - [x] 日次目標の状態管理
  - [x] 日付ごとの目標管理
  - [x] キャッシュ戦略の実装
- [x] UI/UXの更新（既存のUIを維持）
  - [x] 目標設定フォームの内部ロジック修正
  - [x] 既存の表示方法を維持しながらデータ取得ロジックの更新
  - [x] エラーハンドリングの実装

## 参照資料
- [@002_er.md](ER図定義書)
- [@003_api.md](API設計書)
- [@250422-9.md](目標値のDB保存と表示機能の実装ログ)
- [@250424-11.md](日次目標の日付別管理機能の実装ログ)

## 完了条件
- [x] 日付ごとに個別の目標設定が可能になっていること
- [x] 既存の日次目標データが正しく移行されていること
- [x] `daily_records`テーブルとの関連付けが適切に機能すること
- [x] 目標の設定・更新・削除が正常に動作すること
- [x] バリデーションが適切に機能すること
- [x] パフォーマンスに問題がないこと
- [x] 既存のUIの使用感が維持されていること

## 実装方針

### データベース設計
```sql
-- daily_goalsテーブルの作成
CREATE TABLE daily_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  target_date date not null,
  approached_target int not null,
  get_contacts_target int not null,
  instant_dates_target int not null,
  instant_cv_target int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- ユニーク制約
  constraint daily_goals_user_date_key unique(user_id, target_date)
);

-- インデックスの作成
CREATE INDEX daily_goals_user_date_idx ON daily_goals(user_id, target_date);

-- RLSポリシーの設定
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily goals"
ON daily_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily goals"
ON daily_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily goals"
ON daily_goals FOR UPDATE
USING (auth.uid() = user_id);
```

### 型定義
```typescript
interface DailyGoal {
  id: string;
  user_id: string;
  target_date: string; // YYYY-MM-DD形式
  approached_target: number;
  get_contacts_target: number;
  instant_dates_target: number;
  instant_cv_target: number;
  created_at: string;
  updated_at: string;
}

interface DailyGoalContextType {
  goals: Record<string, DailyGoal>; // 日付をキーとしたマップ
  loading: boolean;
  error: Error | null;
  setGoal: (date: string, values: Partial<DailyGoal>) => Promise<void>;
  getGoal: (date: string) => DailyGoal | null;
  getGoalsByDateRange: (startDate: string, endDate: string) => Promise<DailyGoal[]>;
  deleteGoal: (date: string) => Promise<void>;
}
```

### バリデーションスキーマ
```typescript
const dailyGoalValidationSchema = Yup.object().shape({
  target_date: Yup.date()
    .required('日付は必須です'),
  approached_target: Yup.number()
    .integer('整数で入力してください')
    .min(1, '1以上の値を入力してください')
    .required('声かけ目標は必須です'),
  get_contacts_target: Yup.number()
    .integer('整数で入力してください')
    .min(0, '0以上の値を入力してください')
    .max(Yup.ref('approached_target'), '声かけ目標以下の値を入力してください')
    .required('連絡先取得目標は必須です'),
  instant_dates_target: Yup.number()
    .integer('整数で入力してください')
    .min(0, '0以上の値を入力してください')
    .max(Yup.ref('get_contacts_target'), '連絡先取得目標以下の値を入力してください')
    .required('即日デート目標は必須です'),
  instant_cv_target: Yup.number()
    .integer('整数で入力してください')
    .min(0, '0以上の値を入力してください')
    .max(Yup.ref('instant_dates_target'), '即日デート目標以下の値を入力してください')
    .required('即日関係構築目標は必須です'),
});
```

### データ移行戦略
1. 新テーブルの作成とRLSポリシーの設定
2. 既存データの移行（ダウンタイムなし）
3. アプリケーションの更新
4. 移行の確認と検証
5. 古いデータの削除

### パフォーマンス考慮事項
- インデックスの適切な設定
- 日付範囲でのクエリ最適化
- キャッシュ戦略の実装
- バッチ処理の活用

### エラーハンドリング
- ネットワークエラーの処理
- 重複データの処理
- バリデーションエラーの表示
- 整合性エラーの処理

### セキュリティ考慮事項
- RLSポリシーの適切な設定
- ユーザー認証の確認
- 入力値のサニタイズ
- アクセス制御の実装

### UI/UX方針
- 既存のUIコンポーネントとレイアウトを維持
- 内部的なデータ管理のみを変更し、ユーザー体験は現状を維持
- 将来的なUI改善のための拡張性は確保しつつ、今回は最小限の変更に留める
- エラー表示やローディング状態は既存の実装を踏襲
