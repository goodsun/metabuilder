import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ArdriveClient } from './ardrive'

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  url: string
}

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  success: string | null
  txId: string | null
}

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [showFileList, setShowFileList] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: null,
    txId: null,
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const walletInputRef = useRef<HTMLInputElement>(null)
  const ardriveClient = useRef<ArdriveClient>(new ArdriveClient())

  const handleWalletUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const success = await ardriveClient.current.initialize({ walletFile: file })
      if (success) {
        setIsInitialized(true)
        const walletBalance = await ardriveClient.current.getBalance()
        setBalance(walletBalance)
        setUploadState(prev => ({ ...prev, success: 'ウォレットが正常に読み込まれました', error: null }))
      } else {
        setUploadState(prev => ({ ...prev, error: 'ウォレットの初期化に失敗しました', success: null }))
      }
    } catch (error) {
      setUploadState(prev => ({ ...prev, error: `ウォレットエラー: ${error}`, success: null }))
    }
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file)
    setUploadState(prev => ({ ...prev, error: null, success: null, txId: null }))
  }, [])

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !isInitialized) return

    setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, error: null, success: null, txId: null }))

    try {
      const txId = await ardriveClient.current.uploadFile(selectedFile, (progress) => {
        setUploadState(prev => ({ ...prev, progress: Math.round(progress) }))
      })

      if (txId) {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          progress: 100,
          success: 'ファイルのアップロードが完了しました！',
          txId,
        }))
        const newBalance = await ardriveClient.current.getBalance()
        setBalance(newBalance)
        setUploadedFiles(ardriveClient.current.getUploadedFiles())
      } else {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          error: 'アップロードに失敗しました',
        }))
      }
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: `アップロードエラー: ${error}`,
      }))
    }
  }, [selectedFile, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      setUploadedFiles(ardriveClient.current.getUploadedFiles())
    }
  }, [isInitialized])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDeleteFile = useCallback((id: string) => {
    ardriveClient.current.deleteUploadedFile(id)
    setUploadedFiles(ardriveClient.current.getUploadedFiles())
  }, [])

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP')
  }

  const getDisplayFileType = (file: File): string => {
    if (file.type && file.type !== 'application/octet-stream') {
      return file.type
    }
    
    const extension = file.name.toLowerCase().split('.').pop()
    switch (extension) {
      case 'glb':
      case 'gltf':
        return 'model/gltf-binary'
      case 'obj':
        return 'model/obj'
      case 'fbx':
        return 'model/fbx'
      case 'dae':
        return 'model/collada+xml'
      case 'png':
        return 'image/png'
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'gif':
        return 'image/gif'
      case 'webp':
        return 'image/webp'
      case 'mp4':
        return 'video/mp4'
      case 'webm':
        return 'video/webm'
      case 'mp3':
        return 'audio/mpeg'
      case 'wav':
        return 'audio/wav'
      case 'pdf':
        return 'application/pdf'
      case 'json':
        return 'application/json'
      case 'txt':
        return 'text/plain'
      default:
        return file.type || '不明'
    }
  }

  return (
    <div className="container">
      <h1>ArDrive ファイルアップロード</h1>
      
      {!isInitialized ? (
        <div>
          <h2>ウォレットを読み込む</h2>
          <p>Arweaveウォレット（JSON形式）をアップロードしてください：</p>
          <input
            ref={walletInputRef}
            type="file"
            accept=".json"
            onChange={handleWalletUpload}
            style={{ margin: '1rem 0' }}
          />
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h3>ウォレット情報</h3>
            <p>残高: {balance} winston</p>
            <button
              onClick={() => setShowFileList(!showFileList)}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
            >
              {showFileList ? 'ファイル一覧を隠す' : `アップロード済みファイル一覧 (${uploadedFiles.length}件)`}
            </button>
          </div>

          {showFileList && (
            <div style={{ marginBottom: '2rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
              <h3>アップロード済みファイル</h3>
              {uploadedFiles.length === 0 ? (
                <p>アップロード済みファイルはありません</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {uploadedFiles.map((file) => (
                    <div key={file.id} style={{ 
                      border: '1px solid #eee', 
                      padding: '1rem', 
                      marginBottom: '0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <p><strong>ファイル名:</strong> {file.name}</p>
                          <p><strong>サイズ:</strong> {formatFileSize(file.size)}</p>
                          <p><strong>タイプ:</strong> {file.type}</p>
                          <p><strong>アップロード日時:</strong> {formatDate(file.uploadDate)}</p>
                          <p><strong>ID:</strong> <code>{file.id}</code></p>
                          <p>
                            <strong>URL:</strong>{' '}
                            <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>
                              {file.url}
                            </a>
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          style={{ 
                            backgroundColor: '#ff4444', 
                            color: 'white', 
                            border: 'none', 
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
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
            className={`upload-area ${uploadState.isUploading ? '' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            
            {selectedFile ? (
              <div className="file-info">
                <h3>選択されたファイル</h3>
                <p><strong>名前:</strong> {selectedFile.name}</p>
                <p><strong>サイズ:</strong> {formatFileSize(selectedFile.size)}</p>
                <p><strong>タイプ:</strong> {getDisplayFileType(selectedFile)}</p>
              </div>
            ) : (
              <div>
                <p>ファイルをドラッグ&ドロップするか、クリックして選択してください</p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
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

      {uploadState.error && (
        <div className="error">{uploadState.error}</div>
      )}

      {uploadState.success && (
        <div className="success">
          {uploadState.success}
          {uploadState.txId && (
            <div style={{ marginTop: '0.5rem' }}>
              <strong>トランザクションID:</strong> {uploadState.txId}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App