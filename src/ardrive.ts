import { TurboFactory, ArweaveSigner } from '@ardrive/turbo-sdk/web'

export interface ArdriveConfig {
  privateKey?: string
  walletFile?: File
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  url: string
}

export class ArdriveClient {
  private turbo: any
  private signer: ArweaveSigner | null = null
  private uploadedFiles: UploadedFile[] = []

  constructor() {
    this.turbo = null
    this.loadUploadedFiles()
  }

  async initialize(config: ArdriveConfig) {
    try {
      if (config.privateKey) {
        this.signer = new ArweaveSigner(Buffer.from(config.privateKey, 'base64'))
        this.turbo = TurboFactory.authenticated({
          privateKey: config.privateKey,
        })
      } else if (config.walletFile) {
        const walletData = await config.walletFile.text()
        const wallet = JSON.parse(walletData)
        this.signer = new ArweaveSigner(wallet)
        this.turbo = TurboFactory.authenticated({
          privateKey: wallet,
        })
      }
      return true
    } catch (error) {
      console.error('Failed to initialize Ardrive client:', error)
      return false
    }
  }

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string | null> {
    try {
      if (!this.turbo || !this.signer) {
        throw new Error('Ardrive client not initialized')
      }

      const fileBuffer = await file.arrayBuffer()
      
      const uploadResult = await this.turbo.uploadFile({
        fileStreamFactory: () => new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(fileBuffer))
            controller.close()
          }
        }),
        fileSizeFactory: () => file.size,
        signal: new AbortController().signal,
        dataItemOpts: {
          tags: [
            { name: 'Content-Type', value: this.getFileType(file.name, file.type) },
            { name: 'File-Name', value: file.name },
          ],
        },
      })

      // Store uploaded file info
      const detectedType = this.getFileType(file.name, file.type)

      const uploadedFile: UploadedFile = {
        id: uploadResult.id,
        name: file.name,
        type: detectedType,
        size: file.size,
        uploadDate: new Date(),
        url: `https://arweave.net/${uploadResult.id}`
      }
      
      this.uploadedFiles.push(uploadedFile)
      this.saveUploadedFiles()

      return uploadResult.id
    } catch (error) {
      console.error('Upload failed:', error)
      return null
    }
  }

  private getFileType(fileName: string, mimeType: string): string {
        if (mimeType && mimeType !== 'application/octet-stream') {
          return mimeType
        }
        
    const extension = fileName.toLowerCase().split('.').pop()
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
        return 'application/octet-stream'
    }
  }

  async getBalance(): Promise<string> {
    try {
      if (!this.turbo) {
        return '0'
      }
      const balance = await this.turbo.getBalance()
      return balance.winc
    } catch (error) {
      console.error('Failed to get balance:', error)
      return '0'
    }
  }

  async getUploadCost(fileSize: number): Promise<string> {
    try {
      if (!this.turbo) {
        return '0'
      }
      const cost = await this.turbo.getUploadCosts({
        bytes: [fileSize],
      })
      return cost.winc
    } catch (error) {
      console.error('Failed to get upload cost:', error)
      return '0'
    }
  }

  getUploadedFiles(): UploadedFile[] {
    return [...this.uploadedFiles]
  }

  private saveUploadedFiles() {
    try {
      localStorage.setItem('ardrive_uploaded_files', JSON.stringify(this.uploadedFiles))
    } catch (error) {
      console.error('Failed to save uploaded files:', error)
    }
  }

  private loadUploadedFiles() {
    try {
      const saved = localStorage.getItem('ardrive_uploaded_files')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.uploadedFiles = parsed.map((file: any) => ({
          ...file,
          uploadDate: new Date(file.uploadDate)
        }))
      }
    } catch (error) {
      console.error('Failed to load uploaded files:', error)
      this.uploadedFiles = []
    }
  }

  deleteUploadedFile(id: string) {
    this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== id)
    this.saveUploadedFiles()
  }
}