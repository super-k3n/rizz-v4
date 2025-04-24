# イシュータイトル
プロフィール設定機能の実装

## 概要
ユーザーのプロフィール設定機能を実装します。設定画面（`settings.tsx`）に以下の機能を追加します：
- ユーザー名の設定・変更
- パスワードの変更
- X（旧Twitter）URLの設定・変更
- ダークモードの切り替え

## 実施内容

### パート1: データベース設計とAPI実装
- [ ] `profiles` テーブルの修正
  - [ ] X URLカラムの追加
  - [ ] テーマ設定カラムの追加
  - [ ] 既存カラムの確認と必要に応じた修正
- [ ] Supabase APIの実装
  - [ ] プロフィール情報の取得・更新API
  - [ ] パスワード変更API
  - [ ] テーマ設定の保存・取得API

### パート2: フロントエンド実装
- [ ] ProfileContextの実装
  - [ ] プロフィール情報の状態管理
  - [ ] テーマ設定の状態管理
  - [ ] 更新処理の実装
- [ ] 設定画面のUI実装
  - [ ] ユーザー名入力フォーム
  - [ ] パスワード変更フォーム
  - [ ] X URL入力フォーム
  - [ ] テーマ切り替えスイッチ
- [ ] バリデーション実装
  - [ ] 入力値のバリデーション
  - [ ] エラーメッセージの表示

### パート3: 認証・セキュリティ
- [ ] パスワード変更機能の実装
  - [ ] 現在のパスワード確認
  - [ ] 新しいパスワードのバリデーション
  - [ ] セキュアなパスワード更新処理
- [ ] セッション管理の強化
  - [ ] プロフィール更新時のセッション更新
  - [ ] エラーハンドリングの実装

## 参照資料
- [@000_overview.md](プロジェクト概要・ブランディングカラー定義)
- [@001_techstack.md](技術スタック定義書)
- [@002_db.md](データベース設計書)
- [@003_api.md](API設計書)
- [@005_core.md](コア機能処理フロー)
- [@006_structure.md](アプリケーション構造定義書)

## 完了条件
- [ ] ユーザー名の設定・変更が正常に動作すること
- [ ] パスワードの変更が安全に実行できること
- [ ] X URLの設定・変更が正常に動作すること
- [ ] ダークモードの切り替えが即座に反映されること
- [ ] 入力値のバリデーションが適切に機能すること
- [ ] エラーメッセージが適切に表示されること
- [ ] セキュリティ要件が満たされていること

## 実装方針

### データベース設計
```sql
-- profilesテーブルの修正
ALTER TABLE profiles
  ADD COLUMN x_url VARCHAR(255),
  ADD COLUMN theme_preference VARCHAR(10) DEFAULT 'light',
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- インデックスの作成（既存のインデックスを確認）
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
```

### ProfileContextの設計
```typescript
interface ProfileContextType {
  profile: {
    id: string;
    name: string;
    email: string;
    xUrl: string | null;
    themePreference: 'light' | 'dark';
    createdAt: string;
    updatedAt: string;
  };
  loading: boolean;
  error: Error | null;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark') => Promise<void>;
}

interface ProfileData {
  name: string;
  email: string;
  xUrl: string | null;
  themePreference: 'light' | 'dark';
}
```

### 設定画面のUIコンポーネント
```typescript
// 設定画面の基本構造
function SettingsScreen() {
  const { profile, updateProfile, changePassword, updateTheme } = useProfile();
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    xUrl: profile.xUrl,
  });

  const handleSubmit = async () => {
    try {
      await updateProfile(formData);
      // 成功時のフィードバック
    } catch (error) {
      // エラーハンドリング
    }
  };

  return (
    <ScrollView>
      <Formik
        initialValues={formData}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {/* フォームコンポーネント */}
      </Formik>
    </ScrollView>
  );
}
```

### バリデーションスキーマ
```typescript
const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('ユーザー名は必須です')
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(50, 'ユーザー名は50文字以内で入力してください'),
  email: Yup.string()
    .email('有効なメールアドレスを入力してください')
    .required('メールアドレスは必須です'),
  xUrl: Yup.string()
    .url('有効なURLを入力してください')
    .nullable(),
  currentPassword: Yup.string()
    .required('現在のパスワードは必須です'),
  newPassword: Yup.string()
    .required('新しいパスワードは必須です')
    .min(8, 'パスワードは8文字以上で入力してください')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'パスワードは大文字、小文字、数字を含める必要があります'
    ),
});
```

## 次にやるべきこと
1. データベース設計の実装
   - `profiles` テーブルの修正
   - 必要なインデックスの確認と作成

2. Supabase APIの実装
   - プロフィール関連のCRUD操作
   - パスワード変更API
   - テーマ設定API

3. ProfileContextの実装
   - 状態管理の実装
   - 更新処理の実装

4. 設定画面のUI実装
   - フォームコンポーネントの作成
   - バリデーションの実装
   - エラーハンドリングの実装
