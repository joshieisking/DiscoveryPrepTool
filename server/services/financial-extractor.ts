import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Keep your existing FinancialMetrics interface exactly as-is
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

// REPLACE your existing RELIABLE_FINANCIAL_EXTRACTION_PROMPT with this:
const RELIABLE_FINANCIAL_EXTRACTION_PROMPT = `Extract key financial metrics from this document. Return valid JSON only.

RULES:
- All amounts in base units (2610000000, not "2.61B")  
- Use null for missing data
- Include exact quotes in sourceText
- Currency should be 3-letter code (USD, CAD, etc.)

REQUIRED FORMAT:
{
  "success": true,
  "data": {
    "revenue": {
      "current": "2610000000",
      "previous": null,
      "growth": null,
      "currency": "USD",
      "confidence": "high",
      "sourceText": "Revenue was $2.61 billion",
      "extractionMethod": "direct_statement"
    },
    "profitLoss": {
      "type": "profit",
      "amount": "28000000",
      "margin": null,
      "confidence": "high",
      "sourceText": "Net income of $28 million",
      "validationFlags": []
    },
    "employees": {
      "total": 5914,
      "previousYear": null,
      "growth": null,
      "confidence": "high",
      "sourceText": "5,914 employees as of year-end"
    },
    "assets": {
      "total": "9437000000",
      "currency": "USD",
      "confidence": "high",
      "sourceText": "Total assets of $9.4 billion"
    },
    "validation": {
      "revenueReasonable": true,
      "profitMarginReasonable": true,
      "crossCheckPassed": true,
      "flaggedForReview": false,
      "notes": "Successfully extracted core metrics",
      "extractionMethod": "direct_statement"
    }
  }
}

Extract financial data now:`;

// ADD these new helper functions before your main function:
function parseFinancialResponse(text: string): FinancialMetrics {
  const fullJsonMatch = text.match(/\{[\s\S]*\}/);
  if (fullJsonMatch) {
    try {
      const parsed = JSON.parse(fullJsonMatch[0]);

      // Handle new format with success wrapper
      if (parsed.success && parsed.data) {
        return parsed.data as FinancialMetrics;
      }

      // Handle legacy format (your current structure)
      if (parsed.financialMetrics) {
        return parsed.financialMetrics as FinancialMetrics;
      }

      // Handle direct format
      if (parsed.revenue || parsed.profitLoss) {
        return parsed as FinancialMetrics;
      }
    } catch (parseError) {
      console.warn("Primary JSON parsing failed, trying fallbacks");
    }
  }

  return createFailsafeMetrics("JSON parsing failed");
}

function createFailsafeMetrics(errorMessage: string): FinancialMetrics {
  return {
    revenue: {
      current: null,
      previous: null,
      growth: null,
      currency: "USD",
      confidence: "low",
      sourceText: "Extraction failed",
      extractionMethod: "calculated",
    },
    profitLoss: {
      type: "profit",
      amount: null,
      margin: null,
      confidence: "low",
      sourceText: "Extraction failed",
      validationFlags: ["system_error"],
    },
    employees: {
      total: null,
      previousYear: null,
      growth: null,
      confidence: "low",
      sourceText: "Extraction failed",
    },
    assets: {
      total: null,
      currency: "USD",
      confidence: "low",
      sourceText: "Extraction failed",
    },
    validation: {
      revenueReasonable: false,
      profitMarginReasonable: false,
      crossCheckPassed: false,
      flaggedForReview: true,
      notes: `System error: ${errorMessage}`,
      extractionMethod: "calculated",
    },
  };
}

// REPLACE your existing extractFinancialMetrics function with this:
export async function extractFinancialMetrics(
  filePath: string,
): Promise<FinancialMetrics> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 2048, // Added limit for consistency
      },
    });

    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const result = await model.generateContent([
      RELIABLE_FINANCIAL_EXTRACTION_PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Use new robust parsing instead of your existing JSON extraction
    const financialMetrics = parseFinancialResponse(text);

    // Keep your existing validation concept but improve it
    if (
      financialMetrics.validation &&
      !financialMetrics.validation.crossCheckPassed
    ) {
      console.warn(
        "Financial data failed cross-check validation:",
        financialMetrics.validation.notes,
      );
    }

    return financialMetrics;
  } catch (error) {
    console.error("Financial extraction failed:", error);

    // Instead of throwing, return meaningful defaults
    return createFailsafeMetrics(
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
