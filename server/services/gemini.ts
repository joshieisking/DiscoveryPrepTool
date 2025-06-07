import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface HRInsight {
  dataPoint: string;
  hrRelevance: string;
  conversationStarter: string;
}

export interface HRAnalysisResult {
  summary: string;
  businessContext: HRInsight[];
  workforceInsights: HRInsight[];
  operationalChallenges: HRInsight[];
  strategicPeopleInitiatives: HRInsight[];
}

const HR_ANALYSIS_PROMPT = `You are analyzing an annual report to help a solution advisor prepare for a comprehensive discovery call with an HR leader. Your goal is to extract detailed insights that demonstrate deep business understanding and provide rich conversational material that positions the solution advisor as a knowledgeable business partner.

ANALYSIS APPROACH:
- Provide comprehensive, detailed analysis with multiple supporting data points
- Include direct quotes and specific metrics wherever possible
- Give rich context that helps the solution advisor understand the "story behind the numbers"
- Focus on insights that reveal strategic priorities, operational challenges, and growth opportunities
- Create substantial talking points that can sustain meaningful business conversations

From this annual report, extract and organize information into these 4 categories:

**BUSINESS CONTEXT:**
- Revenue growth rate, trajectory, and underlying performance drivers
- Geographic expansion plans, new market strategies, or international presence
- Major acquisitions, divestitures, restructuring initiatives, or strategic pivots
- Overall business strategy, competitive positioning, and key priorities
- Financial performance indicators that impact workforce investment capacity

**WORKFORCE INSIGHTS:**
- Total employee count, growth/reduction trends, and workforce composition
- Geographic distribution of employees and regional talent strategies
- Specific talent challenges, skill gaps, hiring priorities, or recruitment focus areas
- Retention rates, turnover concerns, employee engagement metrics, or satisfaction initiatives
- Diversity, equity & inclusion programs, workforce demographics, or cultural initiatives
- Remote work policies, workplace transformation, or hybrid work strategies

**OPERATIONAL CHALLENGES:**
- Regulatory compliance requirements, changes in labor laws, or data privacy obligations
- Technology transformation initiatives, digital modernization, or system upgrades
- Cost reduction programs, efficiency initiatives, or operational optimization efforts
- Industry-specific pressures, market disruptions, or competitive challenges
- Supply chain, vendor management, or third-party relationship complexities
- Risk management considerations that impact workforce planning

**STRATEGIC PEOPLE INITIATIVES:**
- ESG commitments, sustainability goals, or corporate responsibility programs affecting workforce
- Learning & development investments, upskilling programs, or capability building initiatives
- Culture change programs, employee experience improvements, or engagement strategies
- Leadership development, succession planning, or talent pipeline initiatives
- Performance management evolution, compensation strategy changes, or benefits enhancements
- Innovation programs, digital adoption, or change management initiatives

DETAILED OUTPUT REQUIREMENTS:

For each insight found, provide:

1. **Comprehensive Data Point**: Include specific quotes, metrics, percentages, dollar amounts, timelines, and contextual details. When multiple related data points exist, include them all to paint a complete picture.

2. **Detailed HR Relevance**: Provide a thorough explanation of why this matters to HR, including:
   - Strategic implications for workforce planning
   - Operational impact on HR processes and systems
   - Potential challenges or opportunities this creates
   - Connection to broader HR transformation needs

3. **Substantive Conversation Starter**: Create thoughtful, multi-layered questions that:
   - Demonstrate deep understanding of their business
   - Connect financial/operational realities to HR challenges
   - Open multiple conversation paths
   - Position the solution advisor as a strategic partner
   - Allow for follow-up questions and deeper exploration

QUALITY STANDARDS:
- Each insight should provide enough detail for a 3-5 minute conversation
- Include multiple angles and perspectives per category when data supports it
- Ensure insights reveal both challenges and opportunities
- Focus on areas where comprehensive HR technology platforms typically add value
- Prioritize insights that suggest scale, complexity, or transformation needs

If certain categories have limited relevant information, provide what's available but note the gaps.

Target areas include: HR administration and operations, global payroll management, workforce scheduling and optimization, talent acquisition and management, employee learning and development programs, people analytics and reporting capabilities, regulatory compliance and risk management, employee experience and engagement platforms.

Please respond in valid JSON format with this structure:
{
  "summary": "Comprehensive executive summary highlighting the most significant HR-relevant insights and strategic implications",
  "businessContext": [
    {
      "dataPoint": "Detailed quote or data with full context and supporting metrics",
      "hrRelevance": "Comprehensive explanation of strategic HR implications and operational impact",
      "conversationStarter": "Substantive discovery question that demonstrates business understanding and opens multiple conversation paths"
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
