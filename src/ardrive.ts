import { TurboFactory, ArweaveSigner } from "@ardrive/turbo-sdk/web";
import Arweave from "arweave";

export interface ArdriveConfig {
  privateKey?: string;
  walletFile?: File;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  url: string;
}

interface ArweaveTransaction {
  id: string;
  tags: Array<{ name: string; value: string }>;
  block?: { timestamp: number };
  data?: { size: number };
}

interface ArweaveGraphQLResponse {
  data: {
    transactions: {
      edges: Array<{ node: ArweaveTransaction }>;
    };
  };
  errors?: any[];
}

export class ArdriveClient {
  private turbo: any;
  private signer: ArweaveSigner | null = null;
  private uploadedFiles: UploadedFile[] = [];
  private walletAddress: string | null = null;
  private arweave: Arweave;
  private walletJWK: any = null;

  constructor() {
    this.turbo = null;
    this.arweave = Arweave.init({
      host: "arweave.net",
      port: 443,
      protocol: "https",
    });
    this.loadUploadedFiles();
  }

  async initialize(config: ArdriveConfig) {
    try {
      if (config.privateKey) {
        console.log("Initializing with private key...");
        const privateKeyBuffer = Buffer.from(config.privateKey, "base64");
        this.walletJWK = JSON.parse(privateKeyBuffer.toString());
        this.signer = new ArweaveSigner(this.walletJWK);
        this.turbo = TurboFactory.authenticated({
          privateKey: this.walletJWK,
        });
      } else if (config.walletFile) {
        console.log("Initializing with wallet file...");
        const walletData = await config.walletFile.text();
        const wallet = JSON.parse(walletData);
        this.walletJWK = wallet;
        this.signer = new ArweaveSigner(wallet);
        this.turbo = TurboFactory.authenticated({
          privateKey: wallet,
        });
      } else {
        throw new Error("No private key or wallet file provided");
      }

      // Get wallet address
      if (this.walletJWK) {
        console.log("Getting wallet address...");
        this.walletAddress = await this.arweave.wallets.jwkToAddress(
          this.walletJWK
        );
        console.log("Wallet address:", this.walletAddress);

        // Try to sync upload history (non-blocking)
        try {
          console.log("Syncing upload history...");
          await this.syncUploadHistory();
          console.log("Upload history synced successfully");
        } catch (historyError) {
          console.warn(
            "Failed to sync upload history (non-critical):",
            historyError
          );
          // Don't fail initialization if history sync fails
        }
      }

      console.log("ArDrive client initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Ardrive client:", error);
      return false;
    }
  }

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string | null> {
    try {
      if (!this.turbo || !this.signer) {
        throw new Error("Ardrive client not initialized");
      }

      const fileBuffer = await file.arrayBuffer();

      const uploadResult = await this.turbo.uploadFile({
        fileStreamFactory: () =>
          new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(fileBuffer));
              controller.close();
            },
          }),
        fileSizeFactory: () => file.size,
        signal: new AbortController().signal,
        dataItemOpts: {
          tags: [
            {
              name: "Content-Type",
              value: this.getFileType(file.name, file.type),
            },
            { name: "File-Name", value: file.name },
          ],
        },
      });

      // Store uploaded file info
      const detectedType = this.getFileType(file.name, file.type);

      const uploadedFile: UploadedFile = {
        id: uploadResult.id,
        name: file.name,
        type: detectedType,
        size: file.size,
        uploadDate: new Date(),
        url: `https://arweave.net/${uploadResult.id}`,
      };

      this.uploadedFiles.push(uploadedFile);
      this.saveUploadedFiles();

      return uploadResult.id;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  }

  private getFileType(fileName: string, mimeType: string): string {
    if (mimeType && mimeType !== "application/octet-stream") {
      return mimeType;
    }

    const extension = fileName.toLowerCase().split(".").pop();
    switch (extension) {
      case "glb":
      case "gltf":
        return "model/gltf-binary";
      case "obj":
        return "model/obj";
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
        return "application/octet-stream";
    }
  }

  async getBalance(): Promise<string> {
    try {
      if (!this.turbo) {
        return "0";
      }
      const balance = await this.turbo.getBalance();
      return balance.winc;
    } catch (error) {
      console.error("Failed to get balance:", error);
      return "0";
    }
  }

  async getUploadCost(fileSize: number): Promise<string> {
    try {
      if (!this.turbo) {
        return "0";
      }
      const cost = await this.turbo.getUploadCosts({
        bytes: [fileSize],
      });
      return cost.winc;
    } catch (error) {
      console.error("Failed to get upload cost:", error);
      return "0";
    }
  }

  getUploadedFiles(): UploadedFile[] {
    return [...this.uploadedFiles];
  }

  async refreshUploadHistory(): Promise<void> {
    if (!this.walletAddress) {
      throw new Error("Wallet not initialized");
    }
    await this.syncUploadHistory();
  }

  private saveUploadedFiles() {
    try {
      localStorage.setItem(
        "ardrive_uploaded_files",
        JSON.stringify(this.uploadedFiles)
      );
    } catch (error) {
      console.error("Failed to save uploaded files:", error);
    }
  }

  private loadUploadedFiles() {
    try {
      const saved = localStorage.getItem("ardrive_uploaded_files");
      if (saved) {
        const parsed = JSON.parse(saved);
        this.uploadedFiles = parsed.map((file: any) => ({
          ...file,
          uploadDate: new Date(file.uploadDate),
        }));
      }
    } catch (error) {
      console.error("Failed to load uploaded files:", error);
      this.uploadedFiles = [];
    }
  }

  deleteUploadedFile(id: string) {
    this.uploadedFiles = this.uploadedFiles.filter((file) => file.id !== id);
    this.saveUploadedFiles();
  }

  async getUploadHistoryFromArweave(
    walletAddress: string
  ): Promise<UploadedFile[]> {
    try {
      const queryObject = {
        query: `{
          transactions(
            owners:["${walletAddress}"],
            first: 100
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
                block {
                  timestamp
                }
                data {
                  size
                }
              }
            }
          }
        }`,
      };

      const response = await fetch("https://arweave.net/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryObject),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status}`);
      }

      const data: ArweaveGraphQLResponse = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return this.convertArweaveDataToUploadedFiles(
        data.data.transactions.edges
      );
    } catch (error) {
      console.error("Failed to fetch upload history from Arweave:", error);
      throw error;
    }
  }

  private convertArweaveDataToUploadedFiles(
    edges: Array<{ node: ArweaveTransaction }>
  ): UploadedFile[] {
    const uploadedFiles: UploadedFile[] = [];

    for (const edge of edges) {
      const node = edge.node;
      const tags = node.tags || [];

      // Extract file information from tags
      const contentTypeTag = tags.find((tag) => tag.name === "Content-Type");
      const fileNameTag = tags.find((tag) => tag.name === "File-Name");

      // Skip transactions that don't have file metadata
      if (!contentTypeTag && !fileNameTag) {
        continue;
      }

      const fileName =
        fileNameTag?.value || `Unknown-${node.id.substring(0, 8)}`;
      const contentType = contentTypeTag?.value || "application/octet-stream";
      const size = node.data?.size || 0;
      const timestamp = node.block?.timestamp;

      // Convert timestamp to Date (Arweave timestamp is in seconds)
      const uploadDate = timestamp ? new Date(timestamp * 1000) : new Date();

      const uploadedFile: UploadedFile = {
        id: node.id,
        name: fileName,
        type: contentType,
        size: size,
        uploadDate: uploadDate,
        url: `https://arweave.net/${node.id}`,
      };

      uploadedFiles.push(uploadedFile);
    }

    return uploadedFiles;
  }

  private async syncUploadHistory(): Promise<void> {
    try {
      if (!this.walletAddress) {
        return;
      }

      const arweaveHistory = await this.getUploadHistoryFromArweave(
        this.walletAddress
      );
      const mergedHistory = this.mergeUploadHistories(
        this.uploadedFiles,
        arweaveHistory
      );

      this.uploadedFiles = mergedHistory;
      this.saveUploadedFiles();
    } catch (error) {
      console.error("Failed to sync upload history:", error);
      // Don't throw error to prevent initialization failure
    }
  }

  private mergeUploadHistories(
    localHistory: UploadedFile[],
    arweaveHistory: UploadedFile[]
  ): UploadedFile[] {
    const merged = [...localHistory];
    const existingIds = new Set(localHistory.map((file) => file.id));

    // Add files from Arweave that are not in local storage
    for (const arweaveFile of arweaveHistory) {
      if (!existingIds.has(arweaveFile.id)) {
        merged.push(arweaveFile);
      }
    }

    // Sort by upload date (newest first)
    return merged.sort(
      (a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()
    );
  }
}
