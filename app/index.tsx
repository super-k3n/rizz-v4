import { Redirect } from 'expo-router';

export default function Index() {
  // 現在は単純にログイン画面にリダイレクトします
  // 後で認証状態をチェックして、ログイン済みならタブ画面に、未ログインなら認証画面にリダイレクトする処理を追加します
  return <Redirect href="/login" />;
}
