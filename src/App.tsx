import React, { useState, useCallback, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ArdriveClient } from "./ardrive";
import MetadataCreator from "./components/MetadataCreator";
import Manual from "./components/Manual";

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
        const success = await ardriveClient.current.initialize({
          walletFile: file,
        });

        if (success) {
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

          setUploadedFiles(ardriveClient.current.getUploadedFiles());
          setUploadState((prev) => ({
            ...prev,
            success: "ウォレットが正常に読み込まれました",
            error: null,
          }));
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
        setUploadedFiles(ardriveClient.current.getUploadedFiles());
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
      setUploadedFiles(ardriveClient.current.getUploadedFiles());
    }
  }, [isInitialized]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDeleteFile = useCallback((id: string) => {
    ardriveClient.current.deleteUploadedFile(id);
    setUploadedFiles(ardriveClient.current.getUploadedFiles());
  }, []);

  const handleRefreshHistory = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setUploadState((prev) => ({ ...prev, success: null, error: null }));
      await ardriveClient.current.refreshUploadHistory();
      setUploadedFiles(ardriveClient.current.getUploadedFiles());
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
            <p>残高: {balance} winston</p>
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
              }}
            >
              履歴を更新
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
              <h3>アップロード済みファイル</h3>
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
                          履歴から削除
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

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        <nav
          style={{
            background: "white",
            padding: "1rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              gap: "2rem",
            }}
          >
            <Link
              to="/"
              style={{
                textDecoration: "none",
                color: "#007bff",
                fontWeight: "bold",
                fontSize: "1.1rem",
              }}
            >
              ArDrive Uploader
            </Link>
            <Link
              to="/metadata"
              style={{
                textDecoration: "none",
                color: "#007bff",
                fontWeight: "bold",
                fontSize: "1.1rem",
              }}
            >
              Metadata Builder
            </Link>
            <Link
              to="/manual"
              style={{
                textDecoration: "none",
                color: "#007bff",
                fontWeight: "bold",
                fontSize: "1.1rem",
              }}
            >
              Manual
            </Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<ArDriveUploader />} />
          <Route path="/metadata" element={<MetadataCreator />} />
          <Route path="/manual" element={<Manual />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
