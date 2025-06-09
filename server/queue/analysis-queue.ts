import { Queue, Worker, Job } from 'bullmq';
import { getRedis } from './redis';
import { storage } from '../storage';
import { analyzeDocumentWithGemini } from '../services/gemini';

export interface AnalysisJobData {
  uploadId: number;
  filePath: string;
  isReanalysis?: boolean;
}

// Queue for document analysis jobs
export let analysisQueue: Queue<AnalysisJobData> | null = null;
export let analysisWorker: Worker<AnalysisJobData> | null = null;

// In-memory fallback queue for when Redis is unavailable
class MemoryQueue {
  private jobs: Map<string, AnalysisJobData> = new Map();
  private processing = false;

  async add(data: AnalysisJobData): Promise<void> {
    const jobId = `job_${Date.now()}_${Math.random()}`;
    this.jobs.set(jobId, data);
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.jobs.size === 0) return;
    
    this.processing = true;
    const iterator = this.jobs.entries();
    const entry = iterator.next();
    if (entry.done || !entry.value) return;
    
    const [jobId, data] = entry.value;
    this.jobs.delete(jobId);

    try {
      await processAnalysisJob(data);
    } catch (error) {
      console.error('Memory queue job failed:', error);
    } finally {
      this.processing = false;
      // Process next job if any
      if (this.jobs.size > 0) {
        setTimeout(() => this.processNext(), 100);
      }
    }
  }
}

const memoryQueue = new MemoryQueue();

export async function initializeQueue(): Promise<void> {
  const redis = getRedis();
  
  if (redis) {
    // Initialize Redis-based queue
    analysisQueue = new Queue('document-analysis', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    analysisWorker = new Worker(
      'document-analysis',
      async (job: Job<AnalysisJobData>) => {
        return await processAnalysisJob(job.data);
      },
      {
        connection: redis,
        concurrency: 1, // Process one document at a time
      }
    );

    analysisWorker.on('completed', (job) => {
      console.log(`Analysis job ${job.id} completed for upload ${job.data.uploadId}`);
    });

    analysisWorker.on('failed', (job, err) => {
      console.error(`Analysis job ${job?.id} failed for upload ${job?.data.uploadId}:`, err);
    });

    console.log('Redis queue initialized successfully');
  } else {
    console.log('Using in-memory queue fallback');
  }
}

export async function addAnalysisJob(data: AnalysisJobData): Promise<void> {
  if (analysisQueue) {
    await analysisQueue.add('analyze-document', data);
  } else {
    await memoryQueue.add(data);
  }
}

async function processAnalysisJob(data: AnalysisJobData): Promise<void> {
  const { uploadId, filePath, isReanalysis } = data;
  
  try {
    console.log(`${isReanalysis ? 'Reprocessing' : 'Processing'} upload ${uploadId}...`);
    
    // Ensure upload exists and is in processing state
    const upload = await storage.getUploadById(uploadId);
    if (!upload) {
      throw new Error(`Upload ${uploadId} not found`);
    }

    // Update status to processing if not already
    if (upload.status !== 'processing') {
      await storage.updateUploadStatus(uploadId, 'processing');
    }

    // Perform analysis
    const analysisResult = await analyzeDocumentWithGemini(filePath);
    const analysisData = JSON.stringify(analysisResult);
    
    // Update with results
    await storage.updateUploadStatus(uploadId, 'completed', analysisData);
    console.log(`${isReanalysis ? 'Reanalysis' : 'Analysis'} completed for upload ${uploadId}`);
    
  } catch (error) {
    console.error(`Error ${isReanalysis ? 'reprocessing' : 'processing'} upload ${uploadId}:`, error);
    await storage.updateUploadStatus(uploadId, 'failed');
    throw error; // Re-throw for queue retry logic
  }
}

export async function closeQueue(): Promise<void> {
  if (analysisWorker) {
    await analysisWorker.close();
  }
  if (analysisQueue) {
    await analysisQueue.close();
  }
}