import React, { useState, useEffect } from "react";
import "./MetadataCreator.css";

interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  background_color?: string;
  youtube_url?: string;
  attributes: NFTAttribute[];
}

const METADATA_STORAGE_KEY = "metadataCreator_draft";

const MetadataCreator: React.FC = () => {
  // localStorageから初期データを取得
  const getInitialMetadata = (): NFTMetadata => {
    try {
      const saved = localStorage.getItem(METADATA_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // データの整合性確認
        if (parsed && typeof parsed === "object" && "name" in parsed) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load saved metadata:", error);
    }
    return {
      name: "",
      description: "",
      image: "",
      attributes: [],
    };
  };

  const [metadata, setMetadata] = useState<NFTMetadata>(getInitialMetadata());

  const [newAttribute, setNewAttribute] = useState({
    trait_type: "",
    value: "",
  });

  // const [showPreview, setShowPreview] = useState(false);
  const [animationMimeType, setAnimationMimeType] = useState<string | null>(
    null
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<NFTAttribute>({
    trait_type: "",
    value: "",
  });
  const [attributeMimeTypes, setAttributeMimeTypes] = useState<
    Record<number, string | null>
  >({});

  const checkMimeType = async (url: string) => {
    if (!url) return null;

    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");
      return contentType;
    } catch (error) {
      console.error("Failed to check MIME type:", error);
      return null;
    }
  };

  const isGLBFile = (mimeType: string | null) => {
    if (!mimeType) return false;
    return (
      mimeType.includes("model/gltf-binary") ||
      mimeType.includes("application/octet-stream") ||
      mimeType.includes("model/gltf+json")
    );
  };

  const isURL = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const isImageFile = (mimeType: string | null) => {
    if (!mimeType) return false;
    return mimeType.startsWith("image/");
  };

  const is3DFile = (mimeType: string | null) => {
    if (!mimeType) return false;
    return (
      mimeType.includes("model/") ||
      mimeType.includes("gltf") ||
      mimeType.includes("glb")
    );
  };

  // メタデータが変更されたらlocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error("Failed to save metadata:", error);
    }
  }, [metadata]);

  // 他のタブ/ウィンドウでのlocalStorage変更を監視
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === METADATA_STORAGE_KEY && e.newValue) {
        try {
          const newMetadata = JSON.parse(e.newValue);
          // データの整合性確認
          if (newMetadata && typeof newMetadata === "object" && "name" in newMetadata) {
            setMetadata(newMetadata);
            // 属性のMIMEタイプを再チェック
            setAttributeMimeTypes({});
          }
        } catch (error) {
          console.error("Failed to parse storage change:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (metadata.animation_url) {
      checkMimeType(metadata.animation_url).then(setAnimationMimeType);
    } else {
      setAnimationMimeType(null);
    }
  }, [metadata.animation_url]);

  useEffect(() => {
    const checkAttributeMimeTypes = async () => {
      const mimeTypes: Record<number, string | null> = {};

      for (let i = 0; i < metadata.attributes.length; i++) {
        const attr = metadata.attributes[i];
        if (isURL(attr.value)) {
          mimeTypes[i] = await checkMimeType(attr.value);
        } else {
          mimeTypes[i] = null;
        }
      }

      setAttributeMimeTypes(mimeTypes);
    };

    checkAttributeMimeTypes();
  }, [metadata.attributes]);

  const addAttribute = () => {
    if (newAttribute.trait_type && newAttribute.value) {
      setMetadata((prev) => ({
        ...prev,
        attributes: [
          ...prev.attributes,
          {
            trait_type: newAttribute.trait_type,
            value: newAttribute.value,
          },
        ],
      }));
      setNewAttribute({ trait_type: "", value: "" });
    }
  };

  const removeAttribute = (index: number) => {
    setMetadata((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingAttribute(metadata.attributes[index]);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingAttribute({ trait_type: "", value: "" });
  };

  const saveEditing = () => {
    if (
      editingIndex !== null &&
      editingAttribute.trait_type &&
      editingAttribute.value
    ) {
      setMetadata((prev) => ({
        ...prev,
        attributes: prev.attributes.map((attr, index) =>
          index === editingIndex ? editingAttribute : attr
        ),
      }));
      cancelEditing();
    }
  };

  const moveAttribute = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= metadata.attributes.length) return;

    setMetadata((prev) => {
      const newAttributes = [...prev.attributes];
      [newAttributes[index], newAttributes[newIndex]] = [
        newAttributes[newIndex],
        newAttributes[index],
      ];
      return { ...prev, attributes: newAttributes };
    });
  };

  const generateJSON = () => {
    const cleanMetadata = Object.fromEntries(
      Object.entries(metadata).filter(
        ([_, value]) =>
          value !== "" &&
          value !== undefined &&
          (Array.isArray(value) ? value.length > 0 : true)
      )
    );
    return JSON.stringify(cleanMetadata, null, 2);
  };

  const downloadJSON = () => {
    const json = generateJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${metadata.name || "metadata"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateJSON());
    alert("JSONをクリップボードにコピーしました");
  };

  const loadFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        setMetadata({
          name: jsonData.name || "",
          description: jsonData.description || "",
          image: jsonData.image || "",
          animation_url: jsonData.animation_url || "",
          external_url: jsonData.external_url || "",
          background_color: jsonData.background_color || "",
          youtube_url: jsonData.youtube_url || "",
          attributes: Array.isArray(jsonData.attributes)
            ? jsonData.attributes
            : [],
        });

        alert("JSONファイルを読み込みました");
      } catch (error) {
        alert(
          "JSONファイルの読み込みに失敗しました。正しい形式のJSONファイルを選択してください。"
        );
      }
    };
    reader.readAsText(file);
  };

  // const openPreview = () => {
  //   setShowPreview(true);
  // };

  // const closePreview = () => {
  //   setShowPreview(false);
  // };

  const GLBViewer: React.FC<{ url: string }> = ({ url }) => {
    useEffect(() => {
      if (!customElements.get("model-viewer")) {
        const script = document.createElement("script");
        script.type = "module";
        script.src =
          "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
        document.head.appendChild(script);
      }
    }, []);

    return (
      <div className="glb-viewer">
        <model-viewer
          src={url}
          alt="3D Model"
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
        />
      </div>
    );
  };

  const AttributePreview: React.FC<{
    value: string;
    mimeType: string | null;
  }> = ({ value, mimeType }) => {
    if (!isURL(value) || !mimeType) return null;

    if (isImageFile(mimeType)) {
      return (
        <div style={{ marginTop: "5px" }}>
          <img
            src={value}
            alt="Preview"
            style={{
              maxWidth: "100px",
              maxHeight: "100px",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      );
    }

    if (is3DFile(mimeType)) {
      return (
        <div style={{ marginTop: "5px", width: "100px", height: "100px" }}>
          <model-viewer
            src={value}
            alt="3D Preview"
            auto-rotate="true"
            camera-controls="true"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#111318",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          />
        </div>
      );
    }

    return null;
  };

  // PreviewModal removed - preview is now inline

  return (
    <div className="metadata-container">
      <h1>Metadata Builder</h1>

      <div className="form-group">
        <label>JSONファイルを読み込み</label>
        <input
          type="file"
          accept=".json"
          onChange={loadFromJSON}
          style={{ marginBottom: "10px" }}
        />
      </div>

      <div className="form-group">
        <label>
          名前 <span className="required">*</span>
        </label>
        <input
          type="text"
          value={metadata.name}
          onChange={(e) =>
            setMetadata((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="NFTの名前"
        />
      </div>

      <div className="form-group">
        <label>
          説明 <span className="required">*</span>
        </label>
        <textarea
          value={metadata.description}
          onChange={(e) =>
            setMetadata((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="NFTの説明"
        />
      </div>

      <div className="form-group">
        <label>
          画像URL <span className="required">*</span>
        </label>
        <input
          type="url"
          value={metadata.image}
          onChange={(e) =>
            setMetadata((prev) => ({ ...prev, image: e.target.value }))
          }
          placeholder="https://example.com/image.png"
        />
      </div>

      <div className="form-group">
        <label>アニメーションURL</label>
        <input
          type="url"
          value={metadata.animation_url || ""}
          onChange={(e) =>
            setMetadata((prev) => ({ ...prev, animation_url: e.target.value }))
          }
          placeholder="https://example.com/animation.mp4"
        />
      </div>

      <div className="form-group">
        <label>外部URL</label>
        <input
          type="url"
          value={metadata.external_url || ""}
          onChange={(e) =>
            setMetadata((prev) => ({ ...prev, external_url: e.target.value }))
          }
          placeholder="https://example.com"
        />
      </div>

      <div className="form-group">
        <label>YouTube URL</label>
        <input
          type="url"
          value={metadata.youtube_url || ""}
          onChange={(e) =>
            setMetadata((prev) => ({ ...prev, youtube_url: e.target.value }))
          }
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>

      <h3>属性 (Attributes)</h3>

      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="特性名"
          value={newAttribute.trait_type}
          onChange={(e) =>
            setNewAttribute((prev) => ({ ...prev, trait_type: e.target.value }))
          }
          style={{ flex: 1 }}
        />
        <input
          type="text"
          placeholder="値"
          value={newAttribute.value}
          onChange={(e) =>
            setNewAttribute((prev) => ({ ...prev, value: e.target.value }))
          }
          style={{ flex: 1 }}
        />
        <button type="button" onClick={addAttribute} className="btn">
          追加
        </button>
      </div>

      {metadata.attributes.map((attr, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "10px",
            alignItems: "center",
            padding: "10px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "8px",
            backgroundColor: editingIndex === index ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
          }}
        >
          {editingIndex === index ? (
            <>
              <input
                type="text"
                value={editingAttribute.trait_type}
                onChange={(e) =>
                  setEditingAttribute((prev) => ({
                    ...prev,
                    trait_type: e.target.value,
                  }))
                }
                placeholder="特性名"
                style={{ flex: 1 }}
              />
              <input
                type="text"
                value={editingAttribute.value}
                onChange={(e) =>
                  setEditingAttribute((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                placeholder="値"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={saveEditing}
                className="btn"
                style={{ backgroundColor: "rgba(0, 255, 100, 0.1)", color: "#66ff99", borderColor: "rgba(0, 255, 100, 0.3)" }}
              >
                保存
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
            </>
          ) : (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  {attr.trait_type}
                </div>
                <div style={{ marginBottom: "5px" }}>{attr.value}</div>
                <AttributePreview
                  value={attr.value}
                  mimeType={attributeMimeTypes[index]}
                />
              </div>
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  type="button"
                  onClick={() => moveAttribute(index, "up")}
                  disabled={index === 0}
                  className="btn btn-secondary"
                  style={{
                    fontSize: "12px",
                    padding: "5px 8px",
                    opacity: index === 0 ? 0.5 : 1,
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveAttribute(index, "down")}
                  disabled={index === metadata.attributes.length - 1}
                  className="btn btn-secondary"
                  style={{
                    fontSize: "12px",
                    padding: "5px 8px",
                    opacity: index === metadata.attributes.length - 1 ? 0.5 : 1,
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => startEditing(index)}
                  className="btn"
                  style={{
                    fontSize: "12px",
                    padding: "5px 10px",
                    backgroundColor: "rgba(100, 180, 255, 0.1)",
                    color: "#6bb6ff",
                    borderColor: "rgba(100, 180, 255, 0.3)",
                  }}
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="btn btn-secondary"
                  style={{
                    fontSize: "12px",
                    padding: "5px 10px",
                    backgroundColor: "rgba(255, 0, 0, 0.1)",
                    color: "#ff6666",
                    borderColor: "rgba(255, 0, 0, 0.3)",
                  }}
                >
                  削除
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      <div style={{ marginTop: "30px" }}>
        <button onClick={copyToClipboard} className="btn">
          JSONをコピー
        </button>
        <button onClick={downloadJSON} className="btn btn-secondary">
          JSONをダウンロード
        </button>
        <button 
          onClick={() => {
            if (window.confirm("編集中のデータをクリアしますか？")) {
              const emptyMetadata = {
                name: "",
                description: "",
                image: "",
                attributes: [],
              };
              setMetadata(emptyMetadata);
              setNewAttribute({ trait_type: "", value: "" });
              localStorage.removeItem(METADATA_STORAGE_KEY);
            }
          }} 
          className="btn" 
          style={{ backgroundColor: "rgba(255, 0, 0, 0.1)", color: "#ff6666", borderColor: "rgba(255, 0, 0, 0.3)", marginLeft: "10px" }}
        >
          データをクリア
        </button>
      </div>

      <div className="output">
        <h3>プレビュー:</h3>
        <div
          className="nft-preview"
          style={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {metadata.image && (
            <img
              src={metadata.image}
              alt={metadata.name || "NFT Preview"}
              style={{
                maxWidth: "400px",
                maxHeight: "400px",
                borderRadius: "8px",
                marginBottom: "15px",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}

          {isGLBFile(animationMimeType) && (
            <div
              style={{
                width: "400px",
                height: "400px",
                margin: "0 auto 15px",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <GLBViewer url={metadata.animation_url!} />
            </div>
          )}

          <div
            className="nft-title"
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "8px",
              color: "#f6f6f6",
            }}
          >
            {metadata.name || "Untitled NFT"}
          </div>

          <div
            className="nft-description"
            style={{
              color: "#d0d0d0",
              marginBottom: "15px",
              fontSize: "14px",
              lineHeight: "1.4",
            }}
          >
            {metadata.description || "No description available"}
          </div>

          {metadata.attributes.length > 0 && (
            <div>
              <h4
                style={{
                  marginBottom: "10px",
                  fontSize: "14px",
                  color: "#f6f6f6",
                }}
              >
                Attributes
              </h4>
              <div
                className="attributes-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "12px",
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                {metadata.attributes.map((attr, index) => (
                  <div
                    key={index}
                    className="attribute-card"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      padding: "12px",
                      borderRadius: "8px",
                      textAlign: "center",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "14px",
                    }}
                  >
                    <div
                      className="attribute-type"
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.5)",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      {attr.trait_type}
                    </div>
                    <div
                      className="attribute-value"
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#f6f6f6",
                        marginBottom: "6px",
                      }}
                    >
                      {attr.value}
                    </div>
                    <AttributePreview
                      value={attr.value}
                      mimeType={attributeMimeTypes[index]}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetadataCreator;
