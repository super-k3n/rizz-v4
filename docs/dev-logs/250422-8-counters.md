# 2025-04-22-8-counters - カウンター値の永続化対応

## タスク参照: #8 Supabase連携（記録）の画面リロード時のカウンター値リセット修正

### 問題の内容
リロードするとDBには保存された数値がありますが、画面上のカウンター値は0にリセットされてしまう問題が発生していました。

### 原因分析
1. 現在のCounterContextの実装では、カウンター値はメモリ上のステートとしてのみ保持されている
2. アプリの再起動やページのリロード時にステートがリセットされる
3. リセット後はSupabaseからデータを取得しないと以前の値が反映されない

### 実装した解決策
1. **Supabaseとの連携は維持しつつ、AsyncStorageも併用する二重の永続化**
   - CounterContextでカウンターの値をAsyncStorageに保存する機能を追加
   - アプリ起動時にAsyncStorageからカウンター値を読み込む処理を実装
   - 日付が変わった場合のリセット処理も追加（新しい日のカウンターは0からスタート）

2. **日付ベースの管理**
   - カウンター値を保存する際に日付情報も合わせて保存
   - 日付が変わった場合は自動的にカウンターをリセット

### 変更したファイル
1. `contexts/CounterContext.tsx`:
   - AsyncStorageの保存キーを追加
   - 起動時のカウンター値読み込み処理を実装
   - インクリメント時の保存処理を実装

### 実装ポイント
1. **AsyncStorageのキー設計**
   ```typescript
   const COUNTERS_STORAGE_KEY = 'rizz_counters';
   ```

2. **アプリ起動時のデータ読み込み**
   ```typescript
   useEffect(() => {
     const loadData = async () => {
       // 目標値の読み込み
       const storedTargets = await AsyncStorage.getItem(TARGETS_STORAGE_KEY);
       if (storedTargets) {
         setPeriodicTargets(JSON.parse(storedTargets));
       }
       
       // カウンター値の読み込み
       const storedCounters = await AsyncStorage.getItem(COUNTERS_STORAGE_KEY);
       if (storedCounters) {
         const parsedCounters = JSON.parse(storedCounters);
         // 現在の日付と保存された日付が同じ場合のみ値を読み込む
         const today = new Date().toISOString().split('T')[0];
         if (parsedCounters.date === today) {
           setCounters({
             approached: parsedCounters.approached || 0,
             getContact: parsedCounters.getContact || 0,
             instantDate: parsedCounters.instantDate || 0,
             instantCv: parsedCounters.instantCv || 0,
           });
         } else {
           // 日付が異なる場合はリセット
           const resetCounters = {
             date: today,
             approached: 0,
             getContact: 0,
             instantDate: 0,
             instantCv: 0,
           };
           await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify(resetCounters));
         }
       }
     };

     loadData();
   }, []);
   ```

3. **カウンター値更新時の永続化**
   ```typescript
   const incrementCounter = useCallback(async (type: CounterType) => {
     // カウンター値を更新
     const newCounters = {
       ...counters,
       [type]: counters[type] + 1,
     };
     
     // ステートを更新
     setCounters(newCounters);
     
     // AsyncStorageに保存
     const today = new Date().toISOString().split('T')[0];
     await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify({
       date: today,
       ...newCounters
     }));
   }, [counters]);
   ```

### 今後の改善点
1. **Supabaseとの同期**
   - 将来的には、AsyncStorageの値とSupabaseの値を定期的に同期する仕組みを検討
   - オフライン時に蓄積されたデータをオンライン復帰時に一括同期する機能の拡張

2. **複数デバイス対応**
   - 複数デバイスでの利用時にデータの整合性を維持する仕組みの実装

3. **エラーハンドリングの強化**
   - AsyncStorage操作時のエラーに対するより堅牢な対応

### 効果
この修正により、以下の改善が実現されました：
1. ページをリロードしても、カウンター値がリセットされなくなる
2. アプリを再起動しても、当日のカウンター値が保持される
3. 日付が変わると自動的にカウンターがリセットされる（日次記録の仕様通り）
