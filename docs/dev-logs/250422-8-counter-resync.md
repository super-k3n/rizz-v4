# カウンター再同期機能の実装ログ (2024/04/22)

## 問題の特定

カウンター再読み込みボタンを押した時に、表示されるデータと画面に表示されているデータが一致しない問題がありました。

### 原因

1. `resetCounters`関数は`AsyncStorage`をクリアしてDBからデータを再取得しますが、`CounterContext`の状態を直接更新していませんでした。
2. `app/(tabs)/index.tsx`の`handleResetCounters`関数は`resetCounters`の結果を表示するだけで、`CounterContext`の状態を更新していませんでした。
3. `router.replace('/')`で画面を再読み込みしても、`CounterContext`の状態が更新されていなかったため、表示されるデータが一致しませんでした。

## 解決策

### 1. `CounterContext`の修正

`CounterContext`に`resetCounters`関数を公開するように修正しました。

```typescript
// contexts/CounterContext.tsx

// コンテキストの型定義
interface CounterContextType {
  counters: CounterState;
  targets: TargetState;
  loading: Record<CounterType, boolean>;
  currentPeriod: PeriodType;
  periodicTargets: PeriodicTargetsState;
  incrementCounter: (type: CounterType) => Promise<void>;
  updateTargets: (period: PeriodType, newTargets: Partial<TargetState>) => Promise<{ success: boolean; error: any }>;
  changePeriod: (period: PeriodType) => void;
  resetCounters: () => Promise<void>; // 追加
}

// コンテキストの値
const value = {
  counters,
  targets,
  loading,
  currentPeriod,
  periodicTargets,
  incrementCounter,
  updateTargets,
  changePeriod,
  resetCounters, // 追加
};
```

### 2. `app/(tabs)/index.tsx`の修正

`handleResetCounters`関数を修正して、`useCounter`から`resetCounters`関数を取得し、`resetCounters`の結果を`CounterContext`の状態に反映するようにしました。

```typescript
// app/(tabs)/index.tsx

function HomeScreen() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { counters, targets, loading: counterLoading, resetCounters: resetCounterContext } = useCounter();
  // ...

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
  // ...
}
```

## 結果

これらの修正により、カウンター再読み込みボタンを押した時に：

1. `resetCounters`関数が`AsyncStorage`をクリアしてDBからデータを再取得します。
2. `CounterContext`の`resetCounters`関数が呼び出され、`CounterContext`の状態が更新されます。
3. 画面が再読み込みされ、更新された`CounterContext`の状態が表示されます。

これにより、カウンター再読み込みボタンを押した時に表示されるデータと画面に表示されているデータが一致するようになりました。
