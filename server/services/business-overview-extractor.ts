import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

const BUSINESS_OVERVIEW_PROMPT = `You are a Business Intelligence Analyst specializing in company research for B2B sales teams. Your role is to analyze annual reports and extract key business insights that help solution advisors prepare for discovery calls.

When analyzing an annual report, focus on:
1. **Core Business Model**: What does this company actually do? How do they make money? (subscription, transaction fees, product sales, services, etc.)
2. **Revenue Streams**: Break down their main sources of income and which segments are growing/declining
3. **Key Business Metrics**: What KPIs do they care about most? (customer acquisition, retention, margins, etc.)
4. **Operational Challenges**: What pain points or risks do they mention that HR/payroll solutions could impact?

**REQUIRED JSON OUTPUT:**
{
  "companyOverview": "2-3 sentences explaining what this company does and their market position",
  "businessModel": "Clear explanation of how they make money - subscription, transaction-based, product sales, services, etc.",
  "revenueStreams": [
    "Primary revenue stream with growth info",
    "Secondary revenue stream with trends",
    "Other significant income sources"
  ],
  "keyMetrics": [
    "Customer acquisition cost trends",
    "Retention rates or churn metrics", 
    "Margin improvements or pressures",
    "Other KPIs they emphasize"
  ],
  "operationalChallenges": [
    "Scalability challenges that affect workforce",
    "Regulatory or compliance pressures",
    "Technology transformation needs",
    "Cost pressures affecting operations"
  ],
  "hrPayrollRelevance": "Specific challenges or opportunities where workforce management, payroll, or HR technology could have business impact",
  "industryClassification": "Primary industry: Technology, Healthcare, Financial Services, Manufacturing, Retail, etc.",
  "competitivePosition": "How they position themselves vs competitors and market pressures they face",
  "extractionQuality": {
    "confidence": "high",
    "completeness": "complete", 
    "sourceQuality": "Assessment of document quality and detail level"
  }
}

Tone: Professional but conversational - like briefing a colleague before an important meeting.

Extract business intelligence now:`;

export async function extractBusinessOverview(
  filePath: string,
): Promise<BusinessOverview> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 1500,
      },
    });

    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const result = await model.generateContent([
      BUSINESS_OVERVIEW_PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in business overview response");
    }

    const businessOverview = JSON.parse(jsonMatch[0]) as BusinessOverview;

    console.log("Business overview extracted:", {
      industry: businessOverview.industryClassification,
      confidence: businessOverview.extractionQuality.confidence,
      revenueStreams: businessOverview.revenueStreams.length,
    });

    return businessOverview;
  } catch (error) {
    console.error("Business overview extraction failed:", error);

    // Return meaningful defaults instead of throwing
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
        sourceQuality: `Extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
    };
  }
}
