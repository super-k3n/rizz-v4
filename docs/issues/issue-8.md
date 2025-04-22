# イシュータイトル
Supabase連携（記録） - 日次記録のCRUD操作実装

## 概要
前回のイシュー #7 で実装した状態管理（CounterContext）を活用し、Supabaseとの連携による日次記録のCRUD操作を実装します。これにより、ユーザーのストリートナンパ記録データをクラウドに保存し、デバイス間での同期やバックアップが可能になります。また、オフライン時の記録と、オンライン復帰時の同期機能も実装します。

## 実施内容

### パート1: Supabase連携サービスの実装
- [ ] `services/record.ts` ファイルの作成
  - [ ] Supabaseクライアントの初期化
  - [ ] `daily_records` テーブルへのCRUD操作の実装
  - [ ] タイプセーフなAPIの設計
- [ ] エラーハンドリングとリトライロジックの実装
  - [ ] ネットワークエラーの処理
  - [ ] データ整合性エラーの処理
  - [ ] 適切なエラーメッセージの表示

### パート2: RecordContextの実装
- [ ] `contexts/RecordContext.tsx` の作成
  - [ ] 記録データの型定義の拡張
  - [ ] RecordContextとRecordProviderの実装
  - [ ] AsyncStorageとSupabaseの連携
- [ ] CounterContextとの統合
  - [ ] カウンター操作時のSupabase更新処理
  - [ ] データ同期の最適化

### パート3: オフライン対応の強化
- [ ] オフライン記録キューの実装
  - [ ] AsyncStorageを使用したオフライン変更の保存
  - [ ] 変更キューの管理
- [ ] ネットワーク状態監視の実装
  - [ ] NetInfoを使用したネットワーク状態確認
  - [ ] オンライン復帰時の同期処理

### パート4: APIエンドポイントの詳細実装
- [ ] 以下のAPIエンドポイントの実装
  - [ ] `getDailyRecord(date: string)`: 特定日の記録取得
  - [ ] `upsertDailyRecord(recordData: DailyRecordData)`: 記録の作成/更新
  - [ ] `incrementApproached(date: string, count: number)`: 声かけ数のインクリメント
  - [ ] `incrementGetContact(date: string, count: number)`: 連絡先取得数のインクリメント
  - [ ] `incrementInstantDate(date: string, count: number)`: 即日デート数のインクリメント
  - [ ] `incrementInstantCV(date: string, count: number)`: 即数のインクリメント

## 参照資料
- [@000_overview.md](プロジェクト概要・ブランディングカラー定義)
- [@001_techstack.md](技術スタック定義書)
- [@002_db.md](データベース設計書)
- [@003_api.md](API設計書)
- [@005_core.md](コア機能処理フロー)
- [@006_structure.md](アプリケーション構造定義書)

## 完了条件
- [ ] カウンターの操作がSupabaseに正しく保存されること
- [ ] オフライン時にもカウンター操作が可能であること
- [ ] オンライン復帰時に、オフラインで記録したデータが自動的に同期されること
- [ ] エラー発生時に適切なフィードバックが表示されること
- [ ] 日次記録データが永続化され、アプリ再起動後も保持されていること
- [ ] 複数デバイスでのデータ同期が正常に動作すること
- [ ] 型安全性が確保されていること

## 実装方針

### Supabase連携アーキテクチャ
Supabaseとの連携は以下のアーキテクチャで実装します：

```typescript
// Supabaseクライアント初期化
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 日次記録のインターフェース
export interface DailyRecordData {
  id?: string;
  user_id: string;
  approached: number;
  get_contact: number;
  instant_date: number;
  instant_cv: number;
  game_area?: string;
  game_date: string; // YYYY-MM-DD形式
  game_time?: string; // HH:MM:SS形式
}

// 日次記録の取得
export const getDailyRecord = async (
  userId: string,
  date: string
): Promise<{ data: DailyRecordData | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', userId)
      .eq('game_date', date)
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
interface ChangeQueueItem {
  action: 'increment_approached' | 'increment_get_contact' | 'increment_instant_date' | 'increment_instant_cv';
  data: {
    date: string;
    count: number;
  };
  timestamp: number;
}

// 変更キューの保存
const saveChangeQueue = async (queue: ChangeQueueItem[]) => {
  await AsyncStorage.setItem('offlineChangeQueue', JSON.stringify(queue));
};

// 変更キューの取得
const getChangeQueue = async (): Promise<ChangeQueueItem[]> => {
  const data = await AsyncStorage.getItem('offlineChangeQueue');
  return data ? JSON.parse(data) : [];
};

// 変更キューへの追加
const addToChangeQueue = async (item: ChangeQueueItem) => {
  const queue = await getChangeQueue();
  queue.push(item);
  await saveChangeQueue(queue);
};

// オンライン復帰時の同期処理
const syncOfflineChanges = async (userId: string) => {
  const queue = await getChangeQueue();
  if (queue.length === 0) return;

  for (const item of queue) {
    try {
      switch (item.action) {
        case 'increment_approached':
          await incrementApproached(userId, item.data.date, item.data.count);
          break;
        case 'increment_get_contact':
          await incrementGetContact(userId, item.data.date, item.data.count);
          break;
        // 他のケース...
      }
    } catch (error) {
      console.error('同期エラー:', error);
      // エラーハンドリング
      return;
    }
  }

  // 成功したら変更キューをクリア
  await AsyncStorage.removeItem('offlineChangeQueue');
};
```

### RecordContextの設計
CounterContextと連携するRecordContextは以下のように設計します：

```typescript
// RecordContextの型定義
interface RecordContextType {
  dailyRecords: Record<string, DailyRecordData>;
  loading: boolean;
  error: Error | null;
  fetchDailyRecord: (date: string) => Promise<DailyRecordData | null>;
  saveDailyRecord: (data: Partial<DailyRecordData>) => Promise<void>;
  incrementCounter: (type: CounterType, date: string, count?: number) => Promise<void>;
  isOnline: boolean;
}

// RecordProviderの実装
export const RecordProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecordData>>({});
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
        syncOfflineChanges(userId);
      }
    });

    return () => unsubscribe();
  }, []);

  // 他のメソッド実装...

  const value = {
    dailyRecords,
    loading,
    error,
    fetchDailyRecord,
    saveDailyRecord,
    incrementCounter,
    isOnline,
  };

  return (
    <RecordContext.Provider value={value}>
      {children}
    </RecordContext.Provider>
  );
};
```

### エラーハンドリング戦略
エラーハンドリングは以下の戦略で実装します：

```typescript
// エラータイプの定義
enum ErrorType {
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error',
  DATA_ERROR = 'data_error',
  UNKNOWN_ERROR = 'unknown_error',
}

// エラーハンドリングユーティリティ
const handleError = (error: any): { type: ErrorType; message: string } => {
  if (!navigator.onLine) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: 'ネットワーク接続がありません。オンラインに復帰すると自動的に同期されます。',
    };
  }

  if (error.status === 401 || error.status === 403) {
    return {
      type: ErrorType.AUTH_ERROR,
      message: '認証エラーが発生しました。再ログインしてください。',
    };
  }

  if (error.status === 400 || error.status === 422) {
    return {
      type: ErrorType.DATA_ERROR,
      message: 'データエラーが発生しました。入力を確認してください。',
    };
  }

  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: 'エラーが発生しました。しばらく経ってからお試しください。',
  };
};
```

### 次のイシューへの接続
このイシュー（#8）が完了すると、オフラインストレージのイシュー#9へ進みます。Supabase連携が整うことで、オフラインストレージとの連携がスムーズに行えるようになります。

## 次にやるべきこと
1. `services/record.ts`の実装
   - Supabaseクライアントの初期化
   - `daily_records` テーブルへのCRUD操作の実装

2. `contexts/RecordContext.tsx`の実装
   - 記録データの型定義の拡張
   - RecordContextとRecordProviderの実装

3. オフライン対応の実装
   - 変更キューの管理
   - ネットワーク状態監視

4. CounterContextとの統合
   - カウンター操作時のSupabase更新処理
   - データ同期の最適化
