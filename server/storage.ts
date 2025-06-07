import { users, uploads, type User, type InsertUser, type Upload, type InsertUpload } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Upload methods
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUploads(): Promise<Upload[]>;
  getUploadById(id: number): Promise<Upload | undefined>;
  updateUploadStatus(id: number, status: string, analysisData?: string): Promise<Upload | undefined>;
  deleteUpload(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private uploads: Map<number, Upload>;
  private currentUserId: number;
  private currentUploadId: number;

  constructor() {
    this.users = new Map();
    this.uploads = new Map();
    this.currentUserId = 1;
    this.currentUploadId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const id = this.currentUploadId++;
    const upload: Upload = {
      id,
      fileName: insertUpload.fileName,
      fileSize: insertUpload.fileSize,
      status: insertUpload.status || "processing",
      uploadTime: new Date(),
      filePath: insertUpload.filePath ?? null,
      analysisData: insertUpload.analysisData ?? null,
    };
    this.uploads.set(id, upload);
    return upload;
  }

  async getUploads(): Promise<Upload[]> {
    return Array.from(this.uploads.values()).sort(
      (a, b) => b.uploadTime.getTime() - a.uploadTime.getTime()
    );
  }

  async getUploadById(id: number): Promise<Upload | undefined> {
    return this.uploads.get(id);
  }

  async updateUploadStatus(id: number, status: string, analysisData?: string): Promise<Upload | undefined> {
    const upload = this.uploads.get(id);
    if (!upload) return undefined;

    const updatedUpload: Upload = {
      ...upload,
      status,
      analysisData: analysisData || upload.analysisData,
    };
    this.uploads.set(id, updatedUpload);
    return updatedUpload;
  }

  async deleteUpload(id: number): Promise<boolean> {
    return this.uploads.delete(id);
  }
}

export const storage = new MemStorage();
