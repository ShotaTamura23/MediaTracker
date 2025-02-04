# Japanese Cuisine Explorer UK 🍱

イギリスの日本食レストラン情報プラットフォーム

## プロジェクト概要

イギリス国内の日本食レストラン情報を提供するウェブプラットフォームです。レストランのレビュー、地域ごとの店舗リスト、新店舗情報などを提供し、ユーザーがお気に入りの店舗を見つけやすい環境を提供します。

### 主な機能

- レストラン情報の閲覧・検索
- 地図上での店舗位置確認
- レビュー記事の投稿（管理者のみ）
- お気に入り記事のブックマーク機能
- ニュースレター購読機能
- 多言語対応（日本語・英語）

## 技術スタック

### フロントエンド
- React 18
- Vite 5.x
- TypeScript 5.x
- TailwindCSS 3.x
- shadcn/ui
- TipTap Editor
- Google Maps JavaScript API
- Tanstack Query v5 (React Query)
- wouter (ルーティング)

### バックエンド
- Node.js v20.x
- Express 4.x
- TypeScript 5.x
- PostgreSQL 15以上
- Drizzle ORM
- Passport.js (認証)

## 開発環境のセットアップ

### 1. Node.jsのインストール

Node.js v20.xをインストールしてください。推奨はv20.10.0以降です。
nvm（Node Version Manager）の使用を推奨します：

```bash
# nvmのインストール（macOS/Linux）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Node.jsのインストール
nvm install 20
nvm use 20
```

### 2. パッケージマネージャーのインストール

pnpmを使用します：

```bash
# pnpmのインストール
npm install -g pnpm

# 依存関係のインストール
pnpm install
```

### 3. PostgreSQLのセットアップ

#### macOS
```bash
# Homebrewを使用してインストール
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian
```bash
# PostgreSQLのインストール
sudo apt update
sudo apt install postgresql-15

# PostgreSQLサービスの開始
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
1. PostgreSQLのインストーラーを[公式サイト](https://www.postgresql.org/download/windows/)からダウンロード
2. インストーラーを実行し、デフォルト設定でインストール
3. インストール時に設定したパスワードを保存しておく


### 4. Google Maps APIキーの取得

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. Maps JavaScript APIを有効化:
   - 「APIとサービス」→「ライブラリ」
   - 「Maps JavaScript API」を検索して有効化
4. APIキーの作成:
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「APIキー」
5. APIキーの制限設定:
   - 作成したAPIキーをクリック
   - 「アプリケーションの制限」で「HTTPリファラー」を選択
   - 開発環境のURLを追加（例：`http://localhost:5173/*`）

### 5. 環境変数の設定

1. `.env.example`をコピーして`.env`を作成:
```bash
cp .env.example .env
```

2. `.env`ファイルを編集し、必要な環境変数を設定:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/japanese_cuisine_db"

# Google Maps
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# Session Secret
SESSION_SECRET="generate_random_string_here"
```

### 6. データベースのセットアップ

```bash
# PostgreSQLにログイン
psql -U postgres

# データベースの作成
CREATE DATABASE japanese_cuisine_db;
\q

# 初期データのインポート
psql -U postgres japanese_cuisine_db < initial_data.sql
```

### 7. スキーマの適用とマイグレーション

```bash
# スキーマの適用
pnpm db:push
```

## 開発サーバーの起動

```bash
# 開発サーバーの起動
pnpm dev
```

アプリケーションは http://localhost:5173 で起動します。

## 管理者アカウント

初期データには以下の管理者アカウントが含まれています：
- ユーザー名: admin
- パスワード: admin
- メール: admin@example.com

## ディレクトリ構造

```
.
├── client/                 # フロントエンドのソースコード
│   ├── src/
│   │   ├── components/    # Reactコンポーネント
│   │   ├── hooks/        # カスタムフック
│   │   ├── lib/          # ユーティリティ関数
│   │   ├── pages/        # ページコンポーネント
│   │   └── App.tsx       # メインアプリケーション
├── db/                    # データベース関連
│   ├── schema.ts         # Drizzleスキーマ定義
│   └── migrations/       # データベースマイグレーション
├── server/               # バックエンドのソースコード
│   ├── routes.ts        # APIルート定義
│   └── auth.ts          # 認証関連の処理
└── public/              # 静的ファイル
```

## 開発用コマンド

```bash
# 開発サーバー起動
pnpm dev

# データベーススキーマの適用
pnpm db:push

# プロダクションビルド
pnpm build

# 型チェック
pnpm typecheck

# コードフォーマット
pnpm format
```

## デプロイ手順

1. 本番環境用の環境変数を設定
2. データベースの準備
3. ビルドとデプロイ

```bash
# ビルド
pnpm build

# 起動
pnpm start
```

## トラブルシューティング

### よくある問題と解決方法

1. データベース接続エラー
   - DATABASE_URLの形式を確認
   - PostgreSQLサービスが起動していることを確認
   - ユーザー名とパスワードが正しいか確認

2. 管理者ページにアクセスできない
   - ユーザーが管理者権限を持っているか確認
   - セッションが正常に機能しているか確認
   - initial_data.sqlが正しくインポートされているか確認

3. 地図が表示されない
   - Google Maps APIキーが正しく設定されているか確認
   - APIキーの制限が適切に設定されているか確認
   - VITE_GOOGLE_MAPS_API_KEYが.envファイルに正しく設定されているか確認

4. pnpmコマンドが認識されない
   - Node.jsが正しくインストールされているか確認
   - pnpmのグローバルインストールを再試行

## バックアップと復元

### データベースのバックアップ作成

```bash
pg_dump -U postgres japanese_cuisine_db > backup.sql
```

### バックアップからの復元

```bash
psql -U postgres japanese_cuisine_db < backup.sql
```

## ライセンス

このプロジェクトは [MIT License](LICENSE) のもとで公開されています。

## 貢献について

1. このリポジトリをフォーク
2. 機能開発用のブランチを作成
3. 変更をコミット
4. プルリクエストを作成