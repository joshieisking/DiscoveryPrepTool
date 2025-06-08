import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

const HR_ANALYSIS_PROMPT = `You are analyzing an annual report to help a solution advisor prepare for a discovery call with an HR leader. Extract key insights that demonstrate business understanding and create talking points.

From this annual report, extract and organize information into these 4 categories:

**BUSINESS CONTEXT:**
- Revenue growth rate and trajectory (include specific current year and previous year revenue figures)
- Net profit/income figures and profit margin calculations (with exact amounts)
- Total assets and employee count with precise numbers
- Geographic expansion or new market plans
- Geographic revenue breakdown by region/market (with percentages or amounts)
- Major acquisitions, divestitures, or restructuring
- Overall business strategy and priorities

**WORKFORCE INSIGHTS:**
- Total employee count and growth/reduction trends (include exact current and previous year headcount)
- Geographic distribution of employees (with specific percentages or numbers by region)
- Specific talent challenges, skill gaps, or hiring priorities mentioned
- Retention, turnover, or employee engagement issues (include specific percentages/scores)
- Diversity, equity & inclusion initiatives or workforce demographics (with specific metrics)

**OPERATIONAL CHALLENGES:**
- Regulatory compliance requirements or changes (especially labor laws, data privacy)
- Technology transformation or digital initiatives (with investment amounts if mentioned)
- Cost reduction or efficiency programs (include specific dollar amounts or percentages)
- Industry-specific operational pressures

**STRATEGIC PEOPLE INITIATIVES:**
- ESG or sustainability workforce commitments (with specific targets or investments)
- Remote work, hybrid, or workplace transformation strategy
- Learning & development or upskilling investments (include specific dollar amounts)
- Culture change or employee experience initiatives (with metrics if available)

For each insight found, provide:
1. The specific data point or quote (prioritize exact numbers, percentages, and dollar amounts)
2. A brief "why this matters to HR" explanation
3. A suggested conversation starter for the discovery call
4. Source context (the surrounding text/section where this insight was found)
5. Confidence level (1-10 scale, where 10 is highly confident in accuracy)
6. Page reference if available (e.g., "Page 15", "Executive Summary")

**CRITICAL: For financial and workforce metrics, always extract specific numerical values when available (e.g., "$15.1 billion revenue", "25,000 employees", "15% profit margin"). Include both current year and previous year figures to enable trend calculations. If exact figures aren't stated but percentages are given (e.g., "revenue increased 5%"), note this for calculation purposes.**

**Additionally, if available, provide a structured summary in this format:**

FINANCIAL METRICS:
- Current Revenue: [amount]
- Previous Revenue: [amount]  
- Net Profit: [amount]
- Profit Margin: [percentage]
- Total Employees: [number]
- Previous Year Employees: [number]

GEOGRAPHIC DATA:
- Countries/Markets: [number]
- Employee Distribution: [breakdown by region with percentages]
- Revenue Distribution: [breakdown by region if available]

If certain categories have no relevant information, simply note "No specific insights found."

Focus on insights related to HR administration, payroll operations, workforce scheduling and management, talent acquisition and development, employee learning programs, people analytics and reporting, and regulatory compliance - areas typically addressed by comprehensive HR technology platforms.

Please respond in valid JSON format with this structure:
{
  "summary": "Comprehensive executive summary highlighting the most significant HR-relevant insights and strategic implications",
  "businessContext": [
    {
      "dataPoint": "Detailed quote or data with full context and supporting metrics",
      "hrRelevance": "Comprehensive explanation of strategic HR implications and operational impact",
      "conversationStarter": "Substantive discovery question that demonstrates business understanding and opens multiple conversation paths",
      "sourceContext": "Surrounding text and section context where this insight was extracted from",
      "confidence": 8,
      "pageReference": "Page number or section name where found"
    }
  ],
  "workforceInsights": [...],
  "operationalChallenges": [...],
  "strategicPeopleInitiatives": [...]
}`;

export async function analyzeDocumentWithGemini(
  filePath: string,
): Promise<HRAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Read the file as base64
    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    // Determine MIME type based on file extension
    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const result = await model.generateContent([
      HR_ANALYSIS_PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean the response to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from Gemini");
    }

    const analysisResult = JSON.parse(jsonMatch[0]) as HRAnalysisResult;

    // Validate the structure
    if (
      !analysisResult.summary ||
      !Array.isArray(analysisResult.businessContext) ||
      !Array.isArray(analysisResult.workforceInsights) ||
      !Array.isArray(analysisResult.operationalChallenges) ||
      !Array.isArray(analysisResult.strategicPeopleInitiatives)
    ) {
      throw new Error("Invalid analysis structure from Gemini");
    }

    return analysisResult;
  } catch (error) {
    console.error("Error analyzing document with Gemini:", error);
    throw new Error(
      `Failed to analyze document: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
