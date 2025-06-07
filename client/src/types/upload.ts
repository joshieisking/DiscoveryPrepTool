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

export interface HRInsight {
  dataPoint: string;
  hrRelevance: string;
  conversationStarter: string;
}

export interface AnalysisData {
  summary: string;
  businessContext: HRInsight[];
  workforceInsights: HRInsight[];
  operationalChallenges: HRInsight[];
  strategicPeopleInitiatives: HRInsight[];
}
