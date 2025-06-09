export interface UploadFile {
  id: number;
  fileName: string;
  fileSize: number;
  status: "processing" | "completed" | "failed";
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

export interface BusinessOverview {
  companyOverview: string;
  businessModel: string;
  revenueStreams: string[];
  keyMetrics: string[];
  operationalChallenges: string[];
  hrPayrollRelevance: string;
  industryClassification: string;
  competitivePosition: string;
  extractionQuality: {
    confidence: "high" | "medium" | "low";
    completeness: "complete" | "partial" | "limited";
    sourceQuality: string;
  };
}

export interface FinancialMetrics {
  revenue: {
    current: string | null;
    previous: string | null;
    growth: string | null;
    currency: string;
    confidence: "high" | "medium" | "low";
    sourceText: string;
    extractionMethod: "direct_statement" | "growth_narrative" | "calculated";
  };
  profitLoss: {
    type: "profit" | "loss" | "breakeven";
    amount: string | null;
    margin: string | null;
    confidence: "high" | "medium" | "low";
    sourceText: string;
    validationFlags: string[];
  };
  employees: {
    total: number | null;
    previousYear: number | null;
    growth: string | null;
    confidence: "high" | "medium" | "low";
    sourceText: string;
  };
  assets: {
    total: string | null;
    currency: string;
    confidence: "high" | "medium" | "low";
    sourceText: string;
  };
  validation: {
    revenueReasonable: boolean;
    profitMarginReasonable: boolean;
    crossCheckPassed: boolean;
    flaggedForReview: boolean;
    notes: string;
    extractionMethod: string;
  };
}

export interface AnalysisData {
  summary: string;
  businessOverview?: BusinessOverview;
  businessContext: HRInsight[];
  workforceInsights: HRInsight[];
  operationalChallenges: HRInsight[];
  strategicPeopleInitiatives: HRInsight[];
  financialMetrics?: FinancialMetrics;
}
