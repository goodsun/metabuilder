# ArTool - 統合 NFT ツール

ArDrive アップロード機能と NFT メタデータ作成機能を統合した Web アプリケーション。

## 機能

### 1. ArDrive Uploader (`/`)

- Arweave ネットワークへの永続ファイル保存
- ウォレット残高確認
- アップロード履歴管理
- ドラッグ&ドロップ対応

### 2. NFT メタデータ作成 (`/metadata`)

- NFT メタデータのフォーム入力・編集
- JSON ファイルの読み込み・出力
- 3D モデル（GLB/GLTF）のプレビュー
- リアルタイムプレビュー機能
- 属性の編集・削除・順番変更
- 属性値のインライン編集

## 開発環境

### 依存関係のインストール

**bun 使用:**

```bash
bun install
```

### 開発サーバー起動

**bun 使用:**

```bash
bun dev
```

http://localhost:3001 でアクセス可能

### 本番ビルド

**bun 使用:**

```bash
bun run build
```

## デプロイ方法

### 1. 静的ホスティング（推奨）

#### Netlify（最も簡単）

1. [netlify.com](https://netlify.com) にアクセス
2. "Deploy manually" を選択
3. `dist` フォルダをドラッグ&ドロップ
4. 自動的に HTTPS 対応サイトが作成される

#### GitHub Pages

```bash
# GitHubリポジトリにpush
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main

# Settings > Pages > Source: Deploy from a branch
# Branch: main, Folder: /dist
```

#### Vercel

```bash
# vercel CLI使用
bun install -g vercel
vercel --prod
```

### 2. Apache サーバー

#### 必要な要件

- Apache 2.4 以降
- mod_rewrite 有効
- mod_headers 有効
- HTTPS 必須（ウォレット機能のため）

#### 必要な Apache モジュール

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate
sudo systemctl restart apache2
```

#### ディレクトリ設定

```apache
# /etc/apache2/sites-available/000-default.conf
<Directory /var/www/html>
    AllowOverride All
    Require all granted
</Directory>
```

#### ファイルのアップロード

```bash
# distフォルダの全内容をウェブルートにコピー
scp -r dist/* user@server:/var/www/html/
```

#### HTTPS 設定（必須）

```bash
# Let's Encryptを使用する場合
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d yourdomain.com
```

### 3. ファイル構成

デプロイに必要なファイル：

```
dist/
├── index.html          # メインHTMLファイル
├── .htaccess          # Apache設定（SPA対応、CSP設定）
└── assets/
    ├── index-[hash].js    # バンドルされたJavaScript
    └── index-[hash].css   # バンドルされたCSS
```

### 4. 重要な設定

#### Content Security Policy

`.htaccess`に以下のドメインが設定済み：

- `https://arweave.net` - Arweave ネットワーク
- `https://*.arweave.net` - Arweave サブドメイン
- `https://*.ardrive.io` - ArDrive API
- `https://payment.ardrive.io` - ArDrive Payment API
- `https://unpkg.com` - Model Viewer CDN
- `blob:` - 3D モデルプレビュー用

#### React Router 対応

`.htaccess`で SPA 用リライトルール設定済み：

```apache
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## トラブルシューティング

### よくある問題

1. **`/metadata`が 404 エラー**

   - mod_rewrite が無効
   - AllowOverride 設定が不正
   - .htaccess がアップロードされていない

2. **ウォレット機能が動作しない**

   - HTTPS 環境でない
   - CSP で ArDrive ドメインがブロックされている

3. **3D プレビューが表示されない**
   - CSP で blob:が許可されていない
   - Model Viewer の CDN 読み込みエラー

### エラー確認方法

ブラウザの開発者ツール（F12）で Console タブを確認してください。

## ライセンス

MIT License

## 技術スタック

- **Frontend**: React 19 + TypeScript
- **Runtime**: Node.js 16+ または Bun 1.0+
- **Package Manager**: bun
- **Bundler**: Vite
- **Routing**: React Router DOM
- **Blockchain**: Arweave + ArDrive SDK
- **3D Viewer**: Google Model Viewer
- **Styling**: CSS Modules
