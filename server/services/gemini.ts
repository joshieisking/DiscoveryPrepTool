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

**CRITICAL FINANCIAL EXTRACTION REQUIREMENTS:**

Before analyzing HR insights, you must first extract and validate ALL financial metrics with extreme precision. Use these rules:

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
    }
  }
}

**HR ANALYSIS CATEGORIES:**
After completing financial extraction, proceed with the four main categories:

**BUSINESS CONTEXT:**
- Use the validated financial metrics above for revenue growth and profit analysis
- Include total assets and employee count with precise numbers
- Geographic expansion or new market plans with investment amounts
- Geographic revenue breakdown by region/market (with percentages or amounts)
- Major acquisitions, divestitures, or restructuring with financial impact
- Overall business strategy and priorities with budget allocations

**WORKFORCE INSIGHTS:**
- Total employee count and growth/reduction trends (include exact current and previous year headcount)
- Calculate revenue per employee using validated financial data
- Geographic distribution of employees (with specific percentages or numbers by region)
- Specific talent challenges, skill gaps, or hiring priorities mentioned
- Retention, turnover, or employee engagement issues (include specific percentages/scores)
- Diversity, equity & inclusion initiatives or workforce demographics (with specific metrics)
- Compensation and benefits costs as percentage of revenue (if mentioned)

**OPERATIONAL CHALLENGES:**
- Regulatory compliance requirements or changes (especially labor laws, data privacy)
- Technology transformation or digital initiatives (with investment amounts if mentioned)
- Cost reduction or efficiency programs (include specific dollar amounts or percentages)
- Industry-specific operational pressures
- Workforce-related operational costs and optimization opportunities

**STRATEGIC PEOPLE INITIATIVES:**
- ESG or sustainability workforce commitments (with specific targets or investments)
- Remote work, hybrid, or workplace transformation strategy with budget allocations
- Learning & development or upskilling investments (include specific dollar amounts)
- Culture change or employee experience initiatives (with metrics if available)
- People analytics and technology investments mentioned

**ENHANCED DATA EXTRACTION INSTRUCTIONS:**

For each insight found, provide:
1. The specific data point or quote (prioritize exact numbers, percentages, and dollar amounts)
2. A comprehensive "why this matters to HR" explanation connecting to business impact
3. A sophisticated conversation starter that demonstrates deep business understanding
4. Source context (the surrounding text/section where this insight was found)
5. Confidence level (1-10 scale, where 10 is highly confident in accuracy)
6. Page reference if available (e.g., "Page 15", "Executive Summary")
7. Strategic implications for HR technology and process optimization

**FINAL JSON STRUCTURE:**
Respond with this complete structure:

{
  "financialMetrics": { /* as defined above */ },
  "summary": "Comprehensive executive summary highlighting the most significant HR-relevant insights and strategic implications, incorporating validated financial context",
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
  "workforceInsights": [...],
  "operationalChallenges": [...],
  "strategicPeopleInitiatives": [...],
  "extractionQuality": {
    "overallConfidence": "high" | "medium" | "low",
    "dataCompleteness": "complete" | "partial" | "limited",
    "validationConcerns": ["list of any concerns"],
    "recommendedFollowUp": ["list of areas needing clarification"]
  }
}

**SPECIAL HANDLING FOR EDGE CASES:**
- If financial data is presented in narrative form ("revenue grew significantly"), extract the context and mark confidence as "low"
- If multiple currency units are present, standardize to primary reporting currency
- If fiscal year differs from calendar year, note this in the source context
- If pro forma vs GAAP numbers are mentioned, prioritize GAAP and note the difference
- For companies with segments, extract consolidated figures first, then segment breakdowns

Focus on insights related to HR administration, payroll operations, workforce scheduling and management, talent acquisition and development, employee learning programs, people analytics and reporting, and regulatory compliance - areas typically addressed by comprehensive HR technology platforms.`;

function findBalancedJSON(text: string): string | null {
  let braceCount = 0;
  let start = -1;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (start === -1) start = i;
      braceCount++;
    } else if (text[i] === '}') {
      braceCount--;
      if (braceCount === 0 && start !== -1) {
        return text.substring(start, i + 1);
      }
    }
  }
  return null;
}

function sanitizeJSON(jsonStr: string): string {
  return jsonStr
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* comments */
    .replace(/\/\/.*$/gm, '')         // Remove // comments
    .replace(/,(\s*[}\]])/g, '$1')    // Remove trailing commas
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys
}

function extractJSONRobust(text: string): string {
  const strategies = [
    // Strategy 1: Code block extraction
    () => {
      const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      return codeBlockMatch ? codeBlockMatch[1] : null;
    },
    
    // Strategy 2: Balanced brace detection
    () => findBalancedJSON(text),
    
    // Strategy 3: Original regex with sanitization
    () => {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? sanitizeJSON(match[0]) : null;
    },
    
    // Strategy 4: Find largest JSON-like block
    () => {
      const matches = text.match(/\{[\s\S]*?\}/g);
      if (matches) {
        return matches.reduce((longest, current) => 
          current.length > longest.length ? current : longest
        );
      }
      return null;
    }
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      const jsonString = strategies[i]();
      if (jsonString) {
        // Test if it's valid JSON
        JSON.parse(jsonString);
        return jsonString;
      }
    } catch (error) {
      console.warn(`JSON extraction strategy ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  // Log raw response for debugging
  console.error('All JSON extraction strategies failed. Raw response preview:', text.substring(0, 500));
  throw new Error("Unable to extract valid JSON from Gemini response");
}

function validateResponse(parsed: any): HRAnalysisResult {
  // Ensure required fields exist with defaults
  const result = {
    summary: parsed.summary || 'Analysis unavailable',
    businessContext: Array.isArray(parsed.businessContext) ? parsed.businessContext : [],
    workforceInsights: Array.isArray(parsed.workforceInsights) ? parsed.workforceInsights : [],
    operationalChallenges: Array.isArray(parsed.operationalChallenges) ? parsed.operationalChallenges : [],
    strategicPeopleInitiatives: Array.isArray(parsed.strategicPeopleInitiatives) ? parsed.strategicPeopleInitiatives : []
  };
  
  return result as HRAnalysisResult;
}

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

    // Extract JSON using robust multi-strategy approach
    const jsonString = extractJSONRobust(text);
    const parsedResult = JSON.parse(jsonString);
    const analysisResult = validateResponse(parsedResult);

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
