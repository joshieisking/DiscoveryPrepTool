import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import {
  analyzeDocumentPipeline,
  analyzeDocumentWithFallback,
  PipelineResult,
} from "./analysis-pipeline";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Keep existing interfaces for backward compatibility
export interface HRInsight {
  dataPoint: string;
  hrRelevance: string;
  conversationStarter: string;
  sourceContext?: string;
  confidence?: number;
  pageReference?: string;
}

export interface HRAnalysisResult {
  summary: string;
  businessContext: HRInsight[];
  workforceInsights: HRInsight[];
  operationalChallenges: HRInsight[];
  strategicPeopleInitiatives: HRInsight[];
}

// New enhanced interface that includes financial metrics
export interface EnhancedAnalysisResult extends HRAnalysisResult {
  financialMetrics?: {
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
  };
  processingStats?: {
    stage1Duration: number;
    stage2Duration: number;
    totalDuration: number;
    qualityScore: number;
  };
  extractionQuality?: {
    overallConfidence: "high" | "medium" | "low";
    dataCompleteness: "complete" | "partial" | "limited";
    validationConcerns: string[];
    recommendedFollowUp: string[];
  };
}

// Legacy prompt for fallback (your original working prompt)
const LEGACY_HR_ANALYSIS_PROMPT = `You are analyzing an annual report to help a solution advisor prepare for a discovery call with an HR leader. Extract key insights that demonstrate business understanding and create talking points.

**CRITICAL FINANCIAL EXTRACTION REQUIREMENTS:**

Before analyzing HR insights, you must first extract and validate ALL financial metrics with extreme precision. Use these rules:

**REVENUE EXTRACTION RULES:**
- Look for: "revenue", "total revenue", "net revenue", "sales", "net sales", "total sales"
- Common formats: "Revenue: $4.2B", "revenue grew to $4.2 billion", "achieved revenue of $4.2B", "revenue increased 23% to $4.2B"
- Extract BOTH current year and previous year when available
- If only percentage growth given, extract the percentage and base amount separately

**PROFIT/LOSS EXTRACTION RULES:**
- PROFIT indicators: "net income", "profit", "operating income", "earnings", "net earnings"
- LOSS indicators: "net loss", "operating loss", "loss", "deficit", "(loss)"
- CRITICAL: If you see "loss", "deficit", or negative indicators, mark as LOSS not profit
- Extract exact amounts and note if it's profit or loss

**BUSINESS LOGIC VALIDATION:**
- If profit > 50% of revenue, mark confidence as "low" and flag for review
- If profit = revenue, mark as "impossible - likely data extraction error"
- If loss is present, profit should be null or negative
- Revenue should always be positive and larger than profit

**STRUCTURED FINANCIAL OUTPUT:**
Always include this exact JSON structure at the beginning of your response:

{
  "financialMetrics": {
    "revenue": {
      "current": "4.2B" | null,
      "previous": "3.4B" | null,
      "growth": "23%" | null,
      "currency": "USD" | null,
      "confidence": "high" | "medium" | "low",
      "sourceText": "exact quote from document",
      "extractionMethod": "direct_statement" | "growth_narrative" | "calculated"
    },
    "profitLoss": {
      "type": "profit" | "loss" | "breakeven",
      "amount": "500M" | null,
      "margin": "12%" | null,
      "confidence": "high" | "medium" | "low",
      "sourceText": "exact quote from document",
      "validationFlags": ["profit_exceeds_50_percent"] | []
    },
    "validation": {
      "revenueReasonable": true | false,
      "profitMarginReasonable": true | false,
      "crossCheckPassed": true | false,
      "flaggedForReview": true | false,
      "notes": "Any validation concerns or extraction challenges"
    }
  }
}

[Continue with your original HR analysis instructions...]

Focus on insights related to HR administration, payroll operations, workforce scheduling and management, talent acquisition and development, employee learning programs, people analytics and reporting, and regulatory compliance.`;

// Enhanced JSON extraction (from your original code)
function findBalancedJSON(text: string): string | null {
  let braceCount = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      if (start === -1) start = i;
      braceCount++;
    } else if (text[i] === "}") {
      braceCount--;
      if (braceCount === 0 && start !== -1) {
        return text.substring(start, i + 1);
      }
    }
  }
  return null;
}

function sanitizeJSON(jsonStr: string): string {
  return jsonStr
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":');
}

function extractJSONRobust(text: string): string {
  const strategies = [
    () => {
      const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      return codeBlockMatch ? codeBlockMatch[1] : null;
    },
    () => findBalancedJSON(text),
    () => {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? sanitizeJSON(match[0]) : null;
    },
    () => {
      const matches = text.match(/\{[\s\S]*?\}/g);
      if (matches) {
        return matches.reduce((longest, current) =>
          current.length > longest.length ? current : longest,
        );
      }
      return null;
    },
  ];

  for (let i = 0; i < strategies.length; i++) {
    try {
      const jsonString = strategies[i]();
      if (jsonString) {
        JSON.parse(jsonString);
        return jsonString;
      }
    } catch (error) {
      console.warn(
        `JSON extraction strategy ${i + 1} failed:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  console.error(
    "All JSON extraction strategies failed. Raw response preview:",
    text.substring(0, 500),
  );
  throw new Error("Unable to extract valid JSON from Gemini response");
}

function validateResponse(parsed: any): HRAnalysisResult {
  const result = {
    summary: parsed.summary || "Analysis unavailable",
    businessContext: Array.isArray(parsed.businessContext)
      ? parsed.businessContext
      : [],
    workforceInsights: Array.isArray(parsed.workforceInsights)
      ? parsed.workforceInsights
      : [],
    operationalChallenges: Array.isArray(parsed.operationalChallenges)
      ? parsed.operationalChallenges
      : [],
    strategicPeopleInitiatives: Array.isArray(parsed.strategicPeopleInitiatives)
      ? parsed.strategicPeopleInitiatives
      : [],
  };

  return result as HRAnalysisResult;
}

// MAIN EXPORT - Enhanced version with fallback
export async function analyzeDocumentWithGemini(
  filePath: string,
  useEnhancedPipeline: boolean = true,
): Promise<EnhancedAnalysisResult> {
  console.log(
    `Starting document analysis with ${useEnhancedPipeline ? "enhanced pipeline" : "legacy approach"}`,
  );

  if (useEnhancedPipeline) {
    try {
      // Try enhanced multi-stage pipeline first
      const pipelineResult = await analyzeDocumentWithFallback(filePath);

      // Transform to legacy format for backward compatibility
      const result: EnhancedAnalysisResult = {
        summary: pipelineResult.hrInsights.summary,
        businessContext: pipelineResult.hrInsights.businessContext,
        workforceInsights: pipelineResult.hrInsights.workforceInsights,
        operationalChallenges: pipelineResult.hrInsights.operationalChallenges,
        strategicPeopleInitiatives:
          pipelineResult.hrInsights.strategicPeopleInitiatives,

        // Enhanced data
        financialMetrics: {
          revenue: {
            current: pipelineResult.financialMetrics.revenue.current,
            previous: pipelineResult.financialMetrics.revenue.previous,
            growth: pipelineResult.financialMetrics.revenue.growth,
            currency: pipelineResult.financialMetrics.revenue.currency,
            confidence: pipelineResult.financialMetrics.revenue.confidence,
          },
          profitLoss: {
            type: pipelineResult.financialMetrics.profitLoss.type,
            amount: pipelineResult.financialMetrics.profitLoss.amount,
            margin: pipelineResult.financialMetrics.profitLoss.margin,
            confidence: pipelineResult.financialMetrics.profitLoss.confidence,
          },
          employees: {
            total: pipelineResult.financialMetrics.employees.total,
            previousYear:
              pipelineResult.financialMetrics.employees.previousYear,
            growth: pipelineResult.financialMetrics.employees.growth,
            confidence: pipelineResult.financialMetrics.employees.confidence,
          },
        },
        processingStats: {
          stage1Duration: pipelineResult.processingStats.stage1Duration,
          stage2Duration: pipelineResult.processingStats.stage2Duration,
          totalDuration: pipelineResult.processingStats.totalDuration,
          qualityScore: calculateQualityScore(pipelineResult),
        },
        extractionQuality: pipelineResult.hrInsights.extractionQuality,
      };

      console.log("Enhanced pipeline completed successfully");
      return result;
    } catch (pipelineError) {
      console.warn(
        "Enhanced pipeline failed, falling back to legacy approach:",
        pipelineError,
      );
      // Fall through to legacy approach
    }
  }

  // Legacy approach (your original working code)
  return await analyzeDocumentLegacy(filePath);
}

// Legacy function (keep for backward compatibility and fallback)
async function analyzeDocumentLegacy(
  filePath: string,
): Promise<EnhancedAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const result = await model.generateContent([
      LEGACY_HR_ANALYSIS_PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    const jsonString = extractJSONRobust(text);
    const parsedResult = JSON.parse(jsonString);
    const analysisResult = validateResponse(parsedResult);

    if (
      !analysisResult.summary ||
      !Array.isArray(analysisResult.businessContext) ||
      !Array.isArray(analysisResult.workforceInsights) ||
      !Array.isArray(analysisResult.operationalChallenges) ||
      !Array.isArray(analysisResult.strategicPeopleInitiatives)
    ) {
      throw new Error("Invalid analysis structure from Gemini");
    }

    // Return in enhanced format for consistency
    const enhancedResult: EnhancedAnalysisResult = {
      ...analysisResult,
      financialMetrics: parsedResult.financialMetrics || undefined,
      processingStats: {
        stage1Duration: 0,
        stage2Duration: 0,
        totalDuration: 0,
        qualityScore: 0,
      },
    };

    return enhancedResult;
  } catch (error) {
    console.error(
      "Error analyzing document with legacy Gemini approach:",
      error,
    );
    throw new Error(
      `Failed to analyze document: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Utility function for quality scoring
function calculateQualityScore(pipelineResult: PipelineResult): number {
  let score = 0;

  // Financial metrics quality (0-40 points)
  if (pipelineResult.financialMetrics.revenue.current) score += 10;
  if (pipelineResult.financialMetrics.revenue.confidence === "high") score += 5;
  if (pipelineResult.financialMetrics.profitLoss.amount) score += 10;
  if (pipelineResult.financialMetrics.employees.total) score += 10;
  if (pipelineResult.financialMetrics.validation.crossCheckPassed) score += 5;

  // HR insights quality (0-60 points)
  const totalInsights =
    pipelineResult.hrInsights.businessContext.length +
    pipelineResult.hrInsights.workforceInsights.length +
    pipelineResult.hrInsights.operationalChallenges.length +
    pipelineResult.hrInsights.strategicPeopleInitiatives.length;

  score += Math.min(30, totalInsights * 2);

  if (pipelineResult.hrInsights.extractionQuality.overallConfidence === "high")
    score += 20;
  else if (
    pipelineResult.hrInsights.extractionQuality.overallConfidence === "medium"
  )
    score += 10;

  if (
    pipelineResult.hrInsights.extractionQuality.dataCompleteness === "complete"
  )
    score += 10;
  else if (
    pipelineResult.hrInsights.extractionQuality.dataCompleteness === "partial"
  )
    score += 5;

  return Math.min(100, score);
}

// Export legacy function for backward compatibility
export { analyzeDocumentLegacy };
