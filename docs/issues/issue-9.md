# イシュータイトル
Supabase連携（目標値） - 目標値のCRUD操作実装

## 概要
前回のイシュー #8 で実装したSupabase連携の基盤を活用し、目標値のCRUD操作を実装します。これにより、ユーザーの目標値データをクラウドに保存し、デバイス間での同期やバックアップが可能になります。また、オフライン時の目標値設定と、オンライン復帰時の同期機能も実装します。

## 実施内容

### パート1: Supabase連携サービスの実装
- [ ] `services/goal.ts` ファイルの作成
  - [ ] Supabaseクライアントの初期化
  - [ ] `goals` テーブルへのCRUD操作の実装
  - [ ] タイプセーフなAPIの設計
- [ ] エラーハンドリングとリトライロジックの実装
  - [ ] ネットワークエラーの処理
  - [ ] データ整合性エラーの処理
  - [ ] 適切なエラーメッセージの表示

### パート2: GoalContextの実装
- [ ] `contexts/GoalContext.tsx` の作成
  - [ ] 目標値データの型定義の拡張
  - [ ] GoalContextとGoalProviderの実装
  - [ ] AsyncStorageとSupabaseの連携
- [ ] CounterContextとの統合
  - [ ] 目標値設定時のSupabase更新処理
  - [ ] データ同期の最適化

### パート3: オフライン対応の強化
- [ ] オフライン目標値キューの実装
  - [ ] AsyncStorageを使用したオフライン変更の保存
  - [ ] 変更キューの管理
- [ ] ネットワーク状態監視の実装
  - [ ] NetInfoを使用したネットワーク状態確認
  - [ ] オンライン復帰時の同期処理

### パート4: APIエンドポイントの詳細実装
- [ ] 以下のAPIエンドポイントの実装
  - [ ] `getGoals()`: 目標値の取得
  - [ ] `upsertGoal(goalData: GoalData)`: 目標値の作成/更新
  - [ ] `deleteGoal(goalId: string)`: 目標値の削除
  - [ ] `resetGoals()`: 目標値のリセット

## 参照資料
- [@000_overview.md](プロジェクト概要・ブランディングカラー定義)
- [@001_techstack.md](技術スタック定義書)
- [@002_db.md](データベース設計書)
- [@003_api.md](API設計書)
- [@005_core.md](コア機能処理フロー)
- [@006_structure.md](アプリケーション構造定義書)

## 完了条件
- [ ] 目標値の設定がSupabaseに正しく保存されること
- [ ] オフライン時にも目標値設定が可能であること
- [ ] オンライン復帰時に、オフラインで設定した目標値が自動的に同期されること
- [ ] エラー発生時に適切なフィードバックが表示されること
- [ ] 目標値データが永続化され、アプリ再起動後も保持されていること
- [ ] 複数デバイスでのデータ同期が正常に動作すること
- [ ] 型安全性が確保されていること

## 実装方針

### Supabase連携アーキテクチャ
Supabaseとの連携は以下のアーキテクチャで実装します：

```typescript
// 目標値のインターフェース
export interface GoalData {
  id?: string;
  user_id: string;
  approached: number;
  get_contact: number;
  instant_date: number;
  instant_cv: number;
  created_at?: string;
  updated_at?: string;
}

// 目標値の取得
export const getGoals = async (
  userId: string
): Promise<{ data: GoalData | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

// その他のCRUD操作実装...
```

### オフライン同期戦略
オフライン時のデータ同期は以下の戦略で実装します：

```typescript
// 変更キューのインターフェース
interface GoalChangeQueueItem {
  action: 'upsert_goal' | 'delete_goal' | 'reset_goals';
  data: Partial<GoalData>;
  timestamp: number;
}

// 変更キューの保存
const saveGoalChangeQueue = async (queue: GoalChangeQueueItem[]) => {
  await AsyncStorage.setItem('offlineGoalChangeQueue', JSON.stringify(queue));
};

// 変更キューの取得
const getGoalChangeQueue = async (): Promise<GoalChangeQueueItem[]> => {
  const data = await AsyncStorage.getItem('offlineGoalChangeQueue');
  return data ? JSON.parse(data) : [];
};

// 変更キューへの追加
const addToGoalChangeQueue = async (item: GoalChangeQueueItem) => {
  const queue = await getGoalChangeQueue();
  queue.push(item);
  await saveGoalChangeQueue(queue);
};

// オンライン復帰時の同期処理
const syncOfflineGoalChanges = async (userId: string) => {
  const queue = await getGoalChangeQueue();
  if (queue.length === 0) return;

  for (const item of queue) {
    try {
      switch (item.action) {
        case 'upsert_goal':
          await upsertGoal({ ...item.data, user_id: userId });
          break;
        case 'delete_goal':
          if (item.data.id) await deleteGoal(item.data.id);
          break;
        case 'reset_goals':
          await resetGoals();
          break;
      }
    } catch (error) {
      console.error('同期エラー:', error);
      return;
    }
  }

  // 成功したら変更キューをクリア
  await AsyncStorage.removeItem('offlineGoalChangeQueue');
};
```

### GoalContextの設計
CounterContextと連携するGoalContextは以下のように設計します：

```typescript
// GoalContextの型定義
interface GoalContextType {
  goals: GoalData | null;
  loading: boolean;
  error: Error | null;
  fetchGoals: () => Promise<GoalData | null>;
  saveGoals: (data: Partial<GoalData>) => Promise<void>;
  resetGoals: () => Promise<void>;
  isOnline: boolean;
}

// GoalProviderの実装
export const GoalProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [goals, setGoals] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // ネットワーク状態監視
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!state.isConnected;
      setIsOnline(online);

      if (online) {
        // オンライン復帰時に同期
        syncOfflineGoalChanges(userId);
      }
    });

    return () => unsubscribe();
  }, []);

  // 他のメソッド実装...

  const value = {
    goals,
    loading,
    error,
    fetchGoals,
    saveGoals,
    resetGoals,
    isOnline,
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
};
```

### エラーハンドリング戦略
エラーハンドリングは以下の戦略で実装します：

```typescript
// エラータイプの定義
enum GoalErrorType {
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error',
  DATA_ERROR = 'data_error',
  UNKNOWN_ERROR = 'unknown_error',
}

// エラーハンドリングユーティリティ
const handleGoalError = (error: any): { type: GoalErrorType; message: string } => {
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

  if (error.status === 400 || error.status === 422) {
    return {
      type: GoalErrorType.DATA_ERROR,
      message: 'データエラーが発生しました。入力を確認してください。',
    };
  }

  return {
    type: GoalErrorType.UNKNOWN_ERROR,
    message: 'エラーが発生しました。しばらく経ってからお試しください。',
  };
};
```

### 次のイシューへの接続
このイシュー（#9）が完了すると、オフラインストレージのイシュー#10へ進みます。Supabase連携が整うことで、オフラインストレージとの連携がスムーズに行えるようになります。

## 次にやるべきこと
1. `services/goal.ts`の実装
   - Supabaseクライアントの初期化
   - `goals` テーブルへのCRUD操作の実装

2. `contexts/GoalContext.tsx`の実装
   - 目標値データの型定義の拡張
   - GoalContextとGoalProviderの実装

3. オフライン対応の実装
   - 変更キューの管理
   - ネットワーク状態監視

4. CounterContextとの統合
   - 目標値設定時のSupabase更新処理
   - データ同期の最適化
