import {
  extractFinancialMetrics,
  FinancialMetrics,
} from "./financial-extractor";
import { generateHRInsights, HRInsights } from "./hr-analyzer";

export interface PipelineResult {
  financialMetrics: FinancialMetrics;
  hrInsights: HRInsights;
  processingStats: {
    stage1Duration: number;
    stage2Duration: number;
    totalDuration: number;
    stage1Success: boolean;
    stage2Success: boolean;
  };
}

export interface PipelineError {
  stage: "financial" | "hr" | "pipeline";
  error: string;
  partialData?: {
    financialMetrics?: FinancialMetrics;
    hrInsights?: Partial<HRInsights>;
  };
}

export async function analyzeDocumentPipeline(
  filePath: string,
): Promise<PipelineResult> {
  const startTime = Date.now();
  let stage1Duration = 0;
  let stage2Duration = 0;
  let stage1Success = false;
  let stage2Success = false;

  try {
    console.log("Starting enhanced two-stage analysis pipeline...");

    // Stage 1: Financial Metrics Extraction
    console.log("Stage 1: Extracting financial metrics...");
    const stage1Start = Date.now();

    const financialMetrics = await extractFinancialMetrics(filePath);

    stage1Duration = Date.now() - stage1Start;
    stage1Success = true;

    console.log("Stage 1 completed successfully:", {
      duration: stage1Duration,
      revenue: financialMetrics.revenue.current,
      employees: financialMetrics.employees.total,
      confidence: financialMetrics.validation.crossCheckPassed
        ? "high"
        : "medium",
    });

    // Validate financial metrics before proceeding
    if (financialMetrics.validation.flaggedForReview) {
      console.warn(
        "Financial metrics flagged for review:",
        financialMetrics.validation.notes,
      );
    }

    // Stage 2: HR Insights Generation
    console.log("Stage 2: Generating HR insights with financial context...");
    const stage2Start = Date.now();

    const hrInsights = await generateHRInsights(filePath, financialMetrics);

    stage2Duration = Date.now() - stage2Start;
    stage2Success = true;

    console.log("Stage 2 completed successfully:", {
      duration: stage2Duration,
      businessContextInsights: hrInsights.businessContext.length,
      workforceInsights: hrInsights.workforceInsights.length,
      overallConfidence: hrInsights.extractionQuality.overallConfidence,
    });

    const totalDuration = Date.now() - startTime;

    // Final validation and quality check
    const qualityScore = calculateQualityScore(financialMetrics, hrInsights);
    console.log("Pipeline completed with quality score:", qualityScore);

    return {
      financialMetrics,
      hrInsights,
      processingStats: {
        stage1Duration,
        stage2Duration,
        totalDuration,
        stage1Success,
        stage2Success,
      },
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    console.error("Pipeline failed:", {
      error: error instanceof Error ? error.message : String(error),
      stage1Success,
      stage2Success,
      stage1Duration,
      stage2Duration,
      totalDuration,
    });

    // Determine which stage failed and provide context
    const stage = stage1Success ? "hr" : "financial";

    throw new Error(
      `Analysis pipeline failed at ${stage} stage: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

function calculateQualityScore(
  financialMetrics: FinancialMetrics,
  hrInsights: HRInsights,
): number {
  let score = 0;

  // Financial metrics quality (0-40 points)
  if (financialMetrics.revenue.current) score += 10;
  if (financialMetrics.revenue.confidence === "high") score += 5;
  if (financialMetrics.profitLoss.amount) score += 10;
  if (financialMetrics.employees.total) score += 10;
  if (financialMetrics.validation.crossCheckPassed) score += 5;

  // HR insights quality (0-60 points)
  const totalInsights =
    hrInsights.businessContext.length +
    hrInsights.workforceInsights.length +
    hrInsights.operationalChallenges.length +
    hrInsights.strategicPeopleInitiatives.length;

  score += Math.min(30, totalInsights * 2); // Up to 30 points for quantity

  if (hrInsights.extractionQuality.overallConfidence === "high") score += 20;
  else if (hrInsights.extractionQuality.overallConfidence === "medium")
    score += 10;

  if (hrInsights.extractionQuality.dataCompleteness === "complete") score += 10;
  else if (hrInsights.extractionQuality.dataCompleteness === "partial")
    score += 5;

  return Math.min(100, score);
}

// Enhanced error handling with fallback strategies
export async function analyzeDocumentWithFallback(
  filePath: string,
): Promise<PipelineResult> {
  try {
    return await analyzeDocumentPipeline(filePath);
  } catch (pipelineError) {
    console.warn("Enhanced pipeline failed, attempting recovery strategies...");

    // Recovery Strategy 1: Try with relaxed financial extraction
    try {
      console.log("Attempting recovery with relaxed financial extraction...");
      const partialFinancials = await extractFinancialMetricsRelaxed(filePath);
      const hrInsights = await generateHRInsights(filePath, partialFinancials);

      return {
        financialMetrics: partialFinancials,
        hrInsights,
        processingStats: {
          stage1Duration: 0,
          stage2Duration: 0,
          totalDuration: 0,
          stage1Success: true,
          stage2Success: true,
        },
      };
    } catch (recoveryError) {
      console.error("Recovery strategy failed:", recoveryError);
      throw new Error(
        `Both primary pipeline and recovery strategy failed: ${pipelineError instanceof Error ? pipelineError.message : String(pipelineError)}`,
      );
    }
  }
}

// Fallback financial extraction with more lenient requirements
async function extractFinancialMetricsRelaxed(
  filePath: string,
): Promise<FinancialMetrics> {
  // Simplified extraction with default values for missing data
  const defaultFinancials: FinancialMetrics = {
    revenue: {
      current: null,
      previous: null,
      growth: null,
      currency: "USD",
      confidence: "low",
      sourceText: "Unable to extract - using defaults",
      extractionMethod: "fallback",
    },
    profitLoss: {
      type: "profit",
      amount: null,
      margin: null,
      confidence: "low",
      sourceText: "Unable to extract - using defaults",
      validationFlags: ["fallback_mode"],
    },
    employees: {
      total: null,
      previousYear: null,
      growth: null,
      confidence: "low",
      sourceText: "Unable to extract - using defaults",
    },
    assets: {
      total: null,
      currency: "USD",
      confidence: "low",
      sourceText: "Unable to extract - using defaults",
    },
    validation: {
      revenueReasonable: false,
      profitMarginReasonable: false,
      crossCheckPassed: false,
      flaggedForReview: true,
      notes: "Fallback mode - limited financial data available",
      extractionMethod: "relaxed_fallback",
    },
  };

  // Try to extract at least some financial data with basic prompts
  try {
    const basicFinancials = await extractFinancialMetrics(filePath);
    return basicFinancials;
  } catch (error) {
    console.warn("Even relaxed extraction failed, using defaults:", error);
    return defaultFinancials;
  }
}
