# 2025-04-22-8-counters - カウンター値の永続化対応（改善版）

## タスク参照: #8 Supabase連携（記録）の画面リロード時のカウンター値リセット修正

### 問題の内容
1. リロードするとDBには保存された数値がありますが、画面上のカウンター値は0にリセットされてしまう
2. 初期値がSupabaseから取得した値ではなく常に0から始まってしまう

### 原因分析
1. 現在のCounterContextの実装では、カウンター値はメモリ上のステートとしてのみ保持されている
2. アプリの再起動やページのリロード時にステートがリセットされる
3. リセット後はSupabaseからデータを取得しないと以前の値が反映されない

### 実装した解決策
1. **Supabaseを優先する二段階の初期化処理の実装**
   - まずSupabaseから当日の記録データを取得して初期値として設定
   - Supabaseから取得できない場合（エラーなど）はAsyncStorageのバックアップを使用
   - どちらも利用できない場合は0から開始

2. **優先順位を明確にした初期化フロー**
   ```
   1. Supabaseから当日の記録を取得
      ↓
   2. 記録が存在する場合は、その値をCounterContextに設定
      ↓
   3. 記録が存在しない場合は、0で初期化
      ↓
   4. Supabaseアクセスでエラーが発生した場合はAsyncStorageから読み込む
      ↓
   5. AsyncStorageにも値がない、または日付が異なる場合は0で初期化
   ```

3. **同期の一貫性の確保**
   - Supabaseから取得した値をAsyncStorageにも保存して一貫性を維持
   - カウンター更新時は両方に保存

### 変更したファイル
1. `contexts/CounterContext.tsx`:
   - 初期化処理を修正してSupabaseからの読み込みを優先するよう変更
   - エラーハンドリングの強化
   - バックアップ機能を維持

### 実装ポイント
1. **Supabaseからの初期値取得と設定**
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

2. **フォールバック処理の実装**
   ```typescript
   // エラーが発生した場合はAsyncStorageから読み込みを試みる
   console.error('DBレコード取得エラー，バックアップから読み込みます:', error);
   
   // AsyncStorageからカウンター値を読み込み
   const storedCounters = await AsyncStorage.getItem(COUNTERS_STORAGE_KEY);
   if (storedCounters) {
     const parsedCounters = JSON.parse(storedCounters);
     // 現在の日付と保存された日付が同じ場合のみ値を読み込む
     if (parsedCounters.date === today) {
       setCounters({
         approached: parsedCounters.approached || 0,
         getContact: parsedCounters.getContact || 0,
         instantDate: parsedCounters.instantDate || 0,
         instantCv: parsedCounters.instantCv || 0,
       });
     }
   }
   ```

### 効果
この改善により、以下の点が実現されました：
1. アプリ起動時や画面リロード時に、まずSupabaseから当日のデータを取得して表示
2. Supabaseにアクセスできない場合でも、ローカルのAsyncStorageから値をリカバリー
3. いずれも利用できない場合は、適切に0から開始する安全な初期化

これにより、ユーザー体験が向上し、データの一貫性も確保されます。
