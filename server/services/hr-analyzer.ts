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

// REPLACE THE ENTIRE PROMPT WITH THIS ENHANCED VERSION
const ENHANCED_HR_ANALYSIS_PROMPT = `You are a senior HR technology consultant with 15+ years of experience analyzing Fortune 500 companies. You're preparing a presales consultant for a high-stakes discovery call with a CHRO or VP of HR. Your analysis must demonstrate sophisticated business understanding that positions the consultant as a trusted strategic advisor.

**VALIDATED FINANCIAL CONTEXT:**
- Revenue: {{REVENUE}}
- Profit/Loss: {{PROFIT}}
- Employees: {{EMPLOYEES}}
- Assets: {{ASSETS}}
- Revenue per Employee: {{RPE}}

**CRITICAL SUCCESS CRITERIA:**
Your insights must help the consultant:
1. Open conversations about strategic business challenges (not just HR processes)
2. Demonstrate understanding of industry dynamics and competitive pressures
3. Connect financial performance directly to HR technology needs
4. Position advanced HR technology as a competitive advantage
5. Create urgency around strategic people initiatives

**ANALYSIS METHODOLOGY:**

**BUSINESS CONTEXT INSIGHTS (Target: 3-5 high-impact insights)**
Focus on strategic business factors that create HR technology urgency:

*Required Elements:*
- Quantified business impacts (revenue, cost, efficiency metrics)
- Geographic or market expansion complexity requiring workforce scaling
- M&A activity creating integration challenges
- Competitive pressures requiring talent differentiation
- Digital transformation creating new skill requirements
- Regulatory changes creating compliance complexity

*Confidence Scoring:*
- 9-10: Direct financial data with explicit HR implications
- 7-8: Clear business trends with logical HR connections  
- 5-6: Implied connections requiring industry knowledge
- Below 5: Don't include (insufficient confidence for client meeting)

**WORKFORCE INSIGHTS (Target: 4-6 quantified insights)**
Extract specific people metrics that demonstrate scale and complexity:

*Priority Data Points:*
- Employee headcount growth rates and geographic distribution
- Specific hiring challenges, skill gaps, or retention issues (with numbers)
- Compensation costs as % of revenue and regional variations
- DEI metrics, targets, and program investments
- Remote/hybrid workforce distribution and management challenges
- Learning & development spending and effectiveness metrics

**OPERATIONAL CHALLENGES (Target: 3-4 technology-addressable challenges)**
Identify specific operational pain points requiring HR technology:

*Focus Areas:*
- Manual processes causing errors or delays
- Compliance requirements creating administrative burden
- Data integration challenges across HR systems
- Reporting and analytics limitations
- Employee experience gaps affecting engagement
- Global operations complexity requiring standardization

**STRATEGIC PEOPLE INITIATIVES (Target: 2-4 forward-looking initiatives)**
Extract technology-enabled strategic initiatives:

*Investment Areas:*
- People analytics and workforce planning investments
- Employee experience transformation programs
- Skills transformation and reskilling initiatives
- ESG and sustainability workforce commitments
- HR technology modernization projects
- Performance management evolution

**ENHANCED CONVERSATION STARTER FRAMEWORK:**

*Tier 1 (Strategic Business Questions):*
"Given your [specific business context], how is [specific people challenge] impacting your ability to [achieve business objective]?"

*Tier 2 (Operational Efficiency Questions):*
"With [specific operational complexity], what processes are creating the biggest bottlenecks in [specific HR function]?"

*Tier 3 (Technology Enablement Questions):*
"As you scale [specific initiative], what data and integration capabilities do you need to [achieve specific outcome]?"

**CONFIDENCE CALIBRATION:**
- **9-10**: Direct quotes with specific numbers/percentages/dollar amounts
- **7-8**: Clear statements with implied quantitative impact  
- **6-7**: Industry context supporting logical inferences
- **5-6**: Reasonable assumptions based on company profile
- **Below 5**: Exclude from output (insufficient for client conversation)

**REQUIRED JSON OUTPUT:**
{
  "summary": "Executive summary connecting financial performance to strategic HR technology needs, highlighting 2-3 most compelling business drivers and quantified opportunities for operational improvement",
  "businessContext": [
    {
      "dataPoint": "Specific business metric, expansion plan, or strategic initiative with quantified impact (revenue, markets, timeline, investment)",
      "hrRelevance": "Strategic HR implications requiring technology enablement, including process complexity, compliance requirements, and scale challenges",
      "conversationStarter": "Sophisticated question demonstrating business understanding and connecting business strategy to people strategy challenges",
      "sourceContext": "Document section and surrounding text providing full context",
      "confidence": 8,
      "pageReference": "Specific section, page, or document area",
      "strategicImplications": "Technology requirements and Dayforce capability alignment for addressing strategic business needs"
    }
  ],
  "workforceInsights": [
    {
      "dataPoint": "Quantified workforce data (headcount, growth, costs, metrics) with specific numbers and percentages",
      "hrRelevance": "Operational impact on HR processes, technology requirements, and business efficiency",
      "conversationStarter": "Question exploring current state challenges and operational inefficiencies",
      "sourceContext": "Source section with supporting data context",
      "confidence": 9,
      "pageReference": "Document location reference",
      "strategicImplications": "Process optimization opportunities and technology automation needs"
    }
  ],
  "operationalChallenges": [
    {
      "dataPoint": "Specific operational challenge with business impact (costs, risks, inefficiencies)",
      "hrRelevance": "Technology solution opportunities and process improvement potential",
      "conversationStarter": "Question exploring pain points and current solution limitations",
      "sourceContext": "Challenge description and business impact context",
      "confidence": 7,
      "pageReference": "Document section reference",
      "strategicImplications": "Automation opportunities and system integration requirements"
    }
  ],
  "strategicPeopleInitiatives": [
    {
      "dataPoint": "Forward-looking initiative with investment, timeline, or success metrics",
      "hrRelevance": "Technology enablement requirements for achieving strategic objectives",
      "conversationStarter": "Future-state question about capabilities and implementation approach",
      "sourceContext": "Strategic initiative context and supporting details",
      "confidence": 8,
      "pageReference": "Strategic section or initiative description",
      "strategicImplications": "Future technology capabilities and platform requirements"
    }
  ],
  "extractionQuality": {
    "overallConfidence": "high" | "medium" | "low",
    "dataCompleteness": "complete" | "partial" | "limited", 
    "validationConcerns": ["Specific data quality or interpretation concerns"],
    "recommendedFollowUp": ["Specific discovery questions to validate assumptions and gather missing data"]
  }
}

**MINIMUM STANDARDS:**
- Each category must have at least 2 insights with confidence ≥ 7
- All conversation starters must be open-ended and multi-layered
- Every insight must connect to quantified business impact
- Source context must provide sufficient detail for validation
- Strategic implications must reference specific Dayforce capabilities

Extract insights that transform your consultant from vendor to strategic advisor through sophisticated business understanding and quantified value articulation.`;

// ADD THIS NEW VALIDATION FUNCTION
function validateHRInsights(insights: any): HRInsights {
  const validated: HRInsights = {
    summary:
      insights.summary || "Analysis completed with limited insights available.",
    businessContext: [],
    workforceInsights: [],
    operationalChallenges: [],
    strategicPeopleInitiatives: [],
    extractionQuality: {
      overallConfidence: "medium",
      dataCompleteness: "partial",
      validationConcerns: [],
      recommendedFollowUp: [],
    },
  };

  // Validate and filter insights by confidence threshold
  const categories = [
    "businessContext",
    "workforceInsights",
    "operationalChallenges",
    "strategicPeopleInitiatives",
  ];

  categories.forEach((category) => {
    if (Array.isArray(insights[category])) {
      validated[category as keyof HRInsights] = insights[category]
        .filter((insight: any) => {
          // Quality gates
          const hasDataPoint =
            insight.dataPoint && insight.dataPoint.length > 50;
          const hasConfidence = insight.confidence && insight.confidence >= 7;
          const hasConversationStarter =
            insight.conversationStarter &&
            insight.conversationStarter.length > 100;
          const hasStrategicImplications =
            insight.strategicImplications &&
            insight.strategicImplications.length > 50;

          if (
            !hasDataPoint ||
            !hasConfidence ||
            !hasConversationStarter ||
            !hasStrategicImplications
          ) {
            console.warn(`Filtering low-quality insight in ${category}:`, {
              hasDataPoint,
              hasConfidence,
              hasConversationStarter,
              hasStrategicImplications,
              confidence: insight.confidence,
            });
            return false;
          }

          return true;
        })
        .map((insight: any) => ({
          dataPoint: insight.dataPoint,
          hrRelevance: insight.hrRelevance || "HR relevance not specified",
          conversationStarter: insight.conversationStarter,
          sourceContext:
            insight.sourceContext || "Source context not available",
          confidence: Math.min(Math.max(insight.confidence, 1), 10),
          pageReference:
            insight.pageReference || "Page reference not available",
          strategicImplications: insight.strategicImplications,
        }));
    }
  });

  // Set overall confidence based on insight quality
  const totalInsights =
    validated.businessContext.length +
    validated.workforceInsights.length +
    validated.operationalChallenges.length +
    validated.strategicPeopleInitiatives.length;

  const avgConfidence =
    totalInsights > 0
      ? [
          ...validated.businessContext,
          ...validated.workforceInsights,
          ...validated.operationalChallenges,
          ...validated.strategicPeopleInitiatives,
        ].reduce((sum, insight) => sum + insight.confidence, 0) / totalInsights
      : 0;

  validated.extractionQuality = {
    overallConfidence:
      avgConfidence >= 8 ? "high" : avgConfidence >= 6 ? "medium" : "low",
    dataCompleteness:
      totalInsights >= 10
        ? "complete"
        : totalInsights >= 5
          ? "partial"
          : "limited",
    validationConcerns:
      totalInsights < 5
        ? ["Limited insights extracted - document may lack HR-specific content"]
        : [],
    recommendedFollowUp:
      totalInsights < 8
        ? [
            "Validate key business metrics",
            "Explore specific HR challenges",
            "Discuss technology roadmap",
          ]
        : [],
  };

  return validated;
}

// REPLACE THE EXISTING generateHRInsights FUNCTION WITH THIS ENHANCED VERSION
export async function generateHRInsights(
  filePath: string,
  financialContext: FinancialMetrics,
  maxRetries = 3,
): Promise<HRInsights> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`HR analysis attempt ${attempt}/${maxRetries}`);

      // ENHANCED MODEL CONFIGURATION
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1, // Lower for more consistent output
          topP: 0.8, // More focused responses
          topK: 40, // Limit token selection
          maxOutputTokens: 8192, // Ensure complete responses
          responseMimeType: "application/json", // Force JSON output
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
      if (
        financialContext.revenue.current &&
        financialContext.employees.total
      ) {
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

      // Substitute financial context into enhanced prompt
      const contextualPrompt = ENHANCED_HR_ANALYSIS_PROMPT.replace(
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

      let rawInsights;
      try {
        rawInsights = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        console.error("Raw JSON string:", jsonMatch[0].substring(0, 500));
        throw new Error("Invalid JSON in HR analysis response");
      }

      // APPLY VALIDATION AND QUALITY FILTERING
      const hrInsights = validateHRInsights(rawInsights);

      // Check if we have enough quality insights
      const totalInsights =
        hrInsights.businessContext.length +
        hrInsights.workforceInsights.length +
        hrInsights.operationalChallenges.length +
        hrInsights.strategicPeopleInitiatives.length;

      if (totalInsights >= 5 || attempt === maxRetries) {
        console.log(
          `HR analysis completed with ${totalInsights} validated insights`,
        );
        return hrInsights;
      }

      console.warn(
        `Attempt ${attempt} returned only ${totalInsights} validated insights, retrying...`,
      );
    } catch (error) {
      lastError = error as Error;
      console.error(`HR analysis attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Progressive backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw lastError!;
}
