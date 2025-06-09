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
  sourceContext?: string;
  confidence?: number;
  pageReference?: string;
  strategicImplications?: string;
}

// NEW: Add structured financial metrics interface
export interface FinancialMetrics {
  revenue: {
    current: string | null;
    previous: string | null;
    growth: string | null;
    currency: string;
    confidence: "high" | "medium" | "low";
  };
  profitLoss: {
    type: "profit" | "loss" | "breakeven";
    amount: string | null;
    margin: string | null;
    confidence: "high" | "medium" | "low";
  };
  employees: {
    total: number | null;
    previousYear: number | null;
    growth: string | null;
    confidence: "high" | "medium" | "low";
  };
  assets: {
    total: string | null;
    currency: string;
    confidence: "high" | "medium" | "low";
  };
}

// UPDATED: Include financial metrics in analysis data
export interface AnalysisData {
  summary: string;
  businessContext: HRInsight[];
  workforceInsights: HRInsight[];
  operationalChallenges: HRInsight[];
  strategicPeopleInitiatives: HRInsight[];
  
  // NEW: Add structured financial metrics
  financialMetrics?: FinancialMetrics;
  
  // NEW: Add processing quality info
  extractionQuality?: {
    overallConfidence: "high" | "medium" | "low";
    dataCompleteness: "complete" | "partial" | "limited";
    validationConcerns: string[];
    recommendedFollowUp: string[];
  };
}
