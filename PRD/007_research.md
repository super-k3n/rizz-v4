## 1. Expo + React Native の最新状況

### Expo SDK の最新バージョン

- **最新安定版**: Expo SDK 52（2025年4月現在）
- **主な機能追加**:
    - 新アーキテクチャ（New Architecture）がデフォルトで有効化
    - iOS 15.1以上および Android API 24以上の対応（最小要件の引き上げ）
    - expo-videoライブラリの安定版リリース（ロック画面コントロール、ピクチャーインピクチャー対応）
    - expo-audioライブラリのベータ版リリース
    - パフォーマンス改善とバグ修正

### Expo Router の状況

- **最新バージョン**: v5.0.2-preview.4（2025年4月現在）/ v4.0.20（安定版）
- **主な機能**:
    - APIルート（+api.js）によるサーバーエンドポイント作成
    - Webでのバンドル分割によるパフォーマンス向上
    - 柔軟な404ハンドリング（+not-found.js）
    - 相対Fetchリクエストのサポート
    - テスティングライブラリの提供
    - URL APIの標準サポート

### React Native Paper の最新対応状況

- **バージョン**: v6.0
- **Material You デザインサポート**の追加
- **アクセシビリティ機能の強化**
- **テーマカスタマイズのAPIが改善**

## 2. Supabase の最新機能と制限

### 最新機能

- **ベクトル検索**: AIデータの効率的な検索が可能に
- **Edge Functions**: サーバーレス関数の実行環境が改善
- **リアルタイム同期の性能向上**: WebSocketの安定性と効率性向上
- **セキュリティ強化**: Row Level Security (RLS)のパターン拡張

### 無料プランの制限

- **ストレージ**: 500MB
- **同時接続数**: 制限あり（ドキュメントから明確な数字は確認できず）
- **帯域幅（Egress）**: 5GB/月
- **月間アクティブユーザー**: 50,000 MAU
- **休止ポリシー**: 7日間の非アクティブ後に自動休止
- **プロジェクト数**: 最大2つのアクティブプロジェクト

### Proプラン（最小有料プラン）

- **料金**: $25/月
- **月間アクティブユーザー**: 100,000 MAU含む（追加は$0.00325/MAU）
- **ディスク容量**: プロジェクトあたり8GB含む（追加は$0.125/GB）
- **帯域幅（Egress）**: 250GB含む（追加は$0.09/GB）
- **バックアップ**: 日次バックアップ（7日間保存）
- **リソース**: より多くのコンピュートリソース（自動$10クレジット含む）

## 3. オフライン対応の実装方法

### AsyncStorage によるキャッシュ戦略

```typescript
// キャッシュの有効期限を設定したデータ保存
const cacheData = async (key: string, data: any, expiryMinutes = 60) => {
  const item = {
    data,
    timestamp: Date.now(),
    expiryMinutes
  };
  await AsyncStorage.setItem(key, JSON.stringify(item));
};

// キャッシュからデータ取得（有効期限チェック付き）
const getCachedData = async (key: string) => {
  const value = await AsyncStorage.getItem(key);
  if (!value) return null;

  const item = JSON.parse(value);
  const now = Date.now();
  const expiryMs = item.expiryMinutes * 60 * 1000;

  if (now - item.timestamp > expiryMs) {
    await AsyncStorage.removeItem(key);
    return null;
  }

  return item.data;
};
```

### オフライン変更の同期キュー

```typescript
// 変更キューを保存
const queueChange = async (action: string, data: any) => {
  const queue = await getChangeQueue() || [];
  queue.push({
    action,
    data,
    timestamp: Date.now()
  });
  await AsyncStorage.setItem('offlineChangeQueue', JSON.stringify(queue));
};

// オンライン復帰時に変更を適用
const processChangeQueue = async () => {
  const queue = await getChangeQueue();
  if (!queue || queue.length === 0) return;

  for (const change of queue) {
    try {
      // 変更タイプに応じた処理
      switch (change.action) {
        case 'incrementApproached':
          await supabaseService.incrementApproached(change.data.date, change.data.count);
          break;
        case 'incrementGetContact':
          await supabaseService.incrementGetContact(change.data.date, change.data.count);
          break;
        // 他のアクション...
      }
    } catch (error) {
      console.error('Failed to process change:', error);
      // エラーハンドリング（失敗した変更は残しておく）
      return;
    }
  }

  // 成功したらキューをクリア
  await AsyncStorage.removeItem('offlineChangeQueue');
};

// ネットワーク状態監視とキュー処理
const setupNetworkMonitoring = () => {
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      processChangeQueue();
    }
  });
};
```

## 4. パフォーマンス最適化手法

### React Native パフォーマンス改善

- **メモ化の活用**:

    ```typescript
    // 不要な再レンダリングを防止
    const MemoizedComponent = React.memo(MyComponent);

    // コールバック関数のメモ化
    const handlePress = useCallback(() => {
      // 処理
    }, [依存配列]);

    // 計算値のメモ化
    const computedValue = useMemo(() => {
      // 複雑な計算
      return result;
    }, [依存配列]);
    ```

- **仮想化リスト**:

    ```typescript
    import { FlatList } from 'react-native';

    // 大量データの効率的な表示
    <FlatList
      data={largeDataset}
      renderItem={({ item }) => <ListItem item={item} />}
      keyExtractor={item => item.id}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
    />
    ```

- **画像最適化**:

    ```typescript
    // 画像のプリロードとキャッシュ
    import { Image } from 'react-native';

    // アプリ起動時に主要画像をプリロード
    Image.prefetch('https://example.com/image.jpg');
    ```


### Supabase クエリ最適化

- **必要なカラムのみ選択**:

    ```typescript
    // 全カラム取得を避ける
    const { data } = await supabase
      .from('daily_records')
      .select('approached, get_contact, game_date')
      .eq('user_id', userId);
    ```

- **バッチ処理**:

    ```typescript
    // 複数のレコードを一度に更新
    const { data, error } = await supabase
      .from('daily_records')
      .upsert([
        { id: 1, approached: 10 },
        { id: 2, approached: 15 },
        { id: 3, approached: 20 }
      ]);
    ```


## 5. セキュリティベストプラクティス

### Supabase RLS ポリシー実装例

```sql
-- 基本的なRLSポリシー
-- ユーザーは自分のレコードのみ参照可能
CREATE POLICY "Users can only view their own records"
ON daily_records
FOR SELECT
USING (auth.uid() = user_id);

-- 更新とデータ整合性を確保するポリシー
CREATE POLICY "Users can only update their own records"
ON daily_records
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  -- 更新できるフィールドを制限（オプション）
  (auth.uid() = user_id) AND
  (get_contact <= approached) -- データ整合性ルール
);
```

### クライアント側のセキュリティ

- **JWT取り扱いの安全性**:

    ```typescript
    // 安全なトークン管理
    import * as SecureStore from 'expo-secure-store';

    // JWTを安全に保存
    const storeToken = async (token: string) => {
      await SecureStore.setItemAsync('supabase_token', token);
    };

    // 安全にトークンを取得
    const getToken = async () => {
      return await SecureStore.getItemAsync('supabase_token');
    };
    ```

- **入力バリデーション**:

    ```typescript
    import * as Yup from 'yup';

    // Yupによる厳格な入力検証
    const validationSchema = Yup.object().shape({
      email: Yup.string()
        .email('有効なメールアドレスを入力してください')
        .required('メールアドレスは必須です'),
      password: Yup.string()
        .min(8, 'パスワードは8文字以上必要です')
        .matches(/[a-zA-Z]/, 'パスワードには英字を含める必要があります')
        .matches(/[0-9]/, 'パスワードには数字を含める必要があります')
        .required('パスワードは必須です')
    });
    ```


## 6. グラフ表示のベストプラクティス

### Victory Native XL の採用検討

Victory Native は現在2つのバージョンが存在します：

1. **Victory Native Legacy** - 従来のSVGベースの実装（victory-native@legacy）
2. **Victory Native XL** - 新しいSkiaベースの高パフォーマンス実装

Victory Native XLは、D3、Skia、Reanimatedを使用したReact Native向けの新しいチャートライブラリです。パフォーマンスが大幅に向上し、アニメーションも滑らかになっています。

#### インストール方法

```bash
# まずピア依存関係をインストール
yarn add react-native-reanimated react-native-gesture-handler @shopify/react-native-skia

# Victory Native XLをインストール
yarn add victory-native-xl
```

babel.config.jsにReanimatedプラグインを追加します：

```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

### 実装例

```tsx
import { BarChart } from 'victory-native-xl';

const StatisticsChart = ({ data }) => {
  return (
    <BarChart
      data={data}
      xKey="date"
      yKeys={["approached"]}
      dimensions={{ width: 350, height: 300 }}
      padding={{ left: 50, bottom: 50, right: 20, top: 20 }}
      domainPadding={{ x: 20 }}
      axisOptions={{
        formatXLabel: (date) => new Date(date).toLocaleDateString('ja-JP', { day: 'numeric' }),
      }}
      chartPalette={['#2196F3']}
      animated={true}
    />
  );
};
```

### カスタムテーマ例

```tsx
const customTheme = {
  ...VictoryTheme.material,
  axis: {
    ...VictoryTheme.material.axis,
    style: {
      ...VictoryTheme.material.axis.style,
      tickLabels: {
        ...VictoryTheme.material.axis.style.tickLabels,
        fontSize: 12,
        fontFamily: 'System',
        fill: '#555555'
      }
    }
  },
  bar: {
    ...VictoryTheme.material.bar,
    style: {
      ...VictoryTheme.material.bar.style,
      data: {
        ...VictoryTheme.material.bar.style.data,
        fill: '#2196F3',
        width: 15
      }
    }
  }
};
```

## 7. ストレージとパフォーマンスのバランス

### ローカルストレージ最適化

- **キャッシュ期限管理**:

    - 頻繁に変わるデータ（日次記録）: 短い期限（数時間）
    - 安定したデータ（月次統計）: 長い期限（数日）
    - 参照データ（ユーザープロフィール）: 長い期限（1週間）
- **ストレージサイズ制限**:

    ```typescript
    // ストレージ使用量の管理
    const MAX_CACHE_SIZE_MB = 50; // 最大キャッシュサイズ

    const checkAndCleanStorage = async () => {
      // キャッシュサイズの計算（推定）
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2 / 1024 / 1024; // UTF-16でのサイズ推定（MB）
        }
      }

      // 制限を超えた場合、古いキャッシュから削除
      if (totalSize > MAX_CACHE_SIZE_MB) {
        // 有効期限のタイムスタンプでソートして古いものから削除
        // 実装略
      }
    };
    ```


### Supabase Storage 最適化

- **プロフィール画像の圧縮とリサイズ**:

    ```typescript
    import * as ImageManipulator from 'expo-image-manipulator';const uploadProfileImage = async (uri: string) => {  // 画像の圧縮とリサイズ  const optimizedImage = await ImageManipulator.manipulateAsync(    uri,    [{ resize: { width: 300 } }],    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }  );    // リサイズした画像をアップロード  const filePath = `profiles/${user.id}_${Date.now()}.jpg`;  const { error } = await supabase.storage    .from('avatars')    .upload(filePath, optimizedImage.uri, {      contentType: 'image/jpeg',      upsert: true    });      return filePath;};
    ```


## 8. ユーザーエンゲージメント向上策

### プッシュ通知の実装

```typescript
import * as Notifications from 'expo-notifications';

// 通知の許可を取得
const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// 目標達成通知の設定
const scheduleGoalReminder = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '今日の目標を達成しましょう！',
      body: '声かけ目標達成まであと5人です。頑張りましょう！',
      data: { screen: 'index' },
    },
    trigger: {
      hour: 19,
      minute: 0,
      repeats: true,
    },
  });
};

// 通知をタップした時の処理
const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // タップされた通知のハンドリング
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const screen = response.notification.request.content.data.screen;
    // 画面遷移処理（navigation.navigate等）
  });

  return () => subscription.remove();
};
```

### ゲーミフィケーション要素の提案

- **アチーブメントシステム**:

    - 「初めての声かけ」「10人達成」「100人達成」などのバッジ
    - 「連続7日間記録」「月間目標達成」などの継続バッジ
    - 「トップ成功率」などの成績バッジ
- **レベルシステム**:

    ```typescript
    // レベル計算ロジック例
    const calculateLevel = (stats) => {
      const totalApproached = stats.reduce((sum, day) => sum + day.approached, 0);
      const totalContacts = stats.reduce((sum, day) => sum + day.get_contact, 0);
      const totalDates = stats.reduce((sum, day) => sum + day.instant_date, 0);
      const totalCV = stats.reduce((sum, day) => sum + day.instant_cv, 0);

      // 加重スコア計算
      const score =
        totalApproached * 1 +
        totalContacts * 5 +
        totalDates * 20 +
        totalCV * 50;

      // レベル算出（例: 100ポイントごとに1レベル）
      const level = Math.floor(score / 100) + 1;

      return {
        level,
        nextLevelPoints: (level) * 100,
        currentPoints: score,
        progress: (score % 100) / 100
      };
    };
    ```


## 9. 将来的な拡張の可能性

### コミュニティ機能（プレミアム）

- **匿名ランキング**
- **地域別成功率の集計**
- **テクニック共有フォーラム**
- **メンター/メンティーマッチング**

### AI機能の統合可能性

- **会話テクニック分析**
- **成功率予測**
- **パーソナライズされたアドバイス**
- **最適な時間帯・場所の推奨**

### クロスプラットフォーム展開

- **Webアプリケーション**:
    - Expoが提供するウェブサポートを活用
    - デスクトップでのデータ分析機能強化
- **Apple Watch / Wear OS**:
    - クイックカウント機能の実装
    - 目標達成通知

## 10. 市場調査結果

### 競合アプリ分析

- **現状**: 専門的なナンパ記録アプリは存在せず
- **類似機能を持つアプリ**:
    - 習慣記録アプリ（カウント機能）
    - フィットネス記録アプリ（統計グラフ）
    - トレーニングログアプリ（目標設定）

### ユーザーニーズ調査

- **主要需要**:
    1. シンプルで素早い記録機能
    2. プライバシー保護
    3. モチベーション維持機能
    4. データからの洞察と改善提案

### 市場規模と成長予測

- **ターゲットユーザー**:
    - 日本国内のナンパ実践者（推定数万人）
    - ナンパスクール/コミュニティ（数十〜百）
- **収益モデル可能性**:
    - フリーミアムモデル
    - 月額サブスクリプション（¥500〜1,000）
    - コミュニティ機能（¥1,000〜2,000/月）

## 11. 技術的リスクと対策

### 主要リスク

1. **Supabaseの無料枠制限**:
    - 対策: アップグレード計画の準備とキャッシュ戦略の最適化
2. **Expoの制限**:
    - 対策: カスタムネイティブモジュールが必要な場合のEjectionプラン検討
3. **オフライン同期の競合**:
    - 対策: タイムスタンプベースの競合解決戦略の実装
4. **データプライバシーとセキュリティ**:
    - 対策: 厳格なRLSとデータ暗号化の適用

### リスク対応戦略

```typescript
// タイムスタンプベースの競合解決例
const resolveConflict = (localData, serverData) => {
  // サーバーデータが新しい場合はサーバーデータを優先
  if (new Date(serverData.updated_at) > new Date(localData.updated_at)) {
    return serverData;
  }

  // ローカルデータが新しい場合はマージ戦略を適用
  return {
    ...serverData,
    // カウンタはローカルの増分を考慮（オフライン中の増加分を失わない）
    approached: Math.max(serverData.approached, localData.approached),
    get_contact: Math.max(serverData.get_contact, localData.get_contact),
    instant_date: Math.max(serverData.instant_date, localData.instant_date),
    instant_cv: Math.max(serverData.instant_cv, localData.instant_cv),
    // その他のフィールドはローカルデータを優先
    game_area: localData.game_area || serverData.game_area,
    game_time: localData.game_time || serverData.game_time,
    updated_at: new Date().toISOString()
  };
};
```

## 12. Expo EAS 配布フロー

### EAS Build 設定

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "developer@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123XYZ"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### ビルドと配布コマンド

```bash
# 開発ビルド
eas build --profile development --platform ios

# プレビュービルド
eas build --profile preview --platform all

# 本番ビルド
eas build --profile production --platform all

# ストア提出
eas submit --platform ios
eas submit --platform android
```

### OTAアップデート戦略

```typescript
// expo-updates設定
// app.json
{
  "expo": {
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 0,
      "checkAutomatically": "ON_LOAD"
    }
  }
}

// OTAアップデートのチェック
import * as Updates from 'expo-updates';

const checkForUpdates = async () => {
  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      // 新しいバージョンを適用するためにアプリを再起動
      await Updates.reloadAsync();
    }
  } catch (error) {
    // エラーハンドリング
    console.log('Error checking for updates:', error);
  }
};
```

## 13. 結論と推奨事項

### 技術スタックの最終確認

- **フロントエンド**: Expo SDK 50 + React Native + TypeScript
- **UI**: React Native Paper v6 + Expo Vector Icons
- **状態管理**: Context API + useReducer
- **ルーティング**: Expo Router v3
- **グラフ**: Victory Native
- **バックエンド**: Supabase (PostgreSQL, Auth, Storage)
- **フォーム管理**: Formik + Yup

### 実装優先順位の提案

1. **基本認証とユーザー管理**
2. **コアカウンター機能とローカルストレージ**
3. **オフライン同期とデータ整合性**
4. **統計表示とグラフ**
5. **目標設定と進捗表示**
6. **設定画面と詳細情報登録**
7. **UI/UXの磨き込み**
8. **プレミアム機能の実装**

### 開発スケジュール案

- **フェーズ1**（4週間）: MVPの実装
- **フェーズ2**（2週間）: テストとバグ修正
- **フェーズ3**（2週間）: パフォーマンス最適化
- **フェーズ4**（1週間）: App Store/Google Play提出準備
- **フェーズ5**（継続）: フィードバックに基づく改善とプレミアム機能追加
