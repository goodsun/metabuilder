import { TurboFactory, ArweaveSigner } from '@ardrive/turbo-sdk'

export interface ArdriveConfig {
  privateKey?: string
  walletFile?: File
}

export class ArdriveClient {
  private turbo: any
  private signer: ArweaveSigner | null = null

  constructor() {
    this.turbo = null
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
      const dataItem = await this.turbo.uploadFile({
        fileStreamFactory: () => new Uint8Array(fileBuffer),
        fileSizeFactory: () => file.size,
        signal: new AbortController().signal,
        dataItemOpts: {
          tags: [
            { name: 'Content-Type', value: file.type },
            { name: 'File-Name', value: file.name },
          ],
        },
      })

      return dataItem.id
    } catch (error) {
      console.error('Upload failed:', error)
      return null
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
}