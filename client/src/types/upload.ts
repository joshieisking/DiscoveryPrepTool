export interface UploadFile {
  id: number;
  fileName: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'failed';
  uploadTime: string;
  filePath?: string;
  analysisData?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  isUploading: boolean;
}

export interface AnalysisData {
  summary: string;
  keyInsights: string[];
  financialMetrics: {
    revenue: string;
    profitMargin: string;
    growthRate: string;
  };
}
