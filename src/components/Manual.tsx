import React from "react";

const Manual: React.FC = () => {
  return (
    <div
      className="container"
      style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}
    >
      <h1>ArDriveTools 使用マニュアル</h1>

      <div
        style={{
          background: "#f8f9fa",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h2>ArDriveToolsとは</h2>
        <p>
          ArDriveToolsは、Arweaveブロックチェーンを使用したファイルアップロードとNFTメタデータ作成を統合したWebアプリケーションです。
        </p>
      </div>

      <section style={{ marginBottom: "3rem" }}>
        <h2>1. ArDrive Uploader</h2>

        <h3>🔑 ウォレットの準備</h3>
        <div
          style={{
            background: "#fff3cd",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          <strong>必要なもの：</strong>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>Arweaveウォレットファイル（JSON形式）</li>
            <li>
              TURBOクレジット（アップロード費用）- クレジットカードで購入可能
            </li>
          </ul>
        </div>

        <h4>🆕 ウォレットの作成・取得方法</h4>

        <div
          style={{
            background: "#e7f3ff",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          <h5>1. ArDriveでウォレット作成（推奨）</h5>
          <ol style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>
              <a
                href="https://app.ardrive.io/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#007bff" }}
              >
                ArDrive公式サイト
              </a>{" "}
              にアクセス
            </li>
            <li>「Sign Up」をクリック</li>
            <li>メールアドレスとパスワードを設定</li>
            <li>
              アカウント作成後、「Profile」→「Wallet」→「Download
              Wallet」でJSONファイルをダウンロード
            </li>
          </ol>
          <p>
            <strong>⚠️ 重要：</strong>
            ダウンロードしたJSONファイルは安全な場所に保管してください。紛失すると復旧できません。
          </p>
        </div>

        <h4>💳 TURBOクレジットの購入方法（推奨）</h4>

        <div
          style={{
            background: "#fff5f5",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          <h5>ArDriveでクレジットカード購入：</h5>
          <ol style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>
              <a
                href="https://app.ardrive.io/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#007bff" }}
              >
                ArDriveアプリ
              </a>
              にログイン
            </li>
            <li>
              画面上部の「Buy Turbo」または「Buy Credits」ボタンをクリック
            </li>
            <li>購入したい金額を選択（最低$5から）</li>
            <li>クレジットカード情報を入力</li>
            <li>購入完了後、TURBOクレジットがウォレットに追加されます</li>
          </ol>

          <h5>💡 TURBOの特徴：</h5>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>
              <strong>簡単購入：</strong>クレジットカードで直接購入可能
            </li>
            <li>
              <strong>即座に利用：</strong>
              購入後すぐにファイルアップロードに使用可能
            </li>
            <li>
              <strong>手数料込み：</strong>
              ネットワーク手数料が含まれているため追加費用なし
            </li>
            <li>
              <strong>USD建て：</strong>価格が安定しており予算管理が簡単
            </li>
          </ul>

          <h5>📊 料金目安：</h5>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>
              <strong>写真（1-5MB）：</strong>約$0.01-0.05
            </li>
            <li>
              <strong>動画（100MB）：</strong>約$1
            </li>
            <li>
              <strong>3Dモデル（50MB）：</strong>約$0.50
            </li>
            <li>
              <strong>大容量ファイル（1GB）：</strong>約$10
            </li>
          </ul>

          <p>
            <strong>💡 ヒント：</strong>
            初回は$5-10程度の購入で十分です。使い切ったら追加購入できます。
          </p>
        </div>

        <h4>📥 ウォレットファイルの取得方法</h4>

        <div
          style={{
            background: "#f8f9fa",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          <h5>ArDriveからの取得：</h5>
          <ol style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>ArDriveにログイン</li>
            <li>右上のプロフィールアイコンをクリック</li>
            <li>「Profile」→「Wallet」タブを選択</li>
            <li>「Download Wallet」ボタンをクリック</li>
            <li>JSONファイルがダウンロードされます</li>
          </ol>

          <h5>Arweave.appからの取得：</h5>
          <ol style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>Arweave.appでウォレットを作成</li>
            <li>「Download」ボタンでJSONファイルを保存</li>
          </ol>

          <h5>ArConnect拡張機能の場合：</h5>
          <ol style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>ArConnect拡張機能を開く</li>
            <li>「Export Wallet」機能を使用</li>
            <li>秘密鍵をJSONファイルとして出力</li>
          </ol>
        </div>

        <div
          style={{
            background: "#d4edda",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          <h5>🔐 セキュリティ上の注意：</h5>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>ウォレットファイルは絶対に他人と共有しないでください</li>
            <li>複数の安全な場所にバックアップを保存してください</li>
            <li>パスワード保護されたフォルダに保存することを推奨します</li>
            <li>クラウドストレージに保存する場合は暗号化してください</li>
          </ul>
        </div>

        <h3>📁 ファイルアップロード手順</h3>
        <ol style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          <li>
            <strong>ウォレット読み込み：</strong>
            JSON形式のArweaveウォレットファイルを選択
          </li>
          <li>
            <strong>残高確認：</strong>winston単位で表示される残高を確認
          </li>
          <li>
            <strong>ファイル選択：</strong>
            ドラッグ&ドロップまたはクリックでファイルを選択
          </li>
          <li>
            <strong>アップロード実行：</strong>
            「アップロード開始」ボタンをクリック
          </li>
        </ol>

        <h3>📋 アップロード済みファイル管理</h3>
        <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          <li>
            <strong>履歴表示：</strong>
            「アップロード済みファイル一覧」ボタンで確認
          </li>
          <li>
            <strong>URL取得：</strong>
            「URLをコピー」ボタンでArweaveURLをクリップボードにコピー
          </li>
          <li>
            <strong>履歴同期：</strong>
            「履歴を更新」ボタンでArweaveネットワークから最新履歴を取得
          </li>
          <li>
            <strong>履歴削除：</strong>
            「履歴から削除」でローカル履歴から削除（ブロックチェーン上のデータは削除不可）
          </li>
        </ul>

        <div
          style={{
            background: "#d1ecf1",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          <strong>💡 重要な注意事項：</strong>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>
              Arweaveにアップロードされたファイルは<strong>永続的</strong>
              で削除できません
            </li>
            <li>アップロード費用はファイルサイズに応じて課金されます</li>
            <li>HTTPS環境でのみ動作します</li>
          </ul>
        </div>
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2>2. NFTメタデータ作成</h2>

        <h3>📝 基本情報入力</h3>
        <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          <li>
            <strong>名前：</strong>NFTの名前（必須）
          </li>
          <li>
            <strong>説明：</strong>NFTの説明文（必須）
          </li>
          <li>
            <strong>画像URL：</strong>NFTの画像URL（必須）
          </li>
          <li>
            <strong>アニメーションURL：</strong>動画や3DモデルのURL（任意）
          </li>
          <li>
            <strong>外部URL：</strong>関連サイトのURL（任意）
          </li>
          <li>
            <strong>YouTube URL：</strong>関連動画のURL（任意）
          </li>
        </ul>

        <h3>🏷️ 属性（Attributes）管理</h3>
        <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          <li>
            <strong>追加：</strong>特性名と値を入力して「追加」ボタン
          </li>
          <li>
            <strong>編集：</strong>各属性の「編集」ボタンでインライン編集
          </li>
          <li>
            <strong>順番変更：</strong>↑↓ボタンで属性の順序を調整
          </li>
          <li>
            <strong>削除：</strong>「削除」ボタンで属性を削除
          </li>
          <li>
            <strong>URLプレビュー：</strong>
            属性値がURLの場合、自動で画像/3Dモデルをプレビュー表示
          </li>
        </ul>

        <h3>🖼️ プレビュー機能</h3>
        <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          <li>
            <strong>リアルタイムプレビュー：</strong>
            右側にNFTの見た目をリアルタイム表示
          </li>
          <li>
            <strong>3Dモデル対応：</strong>GLB/GLTFファイルを3Dビューアーで表示
          </li>
          <li>
            <strong>属性プレビュー：</strong>
            URL形式の属性値を自動判定してプレビュー
          </li>
        </ul>

        <h3>💾 データ管理</h3>
        <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          <li>
            <strong>JSONコピー：</strong>
            生成されたメタデータJSONをクリップボードにコピー
          </li>
          <li>
            <strong>JSONダウンロード：</strong>
            メタデータJSONファイルをダウンロード
          </li>
          <li>
            <strong>JSON読み込み：</strong>
            既存のJSONファイルを読み込んで編集再開
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2>3. 画像リサイズツール</h2>

        <div
          style={{
            background: "#f8f9fa",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <p>
            Material VaultとManualの間に配置された画像リサイズツールは、画像のサイズや形式を変更してファイルサイズを最適化するためのツールです。
          </p>
        </div>

        <h3>📷 画像選択</h3>
        <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          <li>
            <strong>ドラッグ&ドロップ：</strong>
            画像ファイルを直接ドラッグしてアップロードエリアにドロップ
          </li>
          <li>
            <strong>クリック選択：</strong>
            アップロードエリアをクリックしてファイル選択ダイアログから選択
          </li>
          <li>
            <strong>対応形式：</strong>JPEG, PNG, WebP, GIF
          </li>
        </ul>

        <h3>⚙️ リサイズ設定</h3>
        <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          <li>
            <strong>アスペクト比を維持：</strong>
            チェックすると幅または高さを変更した際に自動で比率を保持
          </li>
          <li>
            <strong>幅・高さ設定：</strong>
            ピクセル単位で出力サイズを指定（アスペクト比維持時は片方を変更すると自動計算）
          </li>
          <li>
            <strong>出力形式：</strong>
            <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
              <li><strong>JPEG：</strong>写真に適した圧縮形式（品質調整可能）</li>
              <li><strong>PNG：</strong>透明度を保持、可逆圧縮</li>
              <li><strong>WebP：</strong>高圧縮率、現代的な形式（品質調整可能）</li>
            </ul>
          </li>
          <li>
            <strong>品質設定：</strong>
            JPEG・WebPの場合、10%〜100%で圧縮品質を調整
          </li>
        </ul>

        <h3>🖼️ プレビュー・出力</h3>
        <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          <li>
            <strong>リアルタイムプレビュー：</strong>
            設定変更後「リサイズ実行」ボタンでプレビューを表示
          </li>
          <li>
            <strong>ファイルサイズ推定：</strong>
            出力後のファイルサイズを表示
          </li>
          <li>
            <strong>ダウンロード：</strong>
            「ダウンロード」ボタンで加工済み画像を保存
          </li>
        </ul>

        <div
          style={{
            background: "#fff3cd",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          <strong>💡 使用例：</strong>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>NFT作成前の画像最適化</li>
            <li>大きな画像ファイルの軽量化</li>
            <li>SNS投稿用サイズへの調整</li>
            <li>異なる形式への変換</li>
          </ul>
        </div>

        <div
          style={{
            background: "#d4edda",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          <strong>🔧 技術仕様：</strong>
          <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
            <li>Canvas APIによる高品質リサイズ</li>
            <li>ブラウザ内処理（サーバーにアップロードなし）</li>
            <li>imageSmoothingEnabled による高品質スケーリング</li>
          </ul>
        </div>
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2>4. 対応ファイル形式</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "1rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
            }}
          >
            <h4>📷 画像</h4>
            <ul
              style={{
                fontSize: "0.9rem",
                paddingLeft: "1.5rem",
                margin: "0.5rem 0",
              }}
            >
              <li>PNG (.png)</li>
              <li>JPEG (.jpg, .jpeg)</li>
              <li>GIF (.gif)</li>
              <li>WebP (.webp)</li>
            </ul>
          </div>

          <div
            style={{
              background: "#fff",
              padding: "1rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
            }}
          >
            <h4>🎬 動画</h4>
            <ul
              style={{
                fontSize: "0.9rem",
                paddingLeft: "1.5rem",
                margin: "0.5rem 0",
              }}
            >
              <li>MP4 (.mp4)</li>
              <li>WebM (.webm)</li>
            </ul>
          </div>

          <div
            style={{
              background: "#fff",
              padding: "1rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
            }}
          >
            <h4>🎵 音声</h4>
            <ul
              style={{
                fontSize: "0.9rem",
                paddingLeft: "1.5rem",
                margin: "0.5rem 0",
              }}
            >
              <li>MP3 (.mp3)</li>
              <li>WAV (.wav)</li>
            </ul>
          </div>

          <div
            style={{
              background: "#fff",
              padding: "1rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
            }}
          >
            <h4>🎯 3Dモデル</h4>
            <ul
              style={{
                fontSize: "0.9rem",
                paddingLeft: "1.5rem",
                margin: "0.5rem 0",
              }}
            >
              <li>GLB (.glb)</li>
              <li>GLTF (.gltf)</li>
            </ul>
          </div>

          <div
            style={{
              background: "#fff",
              padding: "1rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
            }}
          >
            <h4>📄 文書</h4>
            <ul
              style={{
                fontSize: "0.9rem",
                paddingLeft: "1.5rem",
                margin: "0.5rem 0",
              }}
            >
              <li>PDF (.pdf)</li>
              <li>JSON (.json)</li>
              <li>テキスト (.txt)</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2>5. よくある質問</h2>

        <div style={{ marginBottom: "1.5rem" }}>
          <h3>Q: アップロードしたファイルを削除できますか？</h3>
          <p>
            A: Arweaveブロックチェーンの性質上、一度アップロードされたファイルは
            <strong>永久に削除できません</strong>
            。「履歴から削除」はローカル履歴のみを削除します。
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h3>Q: アップロード費用はどのくらいかかりますか？</h3>
          <p>
            A:
            ファイルサイズに応じて決まります。小さなファイル（数KB〜数MB）であれば非常に安価です。大きなファイルの場合は事前に費用を確認してください。
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h3>Q: 3Dモデルが表示されません</h3>
          <p>
            A:
            GLB/GLTFファイルが正しい形式であることを確認してください。また、ブラウザがWebGLに対応している必要があります。
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h3>Q: ローカル環境と本番環境でファイル履歴が異なります</h3>
          <p>
            A:
            ローカルストレージに保存された履歴は環境ごとに異なります。「履歴を更新」ボタンでArweaveネットワークから最新情報を取得してください。
          </p>
        </div>
      </section>

      <section>
        <h2>6. 技術情報</h2>
        <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          <li>
            <strong>ブロックチェーン：</strong>Arweave
          </li>
          <li>
            <strong>SDK：</strong>ArDrive Turbo SDK
          </li>
          <li>
            <strong>対応ブラウザ：</strong>Chrome, Firefox, Safari,
            Edge（最新版）
          </li>
          <li>
            <strong>必要環境：</strong>HTTPS接続
          </li>
          <li>
            <strong>フレームワーク：</strong>React 19 + TypeScript
          </li>
        </ul>
      </section>
    </div>
  );
};

export default Manual;
