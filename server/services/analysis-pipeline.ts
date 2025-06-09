import {
  extractFinancialMetrics,
  FinancialMetrics,
} from "./financial-extractor";
import { generateHRInsights, HRInsights } from "./hr-analyzer";
import {
  extractBusinessOverview,
  BusinessOverview,
} from "./business-overview-extractor";
import { FEATURES } from "./feature-flags";

export interface PipelineResult {
  businessOverview: BusinessOverview;
  financialMetrics: FinancialMetrics;
  hrInsights: HRInsights;
  processingStats: {
    stage0Duration: number;
    stage1Duration: number;
    stage2Duration: number;
    totalDuration: number;
    stage0Success: boolean;
    stage1Success: boolean;
    stage2Success: boolean;
    executionMode?: 'sequential' | 'parallel';
    partialSuccess?: boolean;
  };
}

export interface PipelineError {
  stage: "business_overview" | "financial" | "hr" | "pipeline";
  error: string;
  partialData?: {
    businessOverview?: BusinessOverview;
    financialMetrics?: FinancialMetrics;
    hrInsights?: Partial<HRInsights>;
  };
}

// Helper function to measure stage execution time
async function measureStage<T>(
  stageName: string,
  stageFunction: () => Promise<T>
): Promise<{ result: T; duration: number; success: boolean }> {
  const startTime = Date.now();
  try {
    const result = await stageFunction();
    const duration = Date.now() - startTime;
    return { result, duration, success: true };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`${stageName} failed:`, error);
    throw { error, duration, success: false };
  }
}

// Parallel execution implementation
async function executeStagesParallel(filePath: string): Promise<PipelineResult> {
  const startTime = Date.now();
  console.log("Starting parallel analysis pipeline...");

  try {
    // Execute all stages in parallel
    const stageResults = await Promise.allSettled([
      measureStage('Stage 0', () => extractBusinessOverview(filePath)),
      measureStage('Stage 1', () => extractFinancialMetrics(filePath)),
      measureStage('Stage 2', () => generateHRInsights(filePath))
    ]);

    // Process results
    const [stage0Result, stage1Result, stage2Result] = stageResults;
    
    let businessOverview: BusinessOverview;
    let financialMetrics: FinancialMetrics;
    let hrInsights: HRInsights;
    let stage0Duration = 0;
    let stage1Duration = 0;
    let stage2Duration = 0;
    let stage0Success = false;
    let stage1Success = false;
    let stage2Success = false;
    let partialSuccess = false;

    // Handle Stage 0 (Business Overview)
    if (stage0Result.status === 'fulfilled') {
      businessOverview = stage0Result.value.result;
      stage0Duration = stage0Result.value.duration;
      stage0Success = true;
      console.log("Stage 0 completed successfully:", {
        duration: stage0Duration,
        industry: businessOverview.industryClassification,
        confidence: businessOverview.extractionQuality.confidence,
      });
    } else {
      console.warn("Stage 0 failed, using fallback");
      businessOverview = getDefaultBusinessOverview();
      partialSuccess = true;
    }

    // Handle Stage 1 (Financial Metrics)
    if (stage1Result.status === 'fulfilled') {
      financialMetrics = stage1Result.value.result;
      stage1Duration = stage1Result.value.duration;
      stage1Success = true;
      console.log("Stage 1 completed successfully:", {
        duration: stage1Duration,
        revenue: financialMetrics.revenue.current,
        employees: financialMetrics.employees.total,
      });
    } else {
      console.warn("Stage 1 failed, using fallback");
      financialMetrics = await extractFinancialMetricsRelaxed(filePath);
      partialSuccess = true;
    }

    // Handle Stage 2 (HR Insights)
    if (stage2Result.status === 'fulfilled') {
      hrInsights = stage2Result.value.result;
      stage2Duration = stage2Result.value.duration;
      stage2Success = true;
      console.log("Stage 2 completed successfully:", {
        duration: stage2Duration,
        businessContextInsights: hrInsights.businessContext.length,
        workforceInsights: hrInsights.workforceInsights.length,
      });
    } else {
      console.error("Stage 2 failed, cannot proceed without HR insights");
      throw new Error("HR insights generation failed - this is required for analysis");
    }

    const totalDuration = Date.now() - startTime;
    const qualityScore = calculateQualityScore(businessOverview, financialMetrics, hrInsights);
    
    console.log("Parallel pipeline completed:", {
      mode: 'parallel',
      duration: totalDuration,
      qualityScore,
      partialSuccess
    });

    return {
      businessOverview,
      financialMetrics,
      hrInsights,
      processingStats: {
        stage0Duration,
        stage1Duration,
        stage2Duration,
        totalDuration,
        stage0Success,
        stage1Success,
        stage2Success,
        executionMode: 'parallel',
        partialSuccess,
      },
    };
  } catch (error) {
    console.error("Parallel execution failed, falling back to sequential");
    throw error;
  }
}

export async function analyzeDocumentPipeline(
  filePath: string,
): Promise<PipelineResult> {
  // Debug feature flag evaluation
  console.log("Feature flag evaluation:", {
    PARALLEL_PROCESSING: FEATURES.PARALLEL_PROCESSING,
    env_var: process.env.ENABLE_PARALLEL_PROCESSING,
    features_object: FEATURES
  });
  
  // Feature flag check for parallel processing
  if (FEATURES.PARALLEL_PROCESSING) {
    console.log("Parallel processing enabled - executing parallel pipeline");
    try {
      return await executeStagesParallel(filePath);
    } catch (error) {
      console.warn("Parallel processing failed, falling back to sequential:", error);
      // Continue to sequential execution below
    }
  } else {
    console.log("Parallel processing disabled - executing sequential pipeline");
  }

  // Sequential execution (existing implementation)
  const startTime = Date.now();
  let stage0Duration = 0;
  let stage1Duration = 0;
  let stage2Duration = 0;
  let stage0Success = false;
  let stage1Success = false;
  let stage2Success = false;

  try {
    console.log("Starting enhanced three-stage analysis pipeline...");

    // Stage 0: Business Overview Extraction
    console.log("Stage 0: Extracting business overview...");
    const stage0Start = Date.now();

    const businessOverview = await extractBusinessOverview(filePath);

    stage0Duration = Date.now() - stage0Start;
    stage0Success = true;

    console.log("Stage 0 completed successfully:", {
      duration: stage0Duration,
      industry: businessOverview.industryClassification,
      confidence: businessOverview.extractionQuality.confidence,
      revenueStreams: businessOverview.revenueStreams.length,
    });

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
    console.log(
      "Stage 2: Generating HR insights with business and financial context...",
    );
    const stage2Start = Date.now();

    const hrInsights = await generateHRInsights(filePath);

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
    const qualityScore = calculateQualityScore(
      businessOverview,
      financialMetrics,
      hrInsights,
    );
    console.log("Pipeline completed with quality score:", qualityScore);

    return {
      businessOverview,
      financialMetrics,
      hrInsights,
      processingStats: {
        stage0Duration,
        stage1Duration,
        stage2Duration,
        totalDuration,
        stage0Success,
        stage1Success,
        stage2Success,
        executionMode: 'sequential',
      },
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    console.error("Pipeline failed:", {
      error: error instanceof Error ? error.message : String(error),
      stage0Success,
      stage1Success,
      stage2Success,
      stage0Duration,
      stage1Duration,
      stage2Duration,
      totalDuration,
    });

    // Determine which stage failed and provide context
    const stage = stage0Success
      ? stage1Success
        ? "hr"
        : "financial"
      : "business_overview";

    throw new Error(
      `Analysis pipeline failed at ${stage} stage: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

function calculateQualityScore(
  businessOverview: BusinessOverview,
  financialMetrics: FinancialMetrics,
  hrInsights: HRInsights,
): number {
  let score = 0;

  // Business overview quality (0-20 points)
  if (
    businessOverview.companyOverview &&
    businessOverview.companyOverview !==
      "Unable to extract company overview from document"
  )
    score += 5;
  if (
    businessOverview.businessModel &&
    businessOverview.businessModel !== "Business model extraction failed"
  )
    score += 5;
  if (businessOverview.revenueStreams.length > 0) score += 5;
  if (businessOverview.extractionQuality.confidence === "high") score += 5;

  // Financial metrics quality (0-40 points)
  if (financialMetrics.revenue.current) score += 10;
  if (financialMetrics.revenue.confidence === "high") score += 5;
  if (financialMetrics.profitLoss.amount) score += 10;
  if (financialMetrics.employees.total) score += 10;
  if (financialMetrics.validation.crossCheckPassed) score += 5;

  // HR insights quality (0-40 points)
  const totalInsights =
    hrInsights.businessContext.length +
    hrInsights.workforceInsights.length +
    hrInsights.operationalChallenges.length +
    hrInsights.strategicPeopleInitiatives.length;

  score += Math.min(20, totalInsights * 1.5); // Up to 20 points for quantity

  if (hrInsights.extractionQuality.overallConfidence === "high") score += 15;
  else if (hrInsights.extractionQuality.overallConfidence === "medium")
    score += 8;

  if (hrInsights.extractionQuality.dataCompleteness === "complete") score += 5;
  else if (hrInsights.extractionQuality.dataCompleteness === "partial")
    score += 3;

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

    // Recovery Strategy 1: Try with relaxed extraction for all stages
    try {
      console.log("Attempting recovery with relaxed extraction...");

      // Try to get at least business overview
      let businessOverview: BusinessOverview;
      try {
        businessOverview = await extractBusinessOverview(filePath);
      } catch (overviewError) {
        console.warn(
          "Business overview extraction failed in recovery, using defaults",
        );
        businessOverview = getDefaultBusinessOverview();
      }

      // Try relaxed financial extraction
      const partialFinancials = await extractFinancialMetricsRelaxed(filePath);

      // Try HR insights with available context
      const hrInsights = await generateHRInsights(filePath);

      return {
        businessOverview,
        financialMetrics: partialFinancials,
        hrInsights,
        processingStats: {
          stage0Duration: 0,
          stage1Duration: 0,
          stage2Duration: 0,
          totalDuration: 0,
          stage0Success: true,
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

// Default business overview for fallback scenarios
function getDefaultBusinessOverview(): BusinessOverview {
  return {
    companyOverview: "Unable to extract company overview from document",
    businessModel: "Business model extraction failed",
    revenueStreams: [],
    keyMetrics: [],
    operationalChallenges: [],
    hrPayrollRelevance: "HR/Payroll relevance analysis unavailable",
    industryClassification: "Unknown",
    competitivePosition: "Competitive position analysis unavailable",
    extractionQuality: {
      confidence: "low",
      completeness: "limited",
      sourceQuality: "Fallback mode - business overview extraction failed",
    },
  };
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
      extractionMethod: "direct_statement",
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
      extractionMethod: "direct_statement",
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
