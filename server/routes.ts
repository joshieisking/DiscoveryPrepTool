import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { insertUploadSchema } from "@shared/schema";

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

      // Simulate processing - in a real app, this would be async
      setTimeout(async () => {
        try {
          // Mock analysis data
          const mockAnalysis = {
            summary: "Annual report analysis completed",
            keyInsights: [
              "Revenue grew 15% year-over-year",
              "Strong performance in digital transformation initiatives",
              "Expansion into new markets showing promising results"
            ],
            financialMetrics: {
              revenue: "$2.5B",
              profitMargin: "12%",
              growthRate: "15%"
            }
          };

          await storage.updateUploadStatus(
            newUpload.id, 
            "completed", 
            JSON.stringify(mockAnalysis)
          );
        } catch (error) {
          await storage.updateUploadStatus(newUpload.id, "failed");
        }
      }, 3000);

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
