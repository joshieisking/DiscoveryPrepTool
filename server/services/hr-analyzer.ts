import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { FinancialMetrics } from "./financial-extractor";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface HRInsight {
  dataPoint: string;
  hrRelevance: string;
  conversationStarter: string;
  sourceContext?: string;
  confidence?: number;
  pageReference?: string;
}

export interface HRInsights {
  summary: string;
  businessContext: HRInsight[];
  workforceInsights: HRInsight[];
  operationalChallenges: HRInsight[];
  strategicPeopleInitiatives: HRInsight[];
}

const HR_ANALYSIS_PROMPT = `Analyze this annual report for HR-relevant insights using the provided financial context.

FINANCIAL CONTEXT:
Revenue: {{REVENUE}}
Profit/Loss: {{PROFIT}}
Employees: {{EMPLOYEES}}

CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown, no text before or after.

Required JSON format:
{
  "summary": "Brief executive summary incorporating financial context",
  "businessContext": [
    {
      "dataPoint": "Specific quote or data from document",
      "hrRelevance": "Why this matters to HR",
      "conversationStarter": "Discovery question for HR leader",
      "sourceContext": "Section where found",
      "confidence": 8,
      "pageReference": "Page number"
    }
  ],
  "workforceInsights": [...],
  "operationalChallenges": [...],
  "strategicPeopleInitiatives": [...]
}

ANALYSIS CATEGORIES:

BUSINESS CONTEXT:
- Use provided financial metrics for revenue analysis
- Geographic expansion with workforce implications
- Market position affecting talent strategy
- Business growth requiring HR scaling

WORKFORCE INSIGHTS:
- Employee count trends and distributions
- Skills gaps and talent challenges
- Compensation and benefits strategies
- Diversity and inclusion metrics

OPERATIONAL CHALLENGES:
- Regulatory compliance requirements
- Technology transformation needs
- Cost optimization affecting workforce
- Remote work and operational efficiency

STRATEGIC PEOPLE INITIATIVES:
- Learning and development investments
- Culture and engagement programs
- HR technology implementations
- Future workforce planning

Focus on actionable insights that demonstrate business understanding for HR discovery conversations.

Start response with { and end with }`;

export async function generateHRInsights(filePath: string, financialContext: FinancialMetrics): Promise<HRInsights> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Build financial context string
    const revenueStr = financialContext.revenue.current ? 
      `${financialContext.revenue.current} ${financialContext.revenue.currency}` : 'Not available';
    const profitStr = financialContext.profit.amount ? 
      `${financialContext.profit.amount} (${financialContext.profit.type})` : 'Not available';
    const employeesStr = financialContext.employees.total ? 
      financialContext.employees.total.toString() : 'Not available';

    const contextualPrompt = HR_ANALYSIS_PROMPT
      .replace('{{REVENUE}}', revenueStr)
      .replace('{{PROFIT}}', profitStr)
      .replace('{{EMPLOYEES}}', employeesStr);

    const result = await model.generateContent([
      contextualPrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in HR analysis response");
    }

    const hrInsights = JSON.parse(jsonMatch[0]) as HRInsights;

    // Validate structure
    if (!hrInsights.summary || !Array.isArray(hrInsights.businessContext)) {
      throw new Error("Invalid HR insights structure");
    }

    return hrInsights;
  } catch (error) {
    console.error("HR analysis failed:", error);
    throw new Error(`Failed to generate HR insights: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}