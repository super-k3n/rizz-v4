# イシュータイトル
Supabase連携（目標値） - 目標値のCRUD操作実装

## 概要
前回のイシュー #8 で実装したSupabase連携の基盤を活用し、目標値のCRUD操作を実装します。これにより、ユーザーの目標値データをクラウドに保存し、デバイス間での同期やバックアップが可能になります。また、オフライン時の目標値設定と、オンライン復帰時の同期機能も実装します。

## 現状の分析

### 1. 既存の実装
- `GoalContext`がすでに実装されており、AsyncStorageを使用した基本的なCRUD操作が実装されています
- `CounterContext`も実装されており、目標値の管理機能を持っています
- `services/goal.ts`が作成されており、Supabaseとの連携の基盤が整っています

### 2. 課題点
- Supabaseとの連携が完全には実装されていません
- オフライン対応の仕組みが部分的にしか実装されていません
- エラーハンドリングが不十分です

## 実装方針

### パート1: Supabase連携の完成
1. `services/goal.ts`の拡張
```typescript
// 既存のGoalDataインターフェースを活用
export interface GoalData {
  id?: string;
  user_id: string;
  approached: number;
  get_contact: number;
  instant_date: number;
  instant_cv: number;
  period: PeriodType;  // 追加
  created_at?: string;
  updated_at?: string;
}

// CRUD操作の実装
export const getGoals = async (userId: string, period: PeriodType) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('period', period)
    .single();

  return { data, error };
};

export const upsertGoal = async (goalData: GoalData) => {
  const { data, error } = await supabase
    .from('goals')
    .upsert(goalData)
    .select()
    .single();

  return { data, error };
};
```

### パート2: GoalContextの拡張
1. 既存の`GoalContext`を拡張して、Supabase連携とオフライン対応を追加
```typescript
export const GoalProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [goals, setGoals] = useState<Record<PeriodType, GoalValues>>(getDefaultGoals());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { user } = useAuth();  // 認証コンテキストからユーザー情報を取得

  // ネットワーク状態監視
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
      if (state.isConnected) {
        syncOfflineChanges();
      }
    });
    return () => unsubscribe();
  }, []);

  // 目標値の同期
  const syncGoals = async () => {
    if (!user) return;

    try {
      for (const period of ['daily', 'weekly', 'monthly', 'yearly'] as PeriodType[]) {
        const { data, error } = await getGoals(user.id, period);
        if (error) throw error;
        if (data) {
          setGoals(prev => ({
            ...prev,
            [period]: {
              period,
              approached: data.approached,
              getContact: data.get_contact,
              instantDate: data.instant_date,
              instantCv: data.instant_cv,
            }
          }));
        }
      }
    } catch (error) {
      setError(error as Error);
    }
  };

  // オフライン変更の同期
  const syncOfflineChanges = async () => {
    if (!user) return;

    const queue = await getGoalChangeQueue();
    for (const item of queue) {
      try {
        await upsertGoal({
          ...item.data,
          user_id: user.id,
          period: item.data.period as PeriodType
        });
      } catch (error) {
        console.error('同期エラー:', error);
        return;
      }
    }
    await AsyncStorage.removeItem('offlineGoalChangeQueue');
  };
};
```

### パート3: エラーハンドリングの強化
1. エラータイプの定義と処理
```typescript
export enum GoalErrorType {
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error',
  DATA_ERROR = 'data_error',
  UNKNOWN_ERROR = 'unknown_error',
}

export const handleGoalError = (error: any): { type: GoalErrorType; message: string } => {
  if (!navigator.onLine) {
    return {
      type: GoalErrorType.NETWORK_ERROR,
      message: 'ネットワーク接続がありません。オンラインに復帰すると自動的に同期されます。',
    };
  }

  if (error.status === 401 || error.status === 403) {
    return {
      type: GoalErrorType.AUTH_ERROR,
      message: '認証エラーが発生しました。再ログインしてください。',
    };
  }

  return {
    type: GoalErrorType.UNKNOWN_ERROR,
    message: 'エラーが発生しました。しばらく経ってからお試しください。',
  };
};
```

## 実装の優先順位

1. Supabase連携の完成
   - [x] `services/goal.ts`のCRUD操作実装
   - [x] エラーハンドリングの実装

2. GoalContextの拡張
   - [x] Supabase連携の統合
   - [x] オフライン対応の実装
   - [x] ネットワーク状態監視の実装

3. UI/UXの改善
   - [x] エラーメッセージの表示
   - [x] ローディング状態の表示
   - [x] オフライン状態の表示

4. テストとデバッグ
   - [x] オフライン/オンライン切り替えのテスト
   - [x] エラーケースのテスト
   - [x] データ同期のテスト

## 実装結果

### 新規作成ファイル
- `src/components/goal/GoalForm.tsx`: 目標値入力フォームコンポーネント
- `src/contexts/GoalContext.tsx`: 目標値の状態管理コンテキスト
- `src/services/goal.ts`: 目標値のCRUD操作を提供するサービス
- `src/types/goal.ts`: 目標値関連の型定義

### 修正ファイル
- `app/(tabs)/goal-settings.tsx`: 目標値設定画面の実装
- `app/(tabs)/index.tsx`: Home画面に目標値表示機能を追加
- `app/_layout.tsx`: GoalProviderの追加
- `src/hooks/useAuth.ts`: 認証フックの拡張
- `src/services/supabase.ts`: Supabaseクライアントの設定

### 影響を受けたファイル
- `contexts/CounterContext.tsx`: カウンター値と目標値の連携
- `components/counter/ProgressDisplay.tsx`: 目標値に基づく進捗表示

## 完了条件
- [x] 目標値の設定がSupabaseに正しく保存されること
- [x] オフライン時にも目標値設定が可能であること
- [x] オンライン復帰時に、オフラインで設定した目標値が自動的に同期されること
- [x] エラー発生時に適切なフィードバックが表示されること
- [x] 目標値データが永続化され、アプリ再起動後も保持されていること
- [x] 複数デバイスでのデータ同期が正常に動作すること
- [x] 型安全性が確保されていること

## 今後の課題
- 目標値の履歴管理
- 目標達成度の可視化
- パフォーマンスの最適化

## 参照資料
- [@000_overview.md](プロジェクト概要・ブランディングカラー定義)
- [@001_techstack.md](技術スタック定義書)
- [@002_db.md](データベース設計書)
- [@003_api.md](API設計書)
- [@005_core.md](コア機能処理フロー)
- [@006_structure.md](アプリケーション構造定義書)
- [250422-9.md](実装ログ)
