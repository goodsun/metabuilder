import React, { useState, useRef, useCallback } from "react";

interface ResizeOptions {
  width?: number;
  height?: number;
  quality: number;
  format: "jpeg" | "png" | "webp";
  maintainAspectRatio: boolean;
}

const ImageResizer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [resizedImageUrl, setResizedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [resizeOptions, setResizeOptions] = useState<ResizeOptions>({
    width: 800,
    height: 600,
    quality: 0.9,
    format: "jpeg",
    maintainAspectRatio: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください");
      return;
    }

    setSelectedFile(file);
    setResizedImageUrl(null);

    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      setResizeOptions(prev => ({
        ...prev,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));
    };
    img.src = URL.createObjectURL(file);
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

  const calculateDimensions = useCallback((newWidth?: number, newHeight?: number) => {
    if (!originalImage) return { width: 0, height: 0 };

    const originalWidth = originalImage.naturalWidth;
    const originalHeight = originalImage.naturalHeight;
    const aspectRatio = originalWidth / originalHeight;

    if (resizeOptions.maintainAspectRatio) {
      if (newWidth && !newHeight) {
        return { width: newWidth, height: Math.round(newWidth / aspectRatio) };
      } else if (newHeight && !newWidth) {
        return { width: Math.round(newHeight * aspectRatio), height: newHeight };
      } else if (newWidth && newHeight) {
        const widthRatio = newWidth / originalWidth;
        const heightRatio = newHeight / originalHeight;
        const ratio = Math.min(widthRatio, heightRatio);
        return {
          width: Math.round(originalWidth * ratio),
          height: Math.round(originalHeight * ratio),
        };
      }
    }

    return {
      width: newWidth || originalWidth,
      height: newHeight || originalHeight,
    };
  }, [originalImage, resizeOptions.maintainAspectRatio]);

  const handleResize = useCallback(async () => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      const { width, height } = calculateDimensions(resizeOptions.width, resizeOptions.height);
      
      canvas.width = width;
      canvas.height = height;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(originalImage, 0, 0, width, height);

      const mimeType = `image/${resizeOptions.format}`;
      const dataUrl = canvas.toDataURL(mimeType, resizeOptions.quality);
      setResizedImageUrl(dataUrl);
    } catch (error) {
      console.error("Resize error:", error);
      alert("画像のリサイズに失敗しました");
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, resizeOptions, calculateDimensions]);

  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  const handleDownload = useCallback(() => {
    if (!resizedImageUrl || !selectedFile) return;

    const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const finalFileName = `${fileName}_resized.${resizeOptions.format}`;

    if (isIOS()) {
      // iOS用の処理
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${finalFileName}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  text-align: center; 
                  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                  background: #f5f5f5;
                }
                img { 
                  max-width: 100%; 
                  height: auto; 
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .download-instruction {
                  background: white;
                  padding: 15px;
                  border-radius: 8px;
                  margin: 20px 0;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .step {
                  margin: 10px 0;
                  padding: 10px;
                  background: #e3f2fd;
                  border-radius: 6px;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <h2>${finalFileName}</h2>
              <img src="${resizedImageUrl}" alt="${finalFileName}" />
              <div class="download-instruction">
                <h3>📱 iPhoneで画像を保存する方法</h3>
                <div class="step">1. 上の画像を長押しします</div>
                <div class="step">2. 「"写真"に保存」をタップします</div>
                <div class="step">3. 写真アプリに保存されます</div>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
      }
    } else {
      // 通常のダウンロード処理
      const link = document.createElement("a");
      link.download = finalFileName;
      link.href = resizedImageUrl;
      link.click();
    }
  }, [resizedImageUrl, selectedFile, resizeOptions.format, isIOS]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getEstimatedSize = useCallback(() => {
    if (!resizedImageUrl) return 0;
    
    const base64Length = resizedImageUrl.split(",")[1]?.length || 0;
    return Math.round(base64Length * 0.75);
  }, [resizedImageUrl]);

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "0 auto", 
      padding: isMobile ? "1rem" : "2rem" 
    }}>
      <h1 style={{ fontSize: isMobile ? "1.5rem" : "2rem" }}>画像リサイズツール</h1>
      
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            border: "2px dashed #ddd",
            borderRadius: "8px",
            padding: isMobile ? "1rem" : "2rem",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: selectedFile ? "#f8f9fa" : "white",
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileInputChange}
          />
          
          {selectedFile ? (
            <div>
              <h3>選択された画像</h3>
              <p><strong>ファイル名:</strong> {selectedFile.name}</p>
              <p><strong>サイズ:</strong> {formatFileSize(selectedFile.size)}</p>
              {originalImage && (
                <p><strong>解像度:</strong> {originalImage.naturalWidth} × {originalImage.naturalHeight}px</p>
              )}
            </div>
          ) : (
            <div>
              <p>画像をドラッグ&ドロップするか、クリックして選択してください</p>
              <p style={{ fontSize: "0.9rem", color: "#666" }}>
                対応形式: JPEG, PNG, WebP, GIF
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedFile && originalImage && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: "2rem", 
          marginBottom: "2rem" 
        }}>
          <div>
            <h3>リサイズ設定</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={resizeOptions.maintainAspectRatio}
                    onChange={(e) => setResizeOptions(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
                    style={{ marginRight: "0.5rem" }}
                  />
                  アスペクト比を維持
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.25rem" }}>幅 (px)</label>
                  <input
                    type="number"
                    value={resizeOptions.width || ""}
                    onChange={(e) => {
                      const width = parseInt(e.target.value) || undefined;
                      if (resizeOptions.maintainAspectRatio && width && originalImage) {
                        const aspectRatio = originalImage.naturalWidth / originalImage.naturalHeight;
                        const height = Math.round(width / aspectRatio);
                        setResizeOptions(prev => ({ ...prev, width, height }));
                      } else {
                        setResizeOptions(prev => ({ ...prev, width }));
                      }
                    }}
                    style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.25rem" }}>高さ (px)</label>
                  <input
                    type="number"
                    value={resizeOptions.height || ""}
                    onChange={(e) => {
                      const height = parseInt(e.target.value) || undefined;
                      if (resizeOptions.maintainAspectRatio && height && originalImage) {
                        const aspectRatio = originalImage.naturalWidth / originalImage.naturalHeight;
                        const width = Math.round(height * aspectRatio);
                        setResizeOptions(prev => ({ ...prev, width, height }));
                      } else {
                        setResizeOptions(prev => ({ ...prev, height }));
                      }
                    }}
                    style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.25rem" }}>出力形式</label>
                <select
                  value={resizeOptions.format}
                  onChange={(e) => setResizeOptions(prev => ({ ...prev, format: e.target.value as "jpeg" | "png" | "webp" }))}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              {resizeOptions.format !== "png" && (
                <div>
                  <label style={{ display: "block", marginBottom: "0.25rem" }}>
                    品質: {Math.round(resizeOptions.quality * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={resizeOptions.quality}
                    onChange={(e) => setResizeOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                    style={{ width: "100%" }}
                  />
                </div>
              )}

              <button
                onClick={handleResize}
                disabled={isProcessing}
                style={{
                  padding: "0.75rem",
                  backgroundColor: isProcessing ? "#6c757d" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                }}
              >
                {isProcessing ? "処理中..." : "リサイズ実行"}
              </button>
            </div>
          </div>

          <div>
            <h3>プレビュー</h3>
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "1rem", backgroundColor: "#f8f9fa" }}>
              {resizedImageUrl ? (
                <div>
                  <img
                    src={resizedImageUrl}
                    alt="リサイズ後"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      objectFit: "contain",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                  <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
                    <p><strong>推定ファイルサイズ:</strong> {formatFileSize(getEstimatedSize())}</p>
                    <button
                      onClick={handleDownload}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginTop: "0.5rem",
                        width: isMobile ? "100%" : "auto",
                      }}
                    >
                      {isIOS() ? "写真に保存" : "ダウンロード"}
                    </button>
                    {isIOS() && (
                      <div style={{ 
                        marginTop: "1rem",
                        padding: "1rem",
                        backgroundColor: "#e3f2fd",
                        borderRadius: "8px",
                        border: "1px solid #bbdefb"
                      }}>
                        <h4 style={{ 
                          margin: "0 0 0.5rem 0", 
                          fontSize: "0.9rem", 
                          color: "#1976d2" 
                        }}>
                          📱 iPhoneで写真に保存する手順
                        </h4>
                        <div style={{ fontSize: "0.8rem", color: "#333" }}>
                          <div style={{ 
                            margin: "0.5rem 0", 
                            padding: "0.5rem", 
                            backgroundColor: "white", 
                            borderRadius: "4px" 
                          }}>
                            <strong>1.</strong> 上の「写真に保存」ボタンをタップ
                          </div>
                          <div style={{ 
                            margin: "0.5rem 0", 
                            padding: "0.5rem", 
                            backgroundColor: "white", 
                            borderRadius: "4px" 
                          }}>
                            <strong>2.</strong> 新しいタブで画像が表示されます
                          </div>
                          <div style={{ 
                            margin: "0.5rem 0", 
                            padding: "0.5rem", 
                            backgroundColor: "white", 
                            borderRadius: "4px" 
                          }}>
                            <strong>3.</strong> 画像を長押しします
                          </div>
                          <div style={{ 
                            margin: "0.5rem 0", 
                            padding: "0.5rem", 
                            backgroundColor: "white", 
                            borderRadius: "4px" 
                          }}>
                            <strong>4.</strong> 「"写真"に保存」をタップ
                          </div>
                          <div style={{ 
                            margin: "0.5rem 0", 
                            padding: "0.5rem", 
                            backgroundColor: "#c8e6c9", 
                            borderRadius: "4px" 
                          }}>
                            <strong>✅</strong> 写真アプリに保存完了！
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#666", padding: "2rem" }}>
                  リサイズを実行すると、ここにプレビューが表示されます
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default ImageResizer;