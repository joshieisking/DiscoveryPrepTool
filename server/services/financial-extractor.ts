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

const ENHANCED_FINANCIAL_EXTRACTION_PROMPT = `You are a financial data extraction specialist analyzing an annual report. Your job is to extract ALL financial metrics with extreme precision and validate them using business logic.

**CRITICAL FINANCIAL EXTRACTION REQUIREMENTS:**

**REVENUE EXTRACTION RULES:**
- Look for: "revenue", "total revenue", "net revenue", "sales", "net sales", "total sales", "gross revenue"
- Common formats: "Revenue: $4.2B", "revenue grew to $4.2 billion", "achieved revenue of $4.2B", "revenue increased 23% to $4.2B"
- Extract BOTH current year and previous year when available
- If only percentage growth given, extract the percentage and base amount separately
- Handle fiscal year vs calendar year differences
- Prioritize consolidated figures over segment breakdowns

**PROFIT/LOSS EXTRACTION RULES:**
- PROFIT indicators: "net income", "profit", "operating income", "earnings", "net earnings", "income from operations"
- LOSS indicators: "net loss", "operating loss", "loss", "deficit", "(loss)", "negative income"
- CRITICAL: If you see "loss", "deficit", or negative indicators, mark as LOSS not profit
- Extract exact amounts and note if it's profit or loss
- Calculate profit margin if both revenue and profit are available
- Handle GAAP vs non-GAAP distinctions (prioritize GAAP)

**EMPLOYEE DATA EXTRACTION:**
- Look for: "employees", "full-time employees", "workforce", "headcount", "team members"
- Extract both current and previous year if available
- Calculate growth rate if both years are present
- Note any major layoffs, acquisitions affecting headcount

**ASSET EXTRACTION:**
- Look for: "total assets", "assets", "balance sheet total"
- Extract from balance sheet or financial statements section
- Note currency and reporting standards

**BUSINESS LOGIC VALIDATION:**
- If profit > 50% of revenue, mark confidence as "low" and flag for review
- If profit = revenue, mark as "impossible - likely data extraction error"
- If loss is present, profit amount should be negative or null
- Revenue should always be positive and larger than absolute profit
- Revenue per employee should be reasonable for the industry
- Asset to revenue ratios should be realistic

**CURRENCY AND SCALE HANDLING:**
- Standardize to primary reporting currency
- Handle billions (B), millions (M), thousands (K) consistently
- Note if multiple currencies are present
- Convert percentages to decimal representations where needed

**EXTRACTION CONFIDENCE SCORING:**
- HIGH: Direct statement with exact figures and clear context
- MEDIUM: Derived from growth rates or requires minor calculation
- LOW: Narrative description or potential ambiguity in interpretation

**REQUIRED JSON OUTPUT:**
Respond with ONLY this JSON structure:

{
  "financialMetrics": {
    "revenue": {
      "current": "4.2B" | null,
      "previous": "3.4B" | null,
      "growth": "23%" | null,
      "currency": "USD" | "EUR" | "CAD" | etc,
      "confidence": "high" | "medium" | "low",
      "sourceText": "exact quote from document including surrounding context",
      "extractionMethod": "direct_statement" | "growth_narrative" | "calculated"
    },
    "profitLoss": {
      "type": "profit" | "loss" | "breakeven",
      "amount": "500M" | "-200M" | null,
      "margin": "12%" | null,
      "confidence": "high" | "medium" | "low",
      "sourceText": "exact quote from document including surrounding context",
      "validationFlags": ["profit_exceeds_50_percent", "unusual_margin"] | []
    },
    "employees": {
      "total": 50000 | null,
      "previousYear": 45000 | null,
      "growth": "11%" | null,
      "confidence": "high" | "medium" | "low",
      "sourceText": "exact quote from document including surrounding context"
    },
    "assets": {
      "total": "15B" | null,
      "currency": "USD" | null,
      "confidence": "high" | "medium" | "low",
      "sourceText": "exact quote from document including surrounding context"
    },
    "validation": {
      "revenueReasonable": true | false,
      "profitMarginReasonable": true | false,
      "crossCheckPassed": true | false,
      "flaggedForReview": true | false,
      "notes": "Any validation concerns, extraction challenges, or data quality issues",
      "extractionMethod": "comprehensive_financial_analysis"
    }
  }
}

**SPECIAL HANDLING FOR EDGE CASES:**
- If financial data is presented in narrative form ("revenue grew significantly"), extract the context and mark confidence as "low"
- If multiple currency units are present, standardize to primary reporting currency and note others
- If fiscal year differs from calendar year, note this in the sourceText
- If pro forma vs GAAP numbers are mentioned, prioritize GAAP and note the difference
- For companies with segments, extract consolidated figures first
- Handle restatements or adjustments by using the most recent corrected figures

Focus on precision, business logic validation, and providing rich context for the next analysis stage.`;

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
      ENHANCED_FINANCIAL_EXTRACTION_PROMPT,
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
