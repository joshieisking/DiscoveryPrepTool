import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { insertUploadSchema } from "@shared/schema";
import { addAnalysisJob } from "./queue/analysis-queue";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

const multerStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all uploads
  app.get("/api/uploads", async (req, res) => {
    try {
      const uploads = await storage.getUploads();
      res.json(uploads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch uploads" });
    }
  });

  // Upload file
  app.post("/api/uploads", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const uploadData = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        status: "processing",
        filePath: req.file.path,
        analysisData: null,
      };

      const validatedData = insertUploadSchema.parse(uploadData);
      const newUpload = await storage.createUpload(validatedData);

      // Queue document for background analysis
      await addAnalysisJob({
        uploadId: newUpload.id,
        filePath: req.file.path,
        isReanalysis: false,
      });

      res.status(201).json(newUpload);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get specific upload
  app.get("/api/uploads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const upload = await storage.getUploadById(id);
      
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      res.json(upload);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upload" });
    }
  });

  // Re-analyze existing upload
  app.post("/api/uploads/:id/reanalyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const upload = await storage.getUploadById(id);
      
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      if (!upload.filePath) {
        return res.status(400).json({ message: "File path not available for reanalysis" });
      }

      // Update status to processing
      await storage.updateUploadStatus(id, 'processing');
      
      // Queue document for reanalysis
      await addAnalysisJob({
        uploadId: id,
        filePath: upload.filePath!,
        isReanalysis: true,
      });

      // Return updated upload immediately
      const updatedUpload = await storage.getUploadById(id);
      res.json(updatedUpload);
    } catch (error) {
      console.error("Error triggering reanalysis:", error);
      res.status(500).json({ message: "Failed to trigger reanalysis" });
    }
  });

  // Delete upload
  app.delete("/api/uploads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const upload = await storage.getUploadById(id);
      
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      // Delete file from disk
      if (upload.filePath) {
        try {
          await fs.unlink(upload.filePath);
        } catch (error) {
          console.warn("Failed to delete file from disk:", error);
        }
      }

      const deleted = await storage.deleteUpload(id);
      if (deleted) {
        res.json({ message: "Upload deleted successfully" });
      } else {
        res.status(404).json({ message: "Upload not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete upload" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
