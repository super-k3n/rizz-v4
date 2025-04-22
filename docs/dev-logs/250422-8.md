# カウンター機能の実装状況サマリー (2024/04/22)

## 概要

Rizzアプリケーションのカウンター機能に関する実装状況をまとめたドキュメントです。カウンター値の永続化、ユーザー識別、データ同期などの問題に対する解決策と実装状況を記載しています。

## 実装済み機能

### 1. カウンター値の永続化

#### 問題点
- リロード時にDBには保存された数値があるが、画面上のカウンター値は0にリセットされる
- 初期値がSupabaseから取得した値ではなく常に0から始まる

#### 解決策
- **Supabaseを優先する二段階の初期化処理**
  - まずSupabaseから当日の記録データを取得して初期値として設定
  - Supabaseから取得できない場合はAsyncStorageのバックアップを使用
  - どちらも利用できない場合は0から開始

- **AsyncStorageとの併用**
  - カウンター値をAsyncStorageに保存する機能を追加
  - アプリ起動時にAsyncStorageからカウンター値を読み込む処理を実装
  - 日付が変わった場合のリセット処理も追加

#### 実装コード
```typescript
// まずSupabaseから当日の記録を取得しようと試みる
const { data: dbRecord, error } = await recordService.getDailyRecord(today);

if (dbRecord) {
  // Supabaseから取得した値を設定
  setCounters({
    approached: dbRecord.approached || 0,
    getContact: dbRecord.get_contact || 0,
    instantDate: dbRecord.instant_date || 0,
    instantCv: dbRecord.instant_cv || 0,
  });

  // AsyncStorageにも同期しておく
  await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify({
    date: today,
    approached: dbRecord.approached || 0,
    getContact: dbRecord.get_contact || 0,
    instantDate: dbRecord.instant_date || 0,
    instantCv: dbRecord.instant_cv || 0,
  }));
}
```

### 2. ユーザー識別とデータ取得の修正

#### 問題点
- 複数のユーザーが存在する環境で、どのユーザーでログインしても特定のユーザーIDのデータが常に取得される

#### 解決策
- **ユーザー識別方法の変更**
  - `id`による検索から`email`による検索に変更
  - これにより、認証ユーザーとプロファイルの対応が正しく行われるようになる

- **すべてのAPIメソッドを修正**
  - `getDailyRecord`
  - `upsertDailyRecord`
  - `incrementCounter`
  - `getDailyRecords`
  - `deleteDailyRecord`

#### 実装コード
```typescript
// 修正前
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('id')
  .eq('id', user.id)
  .single();

// 修正後
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('id')
  .eq('email', user.email)
  .single();
```

### 3. カウンター再同期機能

#### 問題点
- カウンター再読み込みボタンを押した時に、表示されるデータと画面に表示されているデータが一致しない

#### 解決策
- **CounterContextの修正**
  - `CounterContext`に`resetCounters`関数を公開

- **handleResetCounters関数の修正**
  - `useCounter`から`resetCounters`関数を取得
  - `resetCounters`の結果を`CounterContext`の状態に反映

#### 実装コード
```typescript
// カウンターリセット処理
const handleResetCounters = async () => {
  try {
    const result = await resetCounters();
    if (result.success && result.data) {
      // カウンターリセット後に画面を再読み込み
      Alert.alert('カウンターリセット', 'DBから最新のデータを取得しました。\n\nカウンター値: ' +
        `声かけ数: ${result.data.approached}, ` +
        `連絡先取得: ${result.data.getContact}, ` +
        `即日デート: ${result.data.instantDate}, ` +
        `即CV: ${result.data.instantCv}`);

      // CounterContextの状態を直接更新
      await resetCounterContext();

      // 画面を再読み込み
      router.replace('/');
    } else {
      Alert.alert('エラー', 'カウンターのリセットに失敗しました。\n' + JSON.stringify(result.error));
    }
  } catch (error) {
    console.error('カウンターリセットエラー:', error);
    Alert.alert('エラー', '予期せぬエラーが発生しました。');
  }
};
```

### 4. プロファイルIDとデータ取得の不一致修正

#### 問題点
- 認証ユーザーを切り替えても、カウンター値が正しくリセットされず、前のユーザーのデータが表示され続ける

#### 解決策
- **明示的なカウンターリセット機能の実装**
  - `resetCounters` ユーティリティ関数を実装
  - AsyncStorageのキャッシュをクリア
  - DBから最新のデータを再取得
  - カウンター値の表示を更新

- **ユーザーインターフェースの改善**
  - ホーム画面に「カウンター再読込」ボタンを追加
  - リセット後、ユーザーに現在のカウンター値を通知

#### 実装コード
```typescript
export const resetCounters = async (): Promise<{
  success: boolean;
  data?: {
    approached: number;
    getContact: number;
    instantDate: number;
    instantCv: number;
  };
  error?: any;
}> => {
  try {
    // AsyncStorageのキャッシュをクリア
    await AsyncStorage.removeItem(COUNTERS_STORAGE_KEY);

    // DBから最新のデータを取得
    const { data: dbRecord, error } = await recordService.getDailyRecord(today);

    if (dbRecord) {
      // DBから取得した値を新しい状態として設定
      const newCounters = {
        approached: dbRecord.approached || 0,
        getContact: dbRecord.get_contact || 0,
        instantDate: dbRecord.instant_date || 0,
        instantCv: dbRecord.instant_cv || 0,
      };

      // AsyncStorageに保存
      await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify({
        date: today,
        ...newCounters
      }));

      return {
        success: true,
        data: newCounters
      };
    }
    // ...
  }
};
```

## 現在の実装状況

### 完了した機能
1. **カウンター値の永続化**
   - SupabaseとAsyncStorageの二重永続化
   - 日付ベースの管理
   - アプリ起動時のデータ読み込み

2. **ユーザー識別の修正**
   - メールアドレスベースのユーザー識別
   - 各ユーザーのデータ分離

3. **カウンター再同期機能**
   - 手動リセット機能
   - CounterContextの状態更新
   - 画面再読み込み

4. **プロファイルIDとデータ取得の不一致修正**
   - 明示的なカウンターリセット機能
   - ユーザーインターフェースの改善

### 残課題
1. **自動リセット機能**
   - ユーザーログイン時に自動的にカウンターをリセットする機能
   - AuthContextとCounterContextの連携強化

2. **クロスデバイス同期の強化**
   - デバイス間での同期をより堅牢にする実装
   - 競合解決戦略の改善

3. **キャッシュ戦略の見直し**
   - ユーザーごとのキャッシュ分離
   - より効率的なキャッシュ無効化の実装

4. **オフライン同期機能のテスト**
   - 実際のオフライン環境でのテスト
   - 同期処理の安定性確認

5. **データ整合性の検証**
   - 複数デバイスでの同期テスト
   - 競合解決のロジック改善

6. **パフォーマンス最適化**
   - キャッシュ戦略の改善
   - バッチ処理の検討

## 次のステップ
1. ユーザーログイン時の自動リセット機能の実装
2. クロスデバイス同期の強化
3. キャッシュ戦略の見直し
4. オフライン同期機能のテスト
5. データ整合性の検証
6. パフォーマンス最適化

## 250422-7.mdとの差分

### 主な差分
1. **AsyncStorageとの連携**
   - 250422-7.mdでは「残課題」として記載されていたAsyncStorageとの連携が実装完了
   - カウンター値の永続化機能が追加された

2. **Supabase連携の強化**
   - 250422-7.mdでは基本的なCounterContextの実装のみだったが、Supabaseとの連携が強化された
   - ユーザー識別方法の改善が行われた

3. **カウンター再同期機能の追加**
   - 250422-7.mdにはなかった明示的なカウンター再同期機能が追加された
   - ユーザーインターフェースに「カウンター再読込」ボタンが追加された

4. **残課題の更新**
   - 250422-7.mdの残課題の一部が解決され、新しい残課題が追加された
   - 特にAsyncStorageとの連携は実装完了し、クロスデバイス同期やキャッシュ戦略の見直しが新たな課題として追加された

### 修正したファイル一覧
1. **新規作成ファイル**
   - `services/reset-counters.ts`: カウンターリセット機能の実装
   - `services/auth-debug.ts`: 認証・プロファイル診断機能の実装

2. **修正ファイル**
   - `contexts/CounterContext.tsx`: AsyncStorageとの連携機能を追加、resetCounters関数を公開
   - `services/record.ts`: ユーザー識別方法をidからemailに変更、診断用ログ出力を追加
   - `app/(tabs)/index.tsx`: カウンター再読込ボタンの追加、handleResetCounters関数の修正
   - `app/_layout.tsx`: プロバイダーの順序を修正（CounterProvider -> RecordProvider -> GoalProvider）

3. **影響を受けたファイル**
   - `components/counter/CounterButton.tsx`: カウンター値の永続化に対応
   - `components/counter/ProgressDisplay.tsx`: カウンター値の永続化に対応
   - `app/(tabs)/goal-settings.tsx`: カウンター値の永続化に対応
