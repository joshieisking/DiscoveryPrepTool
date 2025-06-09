import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

const RELIABLE_FINANCIAL_EXTRACTION_PROMPT = `You are a financial data extraction specialist. Extract financial metrics from annual reports with absolute precision and consistency.

**MANDATORY OUTPUT FORMAT:**
All monetary values must be in base units (e.g., 2610000000, not "2.61B").
All percentages as decimals without % symbol (e.g., 0.15 for 15%).
Employee counts as integers only.

**REVENUE EXTRACTION:**
- Primary sources: "Total revenue", "Net revenue", "Consolidated revenue"
- Secondary sources: "Net sales", "Total sales"
- Extract current year amount in base currency units
- If previous year available, extract that too
- Calculate growth rate as decimal (0.15 = 15% growth)

**PROFIT/LOSS EXTRACTION:**
- Look for: "Net income", "Net loss", "GAAP net income/loss"
- Use positive numbers for profit, negative for loss
- Extract amount in base currency units
- Avoid non-GAAP or adjusted figures unless GAAP unavailable

**EMPLOYEE COUNT:**
- Sources: "Total employees", "Full-time employees", "Workforce"
- Extract as integer (no commas, no formatting)
- Prefer end-of-period counts

**ASSET EXTRACTION:**
- Source: "Total assets" from balance sheet
- Extract in base currency units

**CONFIDENCE RULES:**
- HIGH: Direct statement with exact figures ("Revenue was $2,610,000,000")
- MEDIUM: Requires calculation ("Revenue grew 15% to $2.61 billion")
- LOW: Narrative or unclear ("Revenue increased significantly")

**REQUIRED JSON - NO DEVIATIONS:**
{
  "financialMetrics": {
    "revenue": {
      "current": "2610000000",
      "previous": "2263000000", 
      "growth": "0.15",
      "currency": "USD",
      "confidence": "high",
      "sourceText": "Total revenue was $2.610 billion, an increase of 15% year-over-year.",
      "extractionMethod": "direct_statement"
    },
    "profitLoss": {
      "type": "profit",
      "amount": "28000000",
      "margin": "0.011",
      "confidence": "high", 
      "sourceText": "GAAP net income was $28 million",
      "validationFlags": []
    },
    "employees": {
      "total": 5914,
      "previousYear": null,
      "growth": null,
      "confidence": "high",
      "sourceText": "As of January 31, 2025, we had 5,914 employees"
    },
    "assets": {
      "total": "9437000000",
      "currency": "USD", 
      "confidence": "high",
      "sourceText": "Total assets $9,437 million"
    },
    "validation": {
      "revenueReasonable": true,
      "profitMarginReasonable": true,
      "crossCheckPassed": true,
      "flaggedForReview": false,
      "notes": "All metrics extracted successfully with high confidence",
      "extractionMethod": "direct_statement"
    }
  }
}

**CRITICAL RULES:**
1. Numbers ONLY in base units - no "B", "M", "K" suffixes
2. Exact sourceText quotes from document
3. Use null for missing data, never estimate
4. extractionMethod must be: "direct_statement", "calculated", or "narrative_based"
5. Confidence based on source clarity, not complexity

Extract with absolute precision. No approximations.`;

export async function extractFinancialMetrics(
  filePath: string,
): Promise<FinancialMetrics> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent extraction
        topP: 0.8,
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

    // Enhanced JSON extraction with better error handling
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(
        "No JSON found in financial extraction response:",
        text.substring(0, 500),
      );
      throw new Error("No JSON found in financial extraction response");
    }

    let financialData;
    try {
      financialData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("Raw JSON string:", jsonMatch[0].substring(0, 500));
      throw new Error("Invalid JSON in financial extraction response");
    }

    // Extract the nested financialMetrics object
    const financialMetrics = financialData.financialMetrics;

    // Enhanced validation with detailed error reporting
    if (!financialMetrics || typeof financialMetrics !== "object") {
      throw new Error("Missing or invalid financialMetrics structure");
    }

    const requiredFields = [
      "revenue",
      "profitLoss",
      "employees",
      "assets",
      "validation",
    ];
    for (const field of requiredFields) {
      if (!financialMetrics[field]) {
        console.warn(`Missing required field: ${field}`);
      }
    }

    // Business logic validation
    if (
      financialMetrics.validation &&
      !financialMetrics.validation.crossCheckPassed
    ) {
      console.warn(
        "Financial data failed cross-check validation:",
        financialMetrics.validation.notes,
      );
    }

    return financialMetrics as FinancialMetrics;
  } catch (error) {
    console.error("Financial extraction failed:", error);
    throw new Error(
      `Failed to extract financial metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
