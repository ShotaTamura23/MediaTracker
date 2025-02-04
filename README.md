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

## 無料デプロイ方法

このプロジェクトは以下の無料サービスを組み合わせてデプロイできます：

### 1. フロントエンド＆バックエンド (Vercel)

1. [Vercel](https://vercel.com)にGitHubアカウントでサインアップ
2. 「New Project」をクリック
3. GitHubリポジトリをインポート
4. Framework Presetで「Other」を選択
5. 「Build and Output Settings」を設定:
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
6. 環境変数を設定:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `DATABASE_URL`（Supabaseの接続文字列）
   - `SESSION_SECRET`（ランダムな文字列）
   - `NODE_ENV`を`production`に設定
7. プロジェクトルートに`vercel.json`を作成し、以下の内容を追加:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "functions": {
    "api/**/*": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```
8. 「Deploy」をクリック

### 2. データベース (Supabase)

1. [Supabase](https://supabase.com)にGitHubアカウントでサインアップ
2. 「New Project」をクリック
3. 以下の設定を行う：
   - Name: プロジェクト名
   - Database Password: 安全なパスワードを設定
   - Region: 最寄りのリージョン
   - Pricing Plan: Free Tier
4. 「Create New Project」をクリック
5. プロジェクト作成後、データベースの接続情報を取得:
   - Project Settings → Database
   - Connection String をコピー
6. デモデータのインポート:
   - SQLエディタを開く
   - 新しいクエリを作成
   - `initial_data.sql`の内容をコピー＆ペースト
   - 「Run」をクリック

#### デモデータのインポート手順（詳細）

1. Supabase SQLエディタでの実行:
```sql
-- 既存のテーブルが存在する場合は削除
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS article_restaurants CASCADE;
DROP TABLE IF EXISTS newsletters CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- initial_data.sqlの内容を実行
```

2. データの確認:
   - Table EditorでUsersテーブルを確認
   - デモ管理者アカウントが作成されていることを確認:
     - ユーザー名: admin
     - パスワード: admin
     - メール: admin@example.com

3. トラブルシューティング:
   - エラーが発生した場合は、各テーブルを個別に作成
   - 外部キー制約のエラーが出た場合は、テーブルの作成順序を確認


#### 環境変数の設定

Vercelの環境変数に以下を設定します：

```env
# Supabase Database URL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres"

# Google Maps
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# Session Secret (32文字以上のランダムな文字列)
SESSION_SECRET="your_random_secret_key"

# Node Environment
NODE_ENV="production"
```

### 注意点と制限事項

#### Vercel Free Tier の制限:
- サーバーレス関数の実行時間: 10秒まで
- デプロイメント：
  - 100 デプロイメント/日
  - チーム全体で1000デプロイメント/月
- 帯域幅: 100GB/月
- ビルド時間: 最大45分
- サーバーレス関数の同時実行数: 最大6

#### Supabase Free Tier の制限:
- データベースサイズ: 500MB
- 同時接続数: 30
- サーバーレス関数: 500,000回/月
- データベースのバックアップ：週1回
- Row制限なし
- 帯域幅: 2GB/月
- Auth Users: 50,000
- Edge Functions実行時間: 2秒/関数

### デプロイ後の確認事項

1. フロントエンドの動作確認
   - ページの表示
   - 認証機能
   - 地図の表示

2. バックエンドの動作確認
   - API エンドポイント
   - データベース接続
   - セッション管理

3. データベースの確認
   - テーブルの存在
   - 初期データの確認
   - クエリの実行

### トラブルシューティング

1. デプロイ失敗時
   - Vercelのビルドログを確認
   - 環境変数が正しく設定されているか確認
   - `package.json`のスクリプトが正しいか確認

2. データベース接続エラー
   - Supabaseの接続文字列が正しいか確認
   - IPアドレス制限が適切か確認
   - SSL接続が有効か確認

3. 認証エラー
   - セッション設定を確認
   - Cookieの設定を確認
   - CORS設定を確認

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