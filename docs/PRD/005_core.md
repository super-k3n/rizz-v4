## 概要

本ドキュメントでは、Rizzアプリケーションのコア機能における処理フローを説明します。

ストリートナンパの実績記録・分析アプリとして、ユーザーが日々の活動をどのように記録し、どのようにデータが処理されるかを示します。

## 1. ユーザー認証フロー

### サインアップ

1. ユーザーがメールアドレス、パスワード、ユーザー名を入力
2. Supabase Authにリクエスト送信
3. アカウント作成完了後、自動ログイン
4. ユーザーのプロフィール情報をusersテーブルに保存
5. ホーム画面にリダイレクト

### ログイン

6. ユーザーがメールアドレスとパスワードを入力
7. Supabase Authによる認証
8. JWT(JSON Web Token)の発行と保存
9. ホーム画面にリダイレクト

### ログアウト

10. ユーザーがログアウトボタンをタップ
11. Supabase Authからのログアウト処理
12. JWTの削除
13. ログイン画面にリダイレクト

## 2. 基本カウンター機能の処理フロー

### 声かけ数カウント

14. ユーザーがホーム画面の「声かけカウント」ボタンをタップ
15. クライアント側で現在の日付を取得
16. 該当日付のdaily_recordsデータを確認
    - レコードが存在する場合：approachedフィールドをインクリメント
    - レコードが存在しない場合：新規レコードを作成し、approachedを1に設定
17. Supabase APIを通じてデータベースを更新
18. UI上のカウンター表示を更新

### 連絡先獲得カウント

19. ユーザーがホーム画面の「連絡先ゲット」ボタンをタップ
20. クライアント側で現在の日付を取得
21. 該当日付のdaily_recordsデータを確認
    - レコードが存在する場合：get_contactフィールドをインクリメント
    - レコードが存在しない場合：新規レコードを作成し、get_contactを1に設定
22. Supabase APIを通じてデータベースを更新
23. UI上のカウンター表示を更新

### 即日デートカウント

24. ユーザーがホーム画面の「即日デート」ボタンをタップ
25. クライアント側で現在の日付を取得
26. 該当日付のdaily_recordsデータを確認
    - レコードが存在する場合：instant_dateフィールドをインクリメント
    - レコードが存在しない場合：新規レコードを作成し、instant_dateを1に設定
27. Supabase APIを通じてデータベースを更新
28. UI上のカウンター表示を更新

### 即(sex)カウント

29. ユーザーがホーム画面の「即(sex)」ボタンをタップ
30. クライアント側で現在の日付を取得
31. 該当日付のdaily_recordsデータを確認
    - レコードが存在する場合：instant_cvフィールドをインクリメント
    - レコードが存在しない場合：新規レコードを作成し、instant_cvを1に設定
32. Supabase APIを通じてデータベースを更新
33. UI上のカウンター表示を更新

## 3. 詳細情報登録フロー

34. ユーザーがホーム画面から詳細情報入力画面に遷移
35. 場所(game_area)、時間(game_time)などの詳細情報を入力
36. 保存ボタンをタップ
37. クライアント側で現在の日付を取得
38. 該当日付のdaily_recordsデータを確認
    - レコードが存在する場合：詳細情報を更新
    - レコードが存在しない場合：新規レコードを作成し、詳細情報を設定
39. Supabase APIを通じてデータベースを更新
40. ホーム画面に戻る

## 4. 目標設定処理フロー

41. ユーザーが目標設定画面に遷移
42. 期間タイプ(daily/weekly/monthly/yearly)を選択
43. 各指標の目標値を入力：
    - 声かけ目標数(approached_target)
    - 連絡先ゲット目標数(get_contacts_target)
    - 即日デート目標数(instant_dates_target)
    - 即(sex)目標数(instant_cv_target)
44. 保存ボタンをタップ
45. goalsテーブルを確認
    - 同じ期間タイプの目標が存在する場合：更新
    - 存在しない場合：新規作成
46. Supabase APIを通じてデータベースを更新
47. 目標設定画面またはホーム画面に戻る

## 5. 統計データ表示処理フロー

### 日次データ表示

48. ユーザーが統計画面で「日次」タブを選択
49. 表示する年月を選択
50. 選択された年月に基づいてAPIリクエスト
51. 日次統計データを取得:

    ```sql
    -- 日次統計計算処理（サーバーサイド）SELECT  dr.game_date as date,  dr.approached,  dr.get_contact,  dr.instant_date,  dr.instant_cv,  CASE WHEN dr.approached > 0 THEN    ROUND((dr.get_contact::NUMERIC / dr.approached::NUMERIC) * 100, 2)  ELSE 0 END as contact_rate,  CASE WHEN dr.approached > 0 THEN    ROUND((dr.instant_cv::NUMERIC / dr.approached::NUMERIC) * 100, 2)  ELSE 0 END as cv_rateFROM  daily_records drWHERE  dr.user_id = [current_user_id] AND  EXTRACT(YEAR FROM dr.game_date) = [selected_year] AND  EXTRACT(MONTH FROM dr.game_date) = [selected_month]ORDER BY  dr.game_date;
    ```

52. データをグラフ形式で表示

### 週次/月次/年次データ表示

53. ユーザーが統計画面で対応するタブを選択
54. 表示する期間を選択
55. 選択された期間に基づいてAPIリクエスト
56. 集計されたデータを取得（週次/月次/年次の集計処理はサーバーサイドで実行）
57. データをグラフ形式で表示

## 6. プログレスバー表示処理フロー

58. ホーム画面ロード時に現在の日付を取得
59. 「日次」目標データをgoalsテーブルから取得
60. 現在日付のdaily_recordsデータを取得
61. 各指標について、達成度を計算:

    ```javascript
    const approachedProgress = (dailyRecord.approached / goals.approached_target) * 100;const contactProgress = (dailyRecord.get_contact / goals.get_contacts_target) * 100;const dateProgress = (dailyRecord.instant_date / goals.instant_dates_target) * 100;const cvProgress = (dailyRecord.instant_cv / goals.instant_cv_target) * 100;
    ```

62. 各指標のプログレスバーを更新

## 7. オフライン対応処理フロー

63. アプリ起動時にネットワーク状態の確認
64. オフライン状態の場合：
    - ローカルにキャッシュされた最新データを表示
    - ユーザーアクションをローカルに一時保存（AsyncStorageを使用）
65. オンライン復帰時：
    - 保存されたユーザーアクションを順次実行
    - 最新のデータを再同期

## 8. データフローダイアグラム

```
┌─────────────┐         ┌───────────────┐         ┌───────────────┐
│             │         │               │         │               │
│  ユーザー    │ ───────▶│  Rizzアプリ   │ ───────▶│  Supabase    │
│             │         │  (Expo+RN)    │         │  (PostgreSQL) │
│             │ ◀─────── │               │ ◀─────── │               │
└─────────────┘         └───────────────┘         └───────────────┘
      │                        │                         │
      │                        │                         │
      │                        │                         │
      ▼                        ▼                         ▼
┌─────────────┐         ┌───────────────┐         ┌───────────────┐
│ ユーザー入力 │         │ ローカル状態管理 │         │  データベース  │
│ - タップ     │         │ - Context API  │         │  - users     │
│ - フォーム入力│         │ - useReducer   │         │  - records   │
└─────────────┘         └───────────────┘         │  - goals     │
                                                  └───────────────┘
```

## 9. エラーハンドリングフロー

66. APIリクエスト発行
67. エラー発生時：
    - エラータイプの判別（認証エラー、接続エラー、データエラーなど）
    - 適切なエラーメッセージの表示
    - 必要に応じてリトライロジックの実行
68. オフラインエラーの場合：
    - ローカルキャッシュからのデータ表示
    - アクションの一時保存

## 10. データ同期処理フロー

69. アプリケーション起動時またはタブ切り替え時にデータ同期を実行
70. 最新の日次記録と目標設定をSupabaseから取得
71. ローカル状態を更新
72. UI表示を更新

## 11. フロント実装のサンプルコード

### カウンターインクリメント機能（Context + useReducer）

```typescript
// 状態管理用のコンテキスト
interface RecordState {
  approached: number;
  getContact: number;
  instantDate: number;
  instantCv: number;
  date: string;
  loading: boolean;
  error: string | null;
}

// アクション定義
type RecordAction =
  | { type: 'INCREMENT_APPROACHED' }
  | { type: 'INCREMENT_GET_CONTACT' }
  | { type: 'INCREMENT_INSTANT_DATE' }
  | { type: 'INCREMENT_INSTANT_CV' }
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'SET_ERROR', payload: string | null }
  | { type: 'SET_RECORD', payload: RecordState };

// レデューサー関数
const recordReducer = (state: RecordState, action: RecordAction): RecordState => {
  switch (action.type) {
    case 'INCREMENT_APPROACHED':
      return { ...state, approached: state.approached + 1 };
    case 'INCREMENT_GET_CONTACT':
      return { ...state, getContact: state.getContact + 1 };
    case 'INCREMENT_INSTANT_DATE':
      return { ...state, instantDate: state.instantDate + 1 };
    case 'INCREMENT_INSTANT_CV':
      return { ...state, instantCv: state.instantCv + 1 };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RECORD':
      return { ...action.payload };
    default:
      return state;
  }
};

// カウンターのインクリメント処理
const incrementApproached = async () => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    // 現在の日付を取得
    const today = new Date().toISOString().split('T')[0];

    // Supabaseへのリクエスト
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // 既存レコードがある場合は更新、なければ新規作成
    if (data) {
      const { error: updateError } = await supabase
        .from('daily_records')
        .update({
          approached: data.approached + 1
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      // ローカル状態を更新
      dispatch({ type: 'INCREMENT_APPROACHED' });
    } else {
      // 新規レコード作成
      const { error: insertError } = await supabase
        .from('daily_records')
        .insert([{
          user_id: user.id,
          game_date: today,
          approached: 1,
          get_contact: 0,
          instant_date: 0,
          instant_cv: 0
        }]);

      if (insertError) throw insertError;

      // ローカル状態を更新
      dispatch({
        type: 'SET_RECORD',
        payload: {
          ...state,
          approached: 1,
          date: today
        }
      });
    }
  } catch (err) {
    dispatch({
      type: 'SET_ERROR',
      payload: err instanceof Error ? err.message : '不明なエラーが発生しました'
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};
```

## まとめ

Rizzアプリケーションのコア機能は、ユーザー認証、日次記録のカウント、目標設定、統計表示の4つの主要な処理フローで構成されています。これらのフローはSupabase APIを通じてPostgreSQLデータベースと連携し、React NativeとExpoを使用したフロントエンドで実装されています。

TypeScriptによる型安全性を確保しながら、Context APIとuseReducerによる状態管理を行い、オフライン対応も考慮した設計となっています。ユーザーはワンタップでの簡単な操作で日々の活動を記録でき、自動的に集計された統計情報を視覚的に確認できます。
