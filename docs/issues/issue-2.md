# イシュータイトル
Supabaseセットアップ - プロジェクト作成、データベーススキーマ設定

## 概要
Rizzアプリケーションで使用するSupabaseのプロジェクト作成とデータベーススキーマの設定を行います。

## 実施内容
- [x] Supabaseプロジェクトの作成
- [x] ER図に基づくデータベーステーブルの作成
  - [x] usersテーブル
  - [x] daily_recordsテーブル
  - [x] goalsテーブル
- [x] 各テーブルのカラム設定
- [x] 外部キー制約の設定
- [x] インデックスの作成
- [x] 初期データの投入（必要に応じて - 現段階では不要と判断）

## 参照資料
- @001_techstack.md
- @002_er.md
- @003_api.md

## 完了条件
- Supabaseプロジェクトが作成され、接続情報が環境変数として設定されていること
- ER図に基づいた3つのテーブルが正しく作成されていること
- テーブル間の関連付けが正しく設定されていること
- 次のタスク（#3 RLSポリシー設定）に進めるよう準備が整っていること
