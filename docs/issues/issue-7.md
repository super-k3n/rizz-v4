# イシュータイトル
状態管理の実装 - 記録データと目標設定の状態管理

## 概要
前回のイシュー#6で実装したホーム画面レイアウトと目標設定UIを活用し、アプリケーション全体での状態管理を実装します。特に記録データ（カウンター値）と目標設定データをContext APIを用いて管理し、異なる画面間でのデータ共有を可能にします。また、ホーム画面の実績/目標進捗プログレスバーを正常に表示できるようにします。

## 実施内容

### パート1: 記録データ管理のContext実装
- [ ] RecordContextの実装
  - [ ] 記録データの型定義
  - [ ] RecordContextとRecordProviderの作成
  - [ ] 記録データCRUD操作用のカスタムフック実装
  - [ ] AsyncStorageとの連携
- [x] 既存のuseCounterフックとの統合
  - [x] useCounterフックの機能をCounterContextに移行
  - [x] カウンター操作のAPIをContext経由で提供

### パート2: 目標設定のContext実装
- [ ] GoalContextの実装
  - [ ] 目標データの型定義
  - [ ] GoalContextとGoalProviderの作成
  - [ ] 目標CRUD操作用のカスタムフック実装
  - [ ] AsyncStorageとの連携
- [ ] 目標設定画面との統合
  - [ ] 目標設定フォームをContextと連携
  - [ ] 期間（日次/週次/月次/年次）ごとの目標管理

### パート3: ホーム画面の進捗表示改善
- [ ] プログレスバーの表示ロジック改善
  - [ ] Context経由でのデータ取得
  - [ ] 期間に応じた進捗表示
  - [ ] 目標未設定時のフォールバック表示
- [ ] 実績値表示の改善
  - [ ] 合計値の計算と表示
  - [ ] 達成率の計算と表示

### パート4: パフォーマンス最適化
- [ ] メモ化（useMemo, useCallback）の適用
  - [ ] 不要な再レンダリングの防止
  - [ ] 計算コストの高い処理の最適化
- [ ] Context分割の最適化
  - [ ] 必要に応じたContextの分割
  - [ ] 更新頻度に応じた設計

## 参照資料
- [@000_overview.md](プロジェクト概要・ブランディングカラー定義)
- [@001_techstack.md](技術スタック定義書)
- [@004_pages.md](ページ構成定義書)
- [@005_core.md](コア機能処理フロー)
- [@006_structure.md](アプリケーション構造定義書)

## 完了条件
- [x] CounterContextが実装され、カウンター操作が正常に動作すること
- [ ] RecordContextが実装され、記録データの永続化が正常に動作すること
- [ ] GoalContextが実装され、目標設定が正常に機能すること
- [ ] ホーム画面のプログレスバーが正しく進捗を表示すること
- [ ] 期間（日次/週次/月次/年次）の切り替えに応じて、適切なデータが表示されること
- [ ] アプリ再起動後もデータが保持されていること（AsyncStorageとの連携）
- [ ] UIの応答性が良好であり、不要な再レンダリングが発生していないこと

## 実装方針

### 状態管理アーキテクチャ
React Context APIを用いた状態管理アーキテクチャを採用します：

```typescript
// 記録データの状態管理構造
interface RecordContextType {
  records: Record<string, DailyRecord>;
  addRecord: (type: CounterType, date: string, count?: number) => Promise<void>;
  getRecordByDate: (date: string) => DailyRecord | null;
  getRecordsByPeriod: (period: PeriodType, startDate: string) => PeriodicRecord;
  loading: boolean;
}

// 目標設定の状態管理構造
interface GoalContextType {
  goals: Record<PeriodType, GoalValues>;
  setGoal: (period: PeriodType, values: GoalValues) => Promise<void>;
  getGoal: (period: PeriodType) => GoalValues;
  loading: boolean;
}
```

### データモデル設計
効率的なデータ管理のために以下のデータモデルを設計します：

```typescript
// カウンタータイプ
export type CounterType = 'approached' | 'getContact' | 'instantDate' | 'instantCv';

// 期間タイプ
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

// 日次記録データ
export interface DailyRecord {
  date: string;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
}

// 期間ごとの集計記録
export interface PeriodicRecord {
  period: PeriodType;
  startDate: string;
  endDate: string;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
}

// 目標値
export interface GoalValues {
  period: PeriodType;
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
}
```

### 永続化戦略
AsyncStorageを使用したデータ永続化を実装します：

```typescript
// 記録データの永続化
const RECORDS_STORAGE_KEY = '@rizz_records';
const saveRecords = async (records: Record<string, DailyRecord>) => {
  await AsyncStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
};
const loadRecords = async (): Promise<Record<string, DailyRecord>> => {
  const data = await AsyncStorage.getItem(RECORDS_STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

// 目標データの永続化
const GOALS_STORAGE_KEY = '@rizz_goals';
const saveGoals = async (goals: Record<PeriodType, GoalValues>) => {
  await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
};
const loadGoals = async (): Promise<Record<PeriodType, GoalValues>> => {
  const data = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
  return data ? JSON.parse(data) : getDefaultGoals();
};
```

### 期間計算ロジック
異なる期間（日次/週次/月次/年次）のデータを管理するための計算ロジックを実装します：

```typescript
// 日付から週の開始日を計算
const getWeekStartDate = (date: Date): string => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 週の開始を月曜に調整
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

// 日付から月の開始日を計算
const getMonthStartDate = (date: Date): string => {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
};

// 日付から年の開始日を計算
const getYearStartDate = (date: Date): string => {
  return new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0];
};

// 期間タイプに基づいて開始日を計算
const getStartDateByPeriod = (period: PeriodType, date: Date): string => {
  switch (period) {
    case 'daily':
      return date.toISOString().split('T')[0];
    case 'weekly':
      return getWeekStartDate(date);
    case 'monthly':
      return getMonthStartDate(date);
    case 'yearly':
      return getYearStartDate(date);
  }
};
```

### パフォーマンス最適化
パフォーマンスを最適化するための戦略を実装します：

1. コンテキスト分割
   - RecordContextとGoalContextを分離し、更新頻度に応じた最適化
   - 更新頻度の高いデータ（カウンター値）と低いデータ（目標設定）を分離

2. メモ化による最適化
   - useMemoを使用した計算コストの高い処理の最適化
   - useCallbackを使用した関数の安定化

3. ローディング状態管理
   - 非同期操作中のローディング状態表示
   - 操作完了後の適切なUI更新

4. データ取得の遅延読み込み
   - 必要に応じたデータ取得
   - キャッシュ戦略の実装

### 次のイシューへの接続
このイシュー（#7）が完了すると、Supabase連携（記録）のイシュー#8へ進みます。データモデルと状態管理アーキテクチャが整っていることで、Supabaseとの連携がスムーズに行えるようになります。

## 次にやるべきこと
1. RecordContextの実装
   - 記録データの型定義
   - RecordContextとRecordProviderの作成
   - 記録データCRUD操作用のカスタムフック実装
   - AsyncStorageとの連携

2. GoalContextの実装
   - 目標データの型定義
   - GoalContextとGoalProviderの作成
   - 目標CRUD操作用のカスタムフック実装
   - AsyncStorageとの連携

3. ホーム画面の進捗表示改善
   - プログレスバーの表示ロジック改善
   - 実績値表示の改善

4. パフォーマンス最適化
   - メモ化（useMemo, useCallback）の適用
   - Context分割の最適化
