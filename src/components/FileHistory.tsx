import React, { useState, useEffect } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        "auto-rotate"?: string;
        "camera-controls"?: string;
        "shadow-intensity"?: string;
        "environment-image"?: string;
        exposure?: string;
        "shadow-softness"?: string;
        onError?: () => void;
      };
    }
  }
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  url: string;
}

const FileHistory: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    loadFilesFromStorage();

    // localStorageの変更を監視
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'uploadedFiles') {
        console.log('Storage updated, reloading files...');
        loadFilesFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 同じウィンドウ内での変更も監視するために、定期的にチェック
    // 前回の値と比較して変更があった場合のみ更新
    let lastStorageValue = localStorage.getItem("uploadedFiles");
    const intervalId = setInterval(() => {
      const currentStorageValue = localStorage.getItem("uploadedFiles");
      if (currentStorageValue !== lastStorageValue) {
        lastStorageValue = currentStorageValue;
        loadFilesFromStorage();
      }
    }, 2000); // 2秒ごとにチェック

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadFilesFromStorage = () => {
    const savedFiles = localStorage.getItem("uploadedFiles");
    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        const filesWithDates = parsedFiles.map((file: any) => ({
          ...file,
          uploadDate: new Date(file.uploadDate),
        }));

        // 前回と同じデータの場合は更新しない（不要な再レンダリングを防ぐ）
        setUploadedFiles((prevFiles) => {
          if (JSON.stringify(prevFiles) === JSON.stringify(filesWithDates)) {
            return prevFiles;
          }
          return filesWithDates;
        });
      } catch (error) {
        console.error("Failed to load files from storage:", error);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return (
      date.toLocaleDateString("ja-JP") + " " + date.toLocaleTimeString("ja-JP")
    );
  };

  const handleDeleteFile = (id: string) => {
    const updatedFiles = uploadedFiles.filter((file) => file.id !== id);
    setUploadedFiles(updatedFiles);
    localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        "すべてのファイル履歴を削除しますか？この操作は元に戻せません。"
      )
    ) {
      setUploadedFiles([]);
      localStorage.removeItem("uploadedFiles");
    }
  };

  const filteredFiles = uploadedFiles.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "date":
        comparison = a.uploadDate.getTime() - b.uploadDate.getTime();
        break;
      case "size":
        comparison = a.size - b.size;
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "IMG";
    if (type.startsWith("video/")) return "VID";
    if (type.startsWith("audio/")) return "AUD";
    if (type.includes("pdf")) return "PDF";
    if (type.includes("json")) return "JSON";
    if (
      type.includes("model/") ||
      type.includes("gltf") ||
      type.includes("glb")
    )
      return "3D";
    return "FILE";
  };

  const isImageFile = (type: string) => {
    return type.startsWith("image/");
  };

  const is3DFile = (type: string) => {
    return (
      type.includes("model/") ||
      type.includes("gltf") ||
      type.includes("glb") ||
      type.includes("application/octet-stream")
    );
  };

  useEffect(() => {
    if (!customElements.get("model-viewer")) {
      const script = document.createElement("script");
      script.type = "module";
      script.src =
        "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      document.head.appendChild(script);
    }
  }, []);

  const FileIconOrThumbnail: React.FC<{ file: UploadedFile }> = ({ file }) => {
    const [jsonImageUrl, setJsonImageUrl] = useState<string | null>(null);
    const [isLoadingJson, setIsLoadingJson] = useState(false);

    useEffect(() => {
      if (file.type === "application/json") {
        setIsLoadingJson(true);
        fetch(file.url)
          .then(response => response.json())
          .then(data => {
            if (data.image && typeof data.image === "string") {
              setJsonImageUrl(data.image);
            }
          })
          .catch(error => {
            console.error("Failed to load JSON content:", error);
          })
          .finally(() => {
            setIsLoadingJson(false);
          });
      }
    }, [file.url, file.type]);

    if (isImageFile(file.type) || (file.type === "application/json" && jsonImageUrl)) {
      return (
        <div
          style={{
            width: "100px",
            height: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            overflow: "hidden",
            marginRight: "0.5rem",
            flexShrink: 0,
          }}
        >
          <img
            src={jsonImageUrl || file.url}
            alt={file.name}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "cover",
              borderRadius: "4px",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.5); font-size: 0.75rem; letter-spacing: 0.1em;">
                  ${getFileIcon(file.type)}
                </div>
              `;
            }}
          />
        </div>
      );
    }

    if (is3DFile(file.type)) {
      return (
        <div
          style={{
            width: "100px",
            height: "100px",
            backgroundColor: "#000",
            borderRadius: "8px",
            overflow: "hidden",
            marginRight: "0.5rem",
            flexShrink: 0,
          }}
        >
          <model-viewer
            src={file.url}
            alt={file.name}
            auto-rotate="true"
            camera-controls="true"
            shadow-intensity="0.7"
            environment-image="neutral"
            exposure="0.6"
            shadow-softness="0.25"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#000000",
            }}
            onError={() => {
              console.error(`Failed to load 3D model: ${file.url}`);
            }}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          width: "100px",
          height: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderRadius: "8px",
          marginRight: "0.5rem",
          flexShrink: 0,
          fontSize: "0.75rem",
          color: "rgba(255, 255, 255, 0.5)",
          letterSpacing: "0.1em",
        }}
      >
        {isLoadingJson && file.type === "application/json" ? (
          <div style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.8rem" }}>Loading...</div>
        ) : (
          getFileIcon(file.type)
        )}
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "1rem" : "2rem"
    }}>
      <h1 style={{ fontSize: isMobile ? "1.5rem" : "2rem" }}>Material Vault</h1>
      <div
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "8px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: isMobile ? "stretch" : "center",
        }}
      >
        <div style={{ flex: "1", minWidth: "200px" }}>
          <input
            type="text"
            placeholder="ファイル名やタイプで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "4px",
              color: "#f6f6f6",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "name" | "date" | "size")
            }
            style={{
              padding: "0.5rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "4px",
              color: "#f6f6f6",
            }}
          >
            <option value="date" style={{ background: "#1c1e22" }}>日付順</option>
            <option value="name" style={{ background: "#1c1e22" }}>名前順</option>
            <option value="size" style={{ background: "#1c1e22" }}>サイズ順</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              color: "#f6f6f6",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "6px",
              cursor: "pointer",
              letterSpacing: "0.05em",
              transition: "all 0.2s ease",
            }}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleClearHistory}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "rgba(255, 0, 0, 0.1)",
              color: "#ff6666",
              border: "1px solid rgba(255, 0, 0, 0.3)",
              borderRadius: "6px",
              cursor: "pointer",
              letterSpacing: "0.05em",
              transition: "all 0.2s ease",
            }}
          >
            一括削除
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "1rem", color: "rgba(255, 255, 255, 0.5)" }}>
        {sortedFiles.length > 0
          ? `${sortedFiles.length}件のファイル${
              filteredFiles.length !== uploadedFiles.length
                ? ` (${uploadedFiles.length}件中)`
                : ""
            }`
          : "ファイルが見つかりません"}
      </div>

      {sortedFiles.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          {searchTerm
            ? "検索条件に一致するファイルが見つかりません"
            : "ファイルが見つかりません"}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          {sortedFiles.map((file) => (
            <div
              key={file.id}
              style={{
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: "0.75rem",
                }}
              >
                <FileIconOrThumbnail file={file} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      margin: "0 0 0.25rem 0",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      wordBreak: "break-word",
                    }}
                  >
                    {file.name}
                  </h3>
                  <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.5)" }}>
                    <b>size</b>: {formatFileSize(file.size)} <b>mime</b>:{" "}
                    {file.type} <b>date</b>: {formatDate(file.uploadDate)}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "0.75rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(file.url);
                        alert("URLをクリップボードにコピーしました");
                      }}
                      style={{
                        backgroundColor: "rgba(100, 180, 255, 0.1)",
                        color: "#6bb6ff",
                        border: "1px solid rgba(100, 180, 255, 0.3)",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        transition: "all 0.2s ease",
                      }}
                    >
                      URLコピー
                    </button>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: "rgba(0, 255, 100, 0.1)",
                        color: "#66ff99",
                        textDecoration: "none",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        border: "1px solid rgba(0, 255, 100, 0.3)",
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        transition: "all 0.2s ease",
                      }}
                    >
                      開く
                    </a>
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  marginTop: "0.75rem",
                }}
              >
                {file.url}
              </div>

              <button
                onClick={() => handleDeleteFile(file.id)}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  backgroundColor: "rgba(255, 0, 0, 0.1)",
                  color: "#ff6666",
                  border: "1px solid rgba(255, 0, 0, 0.3)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  zIndex: 1,
                  transition: "all 0.2s ease",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileHistory;
