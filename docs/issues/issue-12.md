# イシュータイトル
統計データページの実装

## 概要
ユーザーの活動データを視覚的に分析できるように、日次、週次、月次、年次の統計データをグラフで表示する機能を実装します。各期間のグラフでは、実績値と目標値を同時に表示し、その差分を視覚的に把握できるようにします。実績データは日次データを基に各期間で集計し、目標データは日次と他の期間でテーブルが異なることに注意して実装を行います。

## 実施内容

### パート1: データ取得APIの実装
- [x] 期間別データ集計APIの実装
  - [x] 日次データの集計クエリ
    - [x] 実績値：`daily_records`テーブルから日付ごとに集計
    - [x] 目標値：`daily_goals`テーブルから日付ごとに取得
  - [x] 週次データの集計クエリ
    - [x] 実績値：`daily_records`テーブルから週ごとに集計
    - [x] 目標値：`goals`テーブルから週次（weekly）データを取得
  - [x] 月次データの集計クエリ
    - [x] 実績値：`daily_records`テーブルから月ごとに集計
    - [x] 目標値：`goals`テーブルから月次（monthly）データを取得
  - [x] 年次データの集計クエリ
    - [x] 実績値：`daily_records`テーブルから年ごとに集計
    - [x] 目標値：`goals`テーブルから年次（yearly）データを取得
- [x] パフォーマンス最適化
  - [x] インデックスの設定（日付カラムの最適化）
  - [x] キャッシュ戦略の検討
  - [x] クエリの効率化

### パート2: フロントエンド実装
- [ ] グラフコンポーネントの実装
  - [ ] 実績値と目標値を同時表示する折れ線グラフの基本実装
  - [ ] 目標値と実績値の差分の視覚化（エリアチャートやカラーコードなど）
  - [ ] データ表示の最適化
  - [ ] インタラクティブ機能の追加
    - [ ] ホバー時の詳細表示（実績値、目標値、達成率など）
    - [ ] 凡例のクリックによる表示/非表示切り替え
- [ ] タブ切り替え機能の実装（PeriodSelector.tsxを参考）
  - [ ] 期間選択UIの作成
  - [ ] データ更新ロジックの実装
  - [ ] ローディング状態の管理
- [ ] レスポンシブ対応
  - [ ] モバイル表示の最適化
  - [ ] グラフサイズの動的調整

```PeriodSelector.tsx
<SegmentedButtons
  value={value}
  onValueChange={(newValue) => onChange(newValue as PeriodType)}
  buttons={[
    {
      value: 'daily',
      label: '日次',
      style: value === 'daily' ? styles.selectedButton : styles.button,
    },
    {
      value: 'weekly',
      label: '週次',
      style: value === 'weekly' ? styles.selectedButton : styles.button,
    },
    {
      value: 'monthly',
      label: '月次',
      style: value === 'monthly' ? styles.selectedButton : styles.button,
    },
    {
      value: 'yearly',
      label: '年次',
      style: value === 'yearly' ? styles.selectedButton : styles.button,
    },
  ]}
  style={styles.segmentedButtons}
/>
```

### パート3: 状態管理とキャッシュ
- [ ] Contextの実装
  - [ ] 統計データの状態管理
  - [ ] 期間選択の状態管理
  - [ ] エラー処理の実装
- [ ] キャッシュ戦略の実装
  - [ ] データのメモ化
  - [ ] 再取得条件の設定
  - [ ] キャッシュの更新ロジック

## 参照資料
- [@002_er.md](ER図定義書)
- [@003_api.md](API設計書)
- [@250424-11.md](日次目標の日付別管理機能の実装ログ)
- [@250424-12.md](統計データページの実装 - パート1: データ取得API)

## 完了条件
- [ ] 各期間（日次、週次、月次、年次）のデータが正しく表示されること
- [ ] タブ切り替えが円滑に動作すること
- [ ] グラフが視覚的に見やすく、インタラクティブな機能が実装されていること
- [ ] データの更新が適切なタイミングで行われること
- [ ] パフォーマンスに問題がないこと
- [ ] モバイル表示が最適化されていること

## 実装方針

### データ型定義
```typescript
interface StatisticsData {
  date: string;
  approached: number;
  getContacts: number;
  instantDates: number;
  instantCv: number;
  approachedTarget?: number;
  getContactsTarget?: number;
  instantDatesTarget?: number;
  instantCvTarget?: number;
}

interface StatisticsContextType {
  data: Record<PeriodType, StatisticsData[]>;
  loading: boolean;
  error: Error | null;
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  fetchData: (period: PeriodType, startDate: string, endDate: string) => Promise<void>;
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';
```

### データ集計クエリ例

#### 日次データ集計
```sql
WITH daily_stats AS (
  SELECT
    dr.target_date,
    COUNT(*) as approached,
    COUNT(*) FILTER (WHERE contact_acquired = true) as get_contacts,
    COUNT(*) FILTER (WHERE instant_date = true) as instant_dates,
    COUNT(*) FILTER (WHERE instant_cv = true) as instant_cv
  FROM daily_records dr
  WHERE dr.user_id = auth.uid()
  AND dr.target_date BETWEEN $1 AND $2
  GROUP BY dr.target_date
)
SELECT
  ds.target_date as date,
  ds.approached,
  ds.get_contacts,
  ds.instant_dates,
  ds.instant_cv,
  dg.approached_target,
  dg.get_contacts_target,
  dg.instant_dates_target,
  dg.instant_cv_target
FROM daily_stats ds
LEFT JOIN daily_goals dg
  ON ds.target_date = dg.target_date
  AND dg.user_id = auth.uid()
ORDER BY ds.target_date;
```

#### 週次データ集計
```sql
WITH weekly_stats AS (
  SELECT
    date_trunc('week', dr.target_date) as week_start,
    COUNT(*) as approached,
    COUNT(*) FILTER (WHERE contact_acquired = true) as get_contacts,
    COUNT(*) FILTER (WHERE instant_date = true) as instant_dates,
    COUNT(*) FILTER (WHERE instant_cv = true) as instant_cv
  FROM daily_records dr
  WHERE dr.user_id = auth.uid()
  AND dr.target_date BETWEEN $1 AND $2
  GROUP BY date_trunc('week', dr.target_date)
)
SELECT
  ws.week_start as date,
  ws.approached,
  ws.get_contacts,
  ws.instant_dates,
  ws.instant_cv,
  g.approached_target,
  g.get_contacts_target,
  g.instant_dates_target,
  g.instant_cv_target
FROM weekly_stats ws
LEFT JOIN goals g
  ON g.user_id = auth.uid()
  AND g.period_type = 'weekly'
  AND g.start_date <= ws.week_start
  AND g.end_date >= ws.week_start
ORDER BY ws.week_start;
```

#### 月次データ集計
```sql
WITH monthly_stats AS (
  SELECT
    date_trunc('month', dr.target_date) as month_start,
    COUNT(*) as approached,
    COUNT(*) FILTER (WHERE contact_acquired = true) as get_contacts,
    COUNT(*) FILTER (WHERE instant_date = true) as instant_dates,
    COUNT(*) FILTER (WHERE instant_cv = true) as instant_cv
  FROM daily_records dr
  WHERE dr.user_id = auth.uid()
  AND dr.target_date BETWEEN $1 AND $2
  GROUP BY date_trunc('month', dr.target_date)
)
SELECT
  ms.month_start as date,
  ms.approached,
  ms.get_contacts,
  ms.instant_dates,
  ms.instant_cv,
  g.approached_target,
  g.get_contacts_target,
  g.instant_dates_target,
  g.instant_cv_target
FROM monthly_stats ms
LEFT JOIN goals g
  ON g.user_id = auth.uid()
  AND g.period_type = 'monthly'
  AND g.start_date <= ms.month_start
  AND g.end_date >= ms.month_start
ORDER BY ms.month_start;
```

### データ型定義の更新
```typescript
interface StatisticsData {
  date: string;
  approached: number;
  getContacts: number;
  instantDates: number;
  instantCv: number;
  approachedTarget?: number;
  getContactsTarget?: number;
  instantDatesTarget?: number;
  instantCvTarget?: number;
}

// 期間ごとのデータ取得関数の型
interface StatisticsService {
  getDailyStats: (startDate: string, endDate: string) => Promise<StatisticsData[]>;
  getWeeklyStats: (startDate: string, endDate: string) => Promise<StatisticsData[]>;
  getMonthlyStats: (startDate: string, endDate: string) => Promise<StatisticsData[]>;
  getYearlyStats: (startDate: string, endDate: string) => Promise<StatisticsData[]>;
}

// データ取得時のパラメータ
interface FetchDataParams {
  period: PeriodType;
  startDate: string;
  endDate: string;
}
```

### パフォーマンス考慮事項
- 適切なインデックス設定
  - `daily_records.target_date`
  - `daily_records.user_id, daily_records.target_date`
  - `daily_goals.target_date`
  - `daily_goals.user_id, daily_goals.target_date`
  - `goals.period_type`
  - `goals.user_id, goals.period_type`
- データのプリフェッチ
- メモ化によるレンダリング最適化
- 期間に応じた適切なデータ取得範囲の設定
- キャッシュの有効活用

### エラーハンドリング
- データ取得エラーの処理
- 表示データの整合性チェック
- ユーザーへのエラー通知
- リトライロジックの実装

### UI/UX方針
- シンプルで直感的なインターフェース
- 実績値と目標値の視覚的な区別
  - 実績値：実線
  - 目標値：破線
  - 差分：半透明のエリア表示
- スムーズなアニメーション
- 適切なローディング表示
- レスポンシブデザイン
- アクセシビリティへの配慮
  - カラーコントラストの確保
  - スクリーンリーダー対応
  - キーボード操作のサポート
