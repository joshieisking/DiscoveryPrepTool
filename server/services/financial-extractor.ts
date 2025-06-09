import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface FinancialMetrics {
  revenue: {
    current: string | null;
    previous: string | null;
    currency: string;
    confidence: "high" | "medium" | "low";
  };
  profit: {
    amount: string | null;
    type: "profit" | "loss" | "breakeven";
    margin: string | null;
    confidence: "high" | "medium" | "low";
  };
  employees: {
    total: number | null;
    confidence: "high" | "medium" | "low";
  };
  validation: {
    reasonableMargin: boolean;
    crossCheckPassed: boolean;
    extractionMethod: string;
  };
}

const FINANCIAL_EXTRACTION_PROMPT = `You are analyzing an annual report to help extract key information for a financial metrics dashboard. Extract ONLY financial metrics from this annual report. Be precise and concise.

**CRITICAL FINANCIAL EXTRACTION REQUIREMENTS:**

You must extract and validate ALL financial metrics with extreme precision.

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

Start response with { and end with }`;

export async function extractFinancialMetrics(
  filePath: string,
): Promise<FinancialMetrics> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const result = await model.generateContent([
      FINANCIAL_EXTRACTION_PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Simple JSON extraction for focused response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in financial extraction response");
    }

    const financialMetrics = JSON.parse(jsonMatch[0]) as FinancialMetrics;

    // Basic validation
    if (
      !financialMetrics.revenue ||
      !financialMetrics.profit ||
      !financialMetrics.employees
    ) {
      throw new Error("Incomplete financial metrics structure");
    }

    return financialMetrics;
  } catch (error) {
    console.error("Financial extraction failed:", error);
    throw new Error(
      `Failed to extract financial metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
