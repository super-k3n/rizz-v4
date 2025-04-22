# 2025-04-22-9 - プロファイルIDとデータ取得の不一致修正

## タスク参照: #8 Supabase連携（記録）のユーザー識別とデータリセット問題

### 問題の内容
1. 認証ユーザーを切り替えても（例：example2からexample3に）、カウンター値が正しくリセットされず、前のユーザーのデータが表示され続ける
2. ログからは正しいユーザーIDでクエリが実行されていることが確認できるが、実際の表示値は前のユーザーのデータのまま

### 原因分析
1. **認証情報とカウンター値の不整合**:
   - 認証情報が切り替わっても、CounterContextのステートが適切にリフレッシュされない
   - AsyncStorageにキャッシュされた前ユーザーのデータが残り続ける可能性
   - メールアドレスでのプロファイル検索は正しいが、その後のUI表示に反映されていない

2. **状態管理の問題**:
   - 認証切り替え時に明示的なデータのリセットが行われていない
   - Contextの再初期化が適切なタイミングでトリガーされていない

### 実装した解決策
1. **明示的なカウンターリセット機能の実装**
   - `resetCounters` ユーティリティ関数を実装
   - AsyncStorageのキャッシュをクリア
   - DBから最新のデータを再取得
   - カウンター値の表示を更新

2. **ユーザーインターフェースの改善**
   - ホーム画面に「カウンター再読込」ボタンを追加
   - リセット後、ユーザーに現在のカウンター値を通知

### 変更したファイル
1. 新規作成ファイル
   - `services/reset-counters.ts`: カウンターリセット機能の実装
   - `services/auth-debug.ts`: 認証・プロファイル診断機能の実装

2. 修正ファイル
   - `app/(tabs)/index.tsx`: リセットボタンの追加とリセット処理の実装
   - `services/record.ts`: 診断用ログ出力の追加

### リセット機能の実装ポイント
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

### 手動リセット手順
1. 手動リセットが必要な場合は、ホーム画面の「カウンター再読込」ボタンを押す
2. これによりAsyncStorageがクリアされ、DBから最新データが取得される
3. ユーザー切り替え後は必ず再読込を行うことで正しいデータが表示される

### 今後の改善点
1. **自動リセット機能**
   - ユーザーログイン時に自動的にカウンターをリセットする機能の実装
   - AuthContextとCounterContextの連携強化

2. **クロスデバイス同期の強化**
   - デバイス間での同期をより堅牢にする実装
   - 競合解決戦略の改善

3. **キャッシュ戦略の見直し**
   - ユーザーごとのキャッシュ分離
   - より効率的なキャッシュ無効化の実装
