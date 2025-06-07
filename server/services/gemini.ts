import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';

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

const HR_ANALYSIS_PROMPT = `You are analyzing an annual report to help a solution advisor prepare for a discovery call with an HR leader. Extract key insights that demonstrate business understanding and create talking points.

From this annual report, extract and organize information into these 4 categories:

**BUSINESS CONTEXT:**
- Revenue growth rate and trajectory
- Geographic expansion or new market plans
- Major acquisitions, divestitures, or restructuring
- Overall business strategy and priorities

**WORKFORCE INSIGHTS:**
- Total employee count and growth/reduction trends
- Geographic distribution of employees
- Specific talent challenges, skill gaps, or hiring priorities mentioned
- Retention, turnover, or employee engagement issues
- Diversity, equity & inclusion initiatives or workforce demographics

**OPERATIONAL CHALLENGES:**
- Regulatory compliance requirements or changes (especially labor laws, data privacy)
- Technology transformation or digital initiatives
- Cost reduction or efficiency programs
- Industry-specific operational pressures

**STRATEGIC PEOPLE INITIATIVES:**
- ESG or sustainability workforce commitments
- Remote work, hybrid, or workplace transformation strategy
- Learning & development or upskilling investments
- Culture change or employee experience initiatives

For each insight found, provide:
1. The specific data point or quote
2. A brief "why this matters to HR" explanation
3. A suggested conversation starter for the discovery call

If certain categories have no relevant information, simply note "No specific insights found."

Focus on insights related to HR administration, payroll operations, workforce scheduling and management, talent acquisition and development, employee learning programs, people analytics and reporting, and regulatory compliance - areas typically addressed by comprehensive HR technology platforms.

Please respond in valid JSON format with this structure:
{
  "summary": "Brief executive summary",
  "businessContext": [
    {
      "dataPoint": "Specific quote or data",
      "hrRelevance": "Why this matters to HR",
      "conversationStarter": "Suggested discovery question"
    }
  ],
  "workforceInsights": [...],
  "operationalChallenges": [...],
  "strategicPeopleInitiatives": [...]
}`;

export async function analyzeDocumentWithGemini(filePath: string): Promise<HRAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Read the file as base64
    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    // Determine MIME type based on file extension
    const mimeType = filePath.toLowerCase().endsWith('.pdf') 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const result = await model.generateContent([
      HR_ANALYSIS_PROMPT,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean the response to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }

    const analysisResult = JSON.parse(jsonMatch[0]) as HRAnalysisResult;
    
    // Validate the structure
    if (!analysisResult.summary || 
        !Array.isArray(analysisResult.businessContext) ||
        !Array.isArray(analysisResult.workforceInsights) ||
        !Array.isArray(analysisResult.operationalChallenges) ||
        !Array.isArray(analysisResult.strategicPeopleInitiatives)) {
      throw new Error('Invalid analysis structure from Gemini');
    }

    return analysisResult;

  } catch (error) {
    console.error('Error analyzing document with Gemini:', error);
    throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}