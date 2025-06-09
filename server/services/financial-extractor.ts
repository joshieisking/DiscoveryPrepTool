import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface FinancialMetrics {
  revenue: {
    current: string | null;
    previous: string | null;
    currency: string;
    confidence: 'high' | 'medium' | 'low';
  };
  profit: {
    amount: string | null;
    type: 'profit' | 'loss' | 'breakeven';
    margin: string | null;
    confidence: 'high' | 'medium' | 'low';
  };
  employees: {
    total: number | null;
    confidence: 'high' | 'medium' | 'low';
  };
  validation: {
    reasonableMargin: boolean;
    crossCheckPassed: boolean;
    extractionMethod: string;
  };
}

const FINANCIAL_EXTRACTION_PROMPT = `Extract ONLY financial metrics from this annual report. Be precise and concise.

CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown, no text before or after.

Required JSON format:
{
  "revenue": {
    "current": "4.2B" or null,
    "previous": "3.4B" or null,
    "currency": "USD",
    "confidence": "high"
  },
  "profit": {
    "amount": "500M" or null,
    "type": "profit" or "loss",
    "margin": "12%" or null,
    "confidence": "high"
  },
  "employees": {
    "total": 10118 or null,
    "confidence": "high"
  },
  "validation": {
    "reasonableMargin": true,
    "crossCheckPassed": true,
    "extractionMethod": "direct_statement"
  }
}

EXTRACTION RULES:
1. Revenue: Look for "revenue", "total revenue", "net revenue", "sales"
2. Profit/Loss: Look for "net income", "profit", "loss", "operating income"
3. If you see "loss" or negative values, set type to "loss"
4. Employees: Look for "total employees", "headcount", "workforce"
5. Use short format: "4.2B" not "4200000000"
6. Currency: Extract from context (USD, EUR, GBP, etc.)
7. Confidence: "high" if explicit numbers, "medium" if calculated, "low" if unclear

Start response with { and end with }`;

export async function extractFinancialMetrics(filePath: string): Promise<FinancialMetrics> {
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
    if (!financialMetrics.revenue || !financialMetrics.profit || !financialMetrics.employees) {
      throw new Error("Incomplete financial metrics structure");
    }

    return financialMetrics;
  } catch (error) {
    console.error("Financial extraction failed:", error);
    throw new Error(`Failed to extract financial metrics: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}