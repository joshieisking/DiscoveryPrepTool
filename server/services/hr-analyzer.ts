import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { FinancialMetrics } from "./financial-extractor";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface HRInsight {
  dataPoint: string;
  hrRelevance: string;
  conversationStarter: string;
  sourceContext: string;
  confidence: number;
  pageReference: string;
  strategicImplications: string;
}

export interface HRInsights {
  summary: string;
  businessContext: HRInsight[];
  workforceInsights: HRInsight[];
  operationalChallenges: HRInsight[];
  strategicPeopleInitiatives: HRInsight[];
  extractionQuality: {
    overallConfidence: "high" | "medium" | "low";
    dataCompleteness: "complete" | "partial" | "limited";
    validationConcerns: string[];
    recommendedFollowUp: string[];
  };
}

const FOCUSED_HR_ANALYSIS_PROMPT = `You are an HR technology consultant analyzing an annual report to prepare for a discovery call with an HR leader. You have been provided with validated financial metrics and now need to extract HR-specific insights that demonstrate business understanding.

**FINANCIAL CONTEXT PROVIDED:**
- Revenue: {{REVENUE}}
- Profit/Loss: {{PROFIT}}
- Employees: {{EMPLOYEES}}
- Assets: {{ASSETS}}
- Revenue per Employee: {{RPE}}

**HR ANALYSIS CATEGORIES:**

**BUSINESS CONTEXT INSIGHTS:**
Focus on business factors that impact HR strategy and operations:
- Geographic expansion or new market plans that affect workforce planning
- Geographic revenue breakdown by region/market (affecting global HR operations)
- Major acquisitions, divestitures, or restructuring impacting workforce
- Market positioning and competitive pressures affecting talent strategy
- Customer segments and business model changes impacting skill requirements
- Overall business strategy and priorities requiring workforce transformation

**WORKFORCE INSIGHTS:**
Extract specific people-related data and trends:
- Employee growth/reduction trends beyond the financial data provided
- Geographic distribution of employees (percentages or numbers by region)
- Specific talent challenges, skill gaps, or hiring priorities mentioned
- Retention, turnover, or employee engagement metrics (specific percentages/scores)
- Diversity, equity & inclusion initiatives with specific metrics or targets
- Compensation and benefits costs as percentage of revenue
- Workforce demographics, age distribution, or tenure information
- Skills transformation needs or reskilling initiatives

**OPERATIONAL CHALLENGES:**
Identify operational issues that HR technology can address:
- Regulatory compliance requirements (labor laws, data privacy, safety)
- Technology transformation or digital initiatives affecting workforce
- Cost reduction or efficiency programs impacting people operations
- Industry-specific operational pressures affecting HR processes
- Workforce-related operational costs and optimization opportunities
- Remote work, hybrid, or workplace transformation challenges
- Global operations complexity affecting HR administration

**STRATEGIC PEOPLE INITIATIVES:**
Extract forward-looking HR strategic initiatives:
- ESG or sustainability workforce commitments with specific targets
- Culture change or employee experience transformation programs
- Learning & development or upskilling investments (specific dollar amounts)
- People analytics and HR technology investments mentioned
- Leadership development or succession planning initiatives
- Workplace innovation or employee engagement programs
- Performance management or talent development strategy changes

**DATA EXTRACTION REQUIREMENTS:**

For each insight, provide:
1. **Specific data point**: Direct quote with numbers, percentages, dollar amounts
2. **HR relevance**: Why this matters strategically to HR operations and technology
3. **Conversation starter**: Sophisticated discovery question showing business understanding
4. **Source context**: Surrounding text and document section where found
5. **Confidence**: 1-10 scale (10 = highly confident, direct statement)
6. **Page reference**: Section name or page number if available
7. **Strategic implications**: How this impacts HR technology and process needs

**BUSINESS VALUE FOCUS:**
- Connect each insight to potential HR technology needs
- Identify process optimization opportunities
- Highlight compliance and risk management implications
- Show understanding of operational complexity
- Demonstrate awareness of strategic workforce planning needs

**CONVERSATION STARTER QUALITY:**
Create questions that:
- Show you understand their business context
- Open multiple conversation paths
- Demonstrate knowledge of HR challenges in their industry
- Connect business strategy to people strategy
- Invite them to share more about their current state

**REQUIRED JSON OUTPUT:**
Respond with ONLY this JSON structure:

{
  "summary": "Comprehensive executive summary highlighting the most significant HR-relevant insights and strategic implications, incorporating the validated financial context to show business understanding",
  "businessContext": [
    {
      "dataPoint": "Detailed quote or data with full context and supporting metrics",
      "hrRelevance": "Comprehensive explanation of strategic HR implications and operational impact",
      "conversationStarter": "Substantive discovery question that demonstrates business understanding and opens multiple conversation paths",
      "sourceContext": "Surrounding text and section context where this insight was extracted from",
      "confidence": 8,
      "pageReference": "Page number or section name where found",
      "strategicImplications": "How this impacts HR technology needs and process requirements"
    }
  ],
  "workforceInsights": [
    {
      "dataPoint": "Specific workforce data or trend with exact numbers/percentages",
      "hrRelevance": "Why this workforce insight matters for HR strategy and operations",
      "conversationStarter": "Discovery question that shows understanding of workforce challenges",
      "sourceContext": "Document section and surrounding context",
      "confidence": 9,
      "pageReference": "Where this was found in the document",
      "strategicImplications": "Technology and process implications for HR"
    }
  ],
  "operationalChallenges": [
    {
      "dataPoint": "Specific operational challenge or compliance requirement",
      "hrRelevance": "How this operational challenge impacts HR processes and technology",
      "conversationStarter": "Question that explores current state and pain points",
      "sourceContext": "Source section and context",
      "confidence": 7,
      "pageReference": "Document location",
      "strategicImplications": "Process optimization and technology needs"
    }
  ],
  "strategicPeopleInitiatives": [
    {
      "dataPoint": "Strategic initiative with budget/timeline/targets if mentioned",
      "hrRelevance": "Strategic significance for HR transformation and technology",
      "conversationStarter": "Forward-looking question about strategic initiatives",
      "sourceContext": "Strategic section context",
      "confidence": 8,
      "pageReference": "Strategic plan or initiative section",
      "strategicImplications": "Future-state HR technology and capability requirements"
    }
  ],
  "extractionQuality": {
    "overallConfidence": "high" | "medium" | "low",
    "dataCompleteness": "complete" | "partial" | "limited",
    "validationConcerns": ["list any concerns about data quality or extraction"],
    "recommendedFollowUp": ["list areas needing clarification in discovery call"]
  }
}

**QUALITY STANDARDS:**
- Prioritize insights with specific metrics and dollar amounts
- Focus on insights most relevant to HR technology and process optimization
- Ensure conversation starters are sophisticated and business-focused
- Maintain high confidence levels by sticking to explicit statements
- Connect all insights to potential Dayforce solution areas where relevant

Extract insights that demonstrate deep business understanding and create compelling talking points for an HR technology discovery conversation.`;

export async function generateHRInsights(
  filePath: string,
  financialContext: FinancialMetrics,
): Promise<HRInsights> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2, // Slightly higher for more creative conversation starters
        topP: 0.9,
      },
    });

    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Build rich financial context string
    const revenueStr = financialContext.revenue.current
      ? `${financialContext.revenue.current} ${financialContext.revenue.currency}${financialContext.revenue.growth ? ` (${financialContext.revenue.growth} growth)` : ""}`
      : "Not available";

    const profitStr = financialContext.profitLoss.amount
      ? `${financialContext.profitLoss.amount} ${financialContext.profitLoss.type}${financialContext.profitLoss.margin ? ` (${financialContext.profitLoss.margin} margin)` : ""}`
      : "Not available";

    const employeesStr = financialContext.employees.total
      ? `${financialContext.employees.total.toLocaleString()}${financialContext.employees.growth ? ` (${financialContext.employees.growth} growth)` : ""}`
      : "Not available";

    const assetsStr = financialContext.assets.total
      ? `${financialContext.assets.total} ${financialContext.assets.currency}`
      : "Not available";

    // Calculate revenue per employee if we have both metrics
    let rpeStr = "Not available";
    if (financialContext.revenue.current && financialContext.employees.total) {
      const revenueNum = parseFloat(
        financialContext.revenue.current.replace(/[^\d.]/g, ""),
      );
      const revenueScale = financialContext.revenue.current.includes("B")
        ? 1000000000
        : financialContext.revenue.current.includes("M")
          ? 1000000
          : 1;
      const totalRevenue = revenueNum * revenueScale;
      const rpe = Math.round(totalRevenue / financialContext.employees.total);
      rpeStr = `$${rpe.toLocaleString()}`;
    }

    // Substitute financial context into prompt
    const contextualPrompt = FOCUSED_HR_ANALYSIS_PROMPT.replace(
      "{{REVENUE}}",
      revenueStr,
    )
      .replace("{{PROFIT}}", profitStr)
      .replace("{{EMPLOYEES}}", employeesStr)
      .replace("{{ASSETS}}", assetsStr)
      .replace("{{RPE}}", rpeStr);

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

    // Enhanced JSON extraction with better error handling
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(
        "No JSON found in HR analysis response:",
        text.substring(0, 500),
      );
      throw new Error("No JSON found in HR analysis response");
    }

    let hrInsights;
    try {
      hrInsights = JSON.parse(jsonMatch[0]) as HRInsights;
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("Raw JSON string:", jsonMatch[0].substring(0, 500));
      throw new Error("Invalid JSON in HR analysis response");
    }

    // Enhanced validation with specific error reporting
    const requiredFields = [
      "summary",
      "businessContext",
      "workforceInsights",
      "operationalChallenges",
      "strategicPeopleInitiatives",
    ];
    for (const field of requiredFields) {
      if (!hrInsights[field as keyof HRInsights]) {
        console.warn(`Missing required field in HR insights: ${field}`);
      }
    }

    // Validate array fields
    const arrayFields = [
      "businessContext",
      "workforceInsights",
      "operationalChallenges",
      "strategicPeopleInitiatives",
    ];
    for (const field of arrayFields) {
      if (!Array.isArray(hrInsights[field as keyof HRInsights])) {
        console.warn(`Invalid array field in HR insights: ${field}`);
        (hrInsights as any)[field] = [];
      }
    }

    // Set defaults for missing extractionQuality
    if (!hrInsights.extractionQuality) {
      hrInsights.extractionQuality = {
        overallConfidence: "medium",
        dataCompleteness: "partial",
        validationConcerns: [],
        recommendedFollowUp: [],
      };
    }

    return hrInsights;
  } catch (error) {
    console.error("HR analysis failed:", error);
    throw new Error(
      `Failed to generate HR insights: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
