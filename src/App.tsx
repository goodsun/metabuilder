import React, { useState, useCallback, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ArdriveClient } from "./ardrive";
import MetadataCreator from "./components/MetadataCreator";
import Manual from "./components/Manual";
import FileHistory from "./components/FileHistory";
import ImageResizer from "./components/ImageResizer";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  url: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
  txId: string | null;
}

const ArDriveUploader: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showFileList, setShowFileList] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: null,
    txId: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const walletInputRef = useRef<HTMLInputElement>(null);
  const ardriveClient = useRef<ArdriveClient>(new ArdriveClient());

  const handleWalletUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      console.log("Wallet file selected:", file.name, file.size, "bytes");
      setUploadState((prev) => ({ ...prev, error: null, success: null }));

      try {
        console.log("Starting wallet initialization...");

        // ウォレット切り替え時にlocalStorageをクリア（初期化前に実行）
        localStorage.removeItem("uploadedFiles");
        ardriveClient.current.clearUploadedFiles();

        const result = await ardriveClient.current.initialize({
          walletFile: file,
        });

        if (result.success) {
          console.log("Wallet initialization successful");
          setIsInitialized(true);

          try {
            console.log("Getting wallet balance...");
            const walletBalance = await ardriveClient.current.getBalance();
            setBalance(walletBalance);
            console.log("Wallet balance:", walletBalance);
          } catch (balanceError) {
            console.warn("Failed to get balance:", balanceError);
            setBalance("取得に失敗");
          }

          // 初期化完了時点で履歴同期も完了しているはず
          const currentFiles = ardriveClient.current.getUploadedFiles();
          setUploadedFiles(currentFiles);
          localStorage.setItem("uploadedFiles", JSON.stringify(currentFiles));
          setUploadState((prev) => ({
            ...prev,
            success: `ウォレットが正常に読み込まれました（${
              result.filesCount || 0
            }件のファイルを取得）`,
            error: null,
          }));

          console.log(
            "Files loaded after initialization:",
            currentFiles.length
          );
        } else {
          console.error("Wallet initialization failed");
          setUploadState((prev) => ({
            ...prev,
            error:
              "ウォレットの初期化に失敗しました。正しいArweaveウォレットファイル（JSON形式）を選択してください。",
            success: null,
          }));
        }
      } catch (error) {
        console.error("Wallet upload error:", error);
        setUploadState((prev) => ({
          ...prev,
          error: `ウォレットエラー: ${
            error instanceof Error ? error.message : String(error)
          }`,
          success: null,
        }));
      }
    },
    []
  );

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setUploadState((prev) => ({
      ...prev,
      error: null,
      success: null,
      txId: null,
    }));
  }, []);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !isInitialized) return;

    setUploadState((prev) => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null,
      success: null,
      txId: null,
    }));

    try {
      const txId = await ardriveClient.current.uploadFile(
        selectedFile,
        (progress) => {
          setUploadState((prev) => ({
            ...prev,
            progress: Math.round(progress),
          }));
        }
      );

      if (txId) {
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 100,
          success: "ファイルのアップロードが完了しました！",
          txId,
        }));
        const newBalance = await ardriveClient.current.getBalance();
        setBalance(newBalance);
        const files = ardriveClient.current.getUploadedFiles();
        setUploadedFiles(files);
        localStorage.setItem("uploadedFiles", JSON.stringify(files));
      } else {
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          error: "アップロードに失敗しました",
        }));
      }
    } catch (error) {
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        error: `アップロードエラー: ${error}`,
      }));
    }
  }, [selectedFile, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      const files = ardriveClient.current.getUploadedFiles();
      console.log("useEffect updating files:", files.length);
      setUploadedFiles(files);
      localStorage.setItem("uploadedFiles", JSON.stringify(files));
    }
  }, [isInitialized]);

  useEffect(() => {
    const savedFiles = localStorage.getItem("uploadedFiles");
    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        setUploadedFiles(parsedFiles);
      } catch (error) {
        console.error("Failed to load saved files:", error);
      }
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDeleteFile = useCallback((id: string) => {
    ardriveClient.current.deleteUploadedFile(id);
    const files = ardriveClient.current.getUploadedFiles();
    setUploadedFiles(files);
    localStorage.setItem("uploadedFiles", JSON.stringify(files));
  }, []);

  const handleRefreshHistory = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setUploadState((prev) => ({ ...prev, success: null, error: null }));
      await ardriveClient.current.refreshUploadHistory();
      const files = ardriveClient.current.getUploadedFiles();
      setUploadedFiles(files);
      localStorage.setItem("uploadedFiles", JSON.stringify(files));
      setUploadState((prev) => ({
        ...prev,
        success: "アップロード履歴を更新しました",
      }));
    } catch (error) {
      setUploadState((prev) => ({
        ...prev,
        error: `履歴更新エラー: ${error}`,
      }));
    }
  }, [isInitialized]);

  const formatDate = (date: Date): string => {
    return (
      date.toLocaleDateString("ja-JP") + " " + date.toLocaleTimeString("ja-JP")
    );
  };

  const getDisplayFileType = (file: File): string => {
    if (file.type && file.type !== "application/octet-stream") {
      return file.type;
    }

    const extension = file.name.toLowerCase().split(".").pop();
    switch (extension) {
      case "glb":
      case "gltf":
        return "model/gltf-binary";
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      case "mp4":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "pdf":
        return "application/pdf";
      case "json":
        return "application/json";
      case "txt":
        return "text/plain";
      default:
        return file.type || "不明";
    }
  };

  return (
    <div className="container">
      <h1>ArDrive Uploader</h1>

      {!isInitialized ? (
        <div>
          <p>利用するArweaveウォレット（JSON形式）をセットしてください：</p>
          <b>Arweave Wallet JSON</b>
          {" : "}
          <input
            ref={walletInputRef}
            type="file"
            accept=".json"
            onChange={handleWalletUpload}
            style={{ margin: "1rem 0" }}
          />
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: "2rem" }}>
            <h3>ウォレット情報</h3>
            <p>残高: {Number(balance).toLocaleString()} winston</p>
            <button
              onClick={() => setShowFileList(!showFileList)}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                marginRight: "1rem",
              }}
            >
              {showFileList
                ? "ファイル一覧を隠す"
                : `アップロード済みファイル一覧 (${uploadedFiles.length}件)`}
            </button>
            <button
              onClick={handleRefreshHistory}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                marginRight: "1rem",
              }}
            >
              履歴を更新
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "すべてのファイル履歴を削除しますか？この操作は元に戻せません。"
                  )
                ) {
                  ardriveClient.current.clearUploadedFiles();
                  setUploadedFiles([]);
                  localStorage.removeItem("uploadedFiles");
                }
              }}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
              }}
            >
              一括削除
            </button>
          </div>

          {showFileList && (
            <div
              style={{
                marginBottom: "2rem",
                border: "1px solid #ddd",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ margin: 0 }}>アップロード済みファイル</h3>
                <button
                  onClick={() => {
                    const files = ardriveClient.current.getUploadedFiles();
                    console.log("Force refresh files:", files.length);
                    setUploadedFiles([...files]);
                  }}
                  style={{
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                  }}
                >
                  リフレッシュ
                </button>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  margin: "0 0 1rem 0",
                }}
              >
                デバッグ: {uploadedFiles.length}件のファイル
              </p>
              {uploadedFiles.length === 0 ? (
                <p>アップロード済みファイルはありません</p>
              ) : (
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        border: "1px solid #eee",
                        padding: "1rem",
                        marginBottom: "0.5rem",
                        borderRadius: "4px",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h2> {file.name}</h2>
                          <p>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginTop: "4px",
                              }}
                            >
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(file.url);
                                  alert("URLをクリップボードにコピーしました");
                                }}
                                style={{
                                  background: "#007bff",
                                  color: "white",
                                  border: "none",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  flexShrink: 0,
                                }}
                              >
                                URLをコピー
                              </button>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#666",
                                  fontFamily: "monospace",
                                  wordBreak: "break-all",
                                  flex: 1,
                                }}
                              >
                                {file.url}
                              </div>
                            </div>
                          </p>
                          <p>
                            {formatFileSize(file.size)} | {file.type} |{" "}
                            {formatDate(file.uploadDate)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          style={{
                            backgroundColor: "#ff4444",
                            color: "white",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            className={`upload-area ${uploadState.isUploading ? "" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />

            {selectedFile ? (
              <div className="file-info">
                <h3>選択されたファイル</h3>
                <p>
                  <strong>名前:</strong> {selectedFile.name}
                </p>
                <p>
                  <strong>サイズ:</strong> {formatFileSize(selectedFile.size)}
                </p>
                <p>
                  <strong>タイプ:</strong> {getDisplayFileType(selectedFile)}
                </p>
              </div>
            ) : (
              <div>
                <p>
                  ファイルをドラッグ&ドロップするか、クリックして選択してください
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    marginTop: "0.5rem",
                  }}
                >
                  対応形式: すべてのファイル形式
                </p>
              </div>
            )}
          </div>

          {selectedFile && !uploadState.isUploading && (
            <button
              className="upload-button"
              onClick={handleUpload}
              disabled={uploadState.isUploading}
            >
              アップロード開始
            </button>
          )}

          {uploadState.isUploading && (
            <div>
              <p>アップロード中...</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <p>{Math.round(uploadState.progress)}%</p>
            </div>
          )}
        </div>
      )}

      {uploadState.error && <div className="error">{uploadState.error}</div>}

      {uploadState.success && (
        <div className="success">
          {uploadState.success}
          {uploadState.txId && (
            <div style={{ marginTop: "0.5rem" }}>
              <strong>トランザクションID:</strong> {uploadState.txId}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "3rem",
          textAlign: "center",
          padding: "2rem",
          background: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e9ecef",
        }}
      >
        <h3 style={{ marginBottom: "1rem", color: "#333" }}>
          ウォレット作成・TURBOクレジット購入
        </h3>
        <p style={{ marginBottom: "1.5rem", color: "#666" }}>
          Arweaveウォレットの作成とTURBOクレジットの購入は
          ArDrive公式サイトで行えます
        </p>
        <a
          href="https://app.ardrive.io/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            textDecoration: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "16px",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#0056b3")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#007bff")
          }
        >
          ArDrive公式サイトを開く
        </a>
      </div>
    </div>
  );
};

const ResponsiveNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { to: "/", label: "ArDrive Uploader" },
    { to: "/metadata", label: "Metadata Builder" },
    { to: "/history", label: "Material Vault" },
    { to: "/resizer", label: "Image Resizer" },
    { to: "/manual", label: "Manual" },
  ];

  return (
    <nav
      style={{
        background: "white",
        padding: "1rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "2rem",
        position: "relative",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "#007bff",
            fontWeight: "bold",
            fontSize: "1.2rem",
          }}
        >
          ArDriveTools
        </Link>

        {/* デスクトップメニュー */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "center",
          }}
          className="desktop-menu"
        >
          {menuItems.slice(1).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                textDecoration: "none",
                color: "#007bff",
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* ハンバーガーメニューボタン */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            padding: "0.5rem",
          }}
          className="hamburger-btn"
        >
          ☰
        </button>
      </div>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 1000,
            display: "none",
          }}
          className="mobile-menu"
        >
          {menuItems.slice(1).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: "block",
                padding: "1rem 2rem",
                textDecoration: "none",
                color: "#007bff",
                fontWeight: "bold",
                borderBottom: "1px solid #eee",
                fontSize: "1rem",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .hamburger-btn {
            display: block !important;
          }
          .mobile-menu {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ minHeight: "100vh", background: "#f5f5f5", width: "100%" }}>
        <ResponsiveNav />

        <Routes>
          <Route path="/" element={<ArDriveUploader />} />
          <Route path="/metadata" element={<MetadataCreator />} />
          <Route path="/history" element={<FileHistory />} />
          <Route path="/resizer" element={<ImageResizer />} />
          <Route path="/manual" element={<Manual />} />
        </Routes>

        <footer
          style={{
            marginTop: "20px",
            padding: "2rem 1rem",
            textAlign: "center",
            borderTop: "1px solid #e9ecef",
            background: "white",
            color: "#666",
            fontSize: "0.9rem",
          }}
        >
          <a
            href={import.meta.env.VITE_FOOTER_LINK || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#666",
              textDecoration: "none",
            }}
          >
            {import.meta.env.VITE_FOOTER_DISP ||
              "© 2025 bon-soleil. All rights reserved."}
          </a>
        </footer>
      </div>
    </Router>
  );
};

export default App;
