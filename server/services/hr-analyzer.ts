import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface HRInsight {
  dataPoint: string;
  hrRelevance: string;
  conversationStarter: string;
  sourceContext: string;
  confidence: number;
  pageReference: string;
  strategicImplications: string;
  industryContext: string;
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
    industryIdentified: string;
    documentType: string;
  };
}

const FOCUSED_HR_ANALYSIS_PROMPT = `You are an expert HR technology consultant analyzing an annual report to prepare for a discovery call with an HR leader. Your goal is to extract actionable insights that demonstrate deep business understanding and industry expertise.

**CRITICAL EXTRACTION REQUIREMENTS:**
- **EXTRACT AT LEAST 3-5 INSIGHTS FOR EACH CATEGORY** (businessContext, workforceInsights, operationalChallenges, strategicPeopleInitiatives)
- If fewer than 3 direct insights exist for any category, expand your analysis to include:
  * Related trends and implications mentioned elsewhere in the document
  * Industry context and comparative insights you can infer
  * Secondary challenges or opportunities that connect to the category
  * Strategic implications derived from financial or operational data
- **PRIORITIZE ACTIONABLE INSIGHTS** that help presales consultants demonstrate deep business understanding
- **MINE DEEPER** - look beyond obvious statements to find nuanced business intelligence

**MANDATORY OUTPUT FORMAT:**
- All insights must include specific quotes with exact context
- Industry context required for every conversation starter
- Page/section references must be specific and accurate
- Source context must include 2-3 sentences surrounding the key insight

**INDUSTRY IDENTIFICATION:**
First identify the company's primary industry from: Technology, Healthcare, Financial Services, Manufacturing, Retail, Energy, Transportation, Professional Services, Government, Education, Other.

**UPDATED CONFIDENCE SCORING RULES:**
- **HIGH (6-10)**: Clear statements with metrics, strategic mentions, or well-supported insights from document data
- **MEDIUM (4-5)**: Implied references, contextual insights, or interpretive analysis with document support
- **LOW (1-3)**: Speculative insights requiring significant assumption but still valuable for conversation

**CONVERSATION STARTER QUALITY FRAMEWORK:**
Each conversation starter must demonstrate:
- **Business Impact Focus**: Connect to efficiency, cost reduction, compliance, or revenue impact
- **Industry Expertise**: Reference sector-specific HR challenges and best practices
- **Strategic Depth**: Go beyond basic questions to explore strategic implications
- **Multiple Conversation Paths**: Open 2-3 different discussion areas
- **Trusted Advisor Positioning**: Show understanding of their business context and industry pressures

**HR ANALYSIS CATEGORIES - EXTRACT 3-5 INSIGHTS EACH:**

**1. BUSINESS CONTEXT INSIGHTS (Target: 3-5 insights):**
Extract business factors that directly impact HR strategy and operations:
- Geographic expansion, acquisitions, or market entry affecting workforce planning
- Competitive pressures requiring specific talent strategies or skill transformations
- Business model changes impacting organizational structure and capabilities
- Market positioning and customer segments driving workforce requirements
- Regulatory environment changes affecting compliance and operations
- Economic factors influencing talent costs and availability
- Revenue growth patterns indicating scaling needs
- Digital transformation initiatives affecting workforce skills

**2. WORKFORCE INSIGHTS (Target: 3-5 insights):**
Extract specific people-related data, trends, and strategic workforce information:
- Employee count trends, geographic distribution, and demographic data
- Retention rates, turnover metrics, or engagement scores (specific percentages)
- Talent acquisition challenges, skill gaps, or hiring priorities with timelines
- Compensation costs as percentage of revenue or specific benefits investments
- Diversity, equity & inclusion metrics, targets, or strategic commitments
- Workforce transformation needs, reskilling initiatives, or capability gaps
- Performance management changes or talent development investments
- Remote work adoption and workplace flexibility initiatives

**3. OPERATIONAL CHALLENGES (Target: 3-5 insights):**
Identify operational complexities that HR technology and processes must address:
- Regulatory compliance requirements (labor laws, data privacy, safety standards)
- Technology infrastructure changes affecting workforce management
- Cost optimization programs impacting people operations and efficiency
- Global operations complexity requiring standardized HR processes
- Remote work, hybrid workplace, or location strategy changes
- Industry-specific operational pressures affecting HR administration
- Integration challenges from acquisitions or system consolidations
- Supply chain or operational efficiency initiatives affecting workforce

**4. STRATEGIC PEOPLE INITIATIVES (Target: 3-5 insights):**
Extract forward-looking HR strategic priorities and transformation plans:
- Culture transformation programs with specific goals and timelines
- Leadership development, succession planning, or executive initiatives
- Employee experience improvements or workplace innovation programs
- Learning & development investments with budget allocations
- People analytics initiatives or HR technology transformation plans
- ESG commitments affecting workforce strategy and reporting
- Performance management evolution or talent strategy changes
- Innovation and R&D initiatives requiring specialized talent

**ENHANCED EXTRACTION STRATEGIES:**
If struggling to find 3-5 insights per category:
1. **Financial Analysis**: Derive workforce implications from revenue, costs, and growth metrics
2. **Geographic Analysis**: Extract insights from international operations and expansion plans
3. **Competitive Analysis**: Infer HR challenges from market position statements
4. **Risk Analysis**: Convert business risks into people and operational challenges
5. **Strategic Analysis**: Transform business strategy into people initiative implications
6. **Industry Context**: Add relevant industry-specific insights based on identified sector

**SOURCE ATTRIBUTION REQUIREMENTS:**
For each insight provide:
- **Exact Quote**: Direct text from document with specific metrics when available
- **Context Radius**: 2-3 sentences before and after the key insight
- **Document Location**: Specific page number, section name, or document hierarchy
- **Source Quality**: Note if from CEO letter, strategy section, footnotes, etc.

**INDUSTRY-SPECIFIC CONTEXT EXAMPLES:**
- **Technology**: Focus on talent competition, remote work policies, rapid scaling, innovation culture
- **Healthcare**: Emphasize compliance, safety, staffing shortages, regulatory changes
- **Manufacturing**: Highlight safety, skills training, operational efficiency, union relations
- **Financial Services**: Stress compliance, risk management, regulatory scrutiny, digital transformation
- **Retail**: Address seasonal workforce, customer service, location management, automation impact

**REQUIRED JSON OUTPUT:**
Respond with ONLY this JSON structure with 3-5 insights per array:

{
  "summary": "Executive summary highlighting 4-6 most significant HR insights with clear business implications and strategic context",
  "businessContext": [
    {
      "dataPoint": "Direct quote with full context and specific metrics or strategic statements",
      "hrRelevance": "Detailed explanation of why this matters strategically for HR operations and technology",
      "conversationStarter": "Industry-aware discovery question that demonstrates business understanding and opens multiple conversation paths",
      "sourceContext": "2-3 sentences of surrounding text showing where this insight was found",
      "confidence": 7,
      "pageReference": "Specific page number or section name where found",
      "strategicImplications": "How this impacts HR technology needs, process requirements, and strategic priorities",
      "industryContext": "Industry-specific considerations and how this insight relates to sector challenges"
    }
    // Repeat for 3-5 total insights
  ],
  "workforceInsights": [
    {
      "dataPoint": "Specific workforce data, trend, or metric with exact numbers where available",
      "hrRelevance": "Why this workforce insight matters for HR strategy, operations, and technology decisions",
      "conversationStarter": "Industry-informed question that explores workforce challenges and current state",
      "sourceContext": "Document context and surrounding information",
      "confidence": 8,
      "pageReference": "Precise document location",
      "strategicImplications": "Technology and process implications for workforce management",
      "industryContext": "How this workforce insight relates to industry trends and challenges"
    }
    // Repeat for 3-5 total insights
  ],
  "operationalChallenges": [
    {
      "dataPoint": "Specific operational challenge, compliance requirement, or complexity factor",
      "hrRelevance": "How this operational challenge impacts HR processes, technology needs, and efficiency",
      "conversationStarter": "Question that explores current state challenges and pain points with industry awareness",
      "sourceContext": "Source section and contextual information",
      "confidence": 6,
      "pageReference": "Document location and hierarchy",
      "strategicImplications": "Process optimization opportunities and technology requirements",
      "industryContext": "Industry-specific operational considerations and compliance requirements"
    }
    // Repeat for 3-5 total insights
  ],
  "strategicPeopleInitiatives": [
    {
      "dataPoint": "Strategic initiative with budget, timeline, targets, or specific commitments",
      "hrRelevance": "Strategic significance for HR transformation, technology, and future capabilities",
      "conversationStarter": "Forward-looking question about strategic initiatives with industry context",
      "sourceContext": "Strategic section context and supporting information",
      "confidence": 7,
      "pageReference": "Strategic plan or initiative section location",
      "strategicImplications": "Future-state HR technology and capability requirements",
      "industryContext": "How this initiative aligns with industry trends and competitive requirements"
    }
    // Repeat for 3-5 total insights
  ],
  "extractionQuality": {
    "overallConfidence": "high",
    "dataCompleteness": "complete",
    "validationConcerns": ["List any concerns about data quality, consistency, or extraction accuracy"],
    "recommendedFollowUp": ["Specific areas needing clarification in discovery call"],
    "industryIdentified": "Primary industry classification based on business model and operations",
    "documentType": "Annual report, 10-K, investor presentation, etc."
  }
}

**CRITICAL QUALITY STANDARDS:**
1. **MINIMUM QUANTITY**: Each category MUST contain 3-5 insights - no exceptions
2. Extract insights with clear business relevance to HR strategy and operations
3. Prioritize insights with specific metrics, timelines, and dollar amounts where available
4. Ensure all conversation starters include industry-specific context and expertise
5. Use the full confidence range (1-10) to capture more valuable insights
6. Connect insights to potential Dayforce solution areas where relevant and natural
7. Focus on insights that position the consultant as a trusted advisor with deep industry knowledge

**VALIDATION REQUIREMENTS:**
- Cross-reference insights for internal consistency
- Flag any contradictory information within the document
- Note gaps where additional discovery would be valuable
- Identify industry-specific factors that weren't explicitly mentioned but are relevant
- Ensure each category has sufficient depth for meaningful discovery conversations

Extract comprehensive insights that demonstrate sophisticated business understanding and create compelling, industry-informed talking points for an HR technology discovery conversation. Remember: 3-5 insights minimum per category.`;

export async function generateHRInsights(
  filePath: string,
): Promise<HRInsights> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.6, // Increased from 0.2 for more creative and comprehensive extraction
        topP: 0.9,
      },
    });

    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const result = await model.generateContent([
      FOCUSED_HR_ANALYSIS_PROMPT,
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
      "extractionQuality",
    ];

    for (const field of requiredFields) {
      if (!hrInsights[field as keyof HRInsights]) {
        console.warn(`Missing required field in HR insights: ${field}`);
      }
    }

    // Enhanced validation for minimum insight requirements
    const arrayFields = [
      "businessContext",
      "workforceInsights",
      "operationalChallenges",
      "strategicPeopleInitiatives",
    ];

    for (const field of arrayFields) {
      const fieldValue = hrInsights[field as keyof HRInsights];
      if (!Array.isArray(fieldValue)) {
        console.warn(`Invalid array field in HR insights: ${field}`);
        (hrInsights as any)[field] = [];
      } else {
        // Check for minimum insight count
        if (fieldValue.length < 3) {
          console.warn(
            `Insufficient insights in ${field}: ${fieldValue.length} (minimum 3 required)`,
          );
          hrInsights.extractionQuality.validationConcerns.push(
            `${field} contains only ${fieldValue.length} insights (minimum 3 recommended)`,
          );
        }

        // Validate individual insight structure
        (fieldValue as HRInsight[]).forEach((insight, index) => {
          const requiredInsightFields = [
            "dataPoint",
            "hrRelevance",
            "conversationStarter",
            "sourceContext",
            "confidence",
            "pageReference",
            "strategicImplications",
            "industryContext",
          ];

          for (const insightField of requiredInsightFields) {
            if (!insight[insightField as keyof HRInsight]) {
              console.warn(
                `Missing field ${insightField} in ${field}[${index}]`,
              );
            }
          }

          // Validate confidence score with updated ranges
          if (insight.confidence < 1 || insight.confidence > 10) {
            console.warn(
              `Invalid confidence score in ${field}[${index}]: ${insight.confidence}`,
            );
          }
        });
      }
    }

    // Set defaults for missing extractionQuality fields
    if (!hrInsights.extractionQuality) {
      hrInsights.extractionQuality = {
        overallConfidence: "medium",
        dataCompleteness: "partial",
        validationConcerns: [],
        recommendedFollowUp: [],
        industryIdentified: "Unknown",
        documentType: "Unknown",
      };
    } else {
      // Ensure all extractionQuality fields exist
      const qualityDefaults = {
        overallConfidence: "medium" as const,
        dataCompleteness: "partial" as const,
        validationConcerns: [],
        recommendedFollowUp: [],
        industryIdentified: "Unknown",
        documentType: "Unknown",
      };

      for (const [key, defaultValue] of Object.entries(qualityDefaults)) {
        if (
          !hrInsights.extractionQuality[
            key as keyof typeof hrInsights.extractionQuality
          ]
        ) {
          (hrInsights.extractionQuality as any)[key] = defaultValue;
        }
      }
    }

    // Enhanced business logic validation with insight count tracking
    const totalInsights =
      hrInsights.businessContext.length +
      hrInsights.workforceInsights.length +
      hrInsights.operationalChallenges.length +
      hrInsights.strategicPeopleInitiatives.length;

    if (totalInsights === 0) {
      console.warn("No insights extracted from document");
      hrInsights.extractionQuality.validationConcerns.push(
        "No actionable insights found",
      );
    } else if (totalInsights < 12) {
      console.warn(`Low insight count: ${totalInsights} total (target: 12-20)`);
      hrInsights.extractionQuality.validationConcerns.push(
        `Lower than optimal insight count: ${totalInsights} extracted`,
      );
    }

    // Update data completeness based on insight counts
    if (totalInsights >= 15) {
      hrInsights.extractionQuality.dataCompleteness = "complete";
    } else if (totalInsights >= 8) {
      hrInsights.extractionQuality.dataCompleteness = "partial";
    } else {
      hrInsights.extractionQuality.dataCompleteness = "limited";
    }

    // Enhanced logging with per-category breakdown
    console.log(
      `HR Analysis completed: ${totalInsights} total insights extracted`,
    );
    console.log(
      `Breakdown: Business Context: ${hrInsights.businessContext.length}, Workforce: ${hrInsights.workforceInsights.length}, Operational: ${hrInsights.operationalChallenges.length}, Strategic: ${hrInsights.strategicPeopleInitiatives.length}`,
    );
    console.log(
      `Industry identified: ${hrInsights.extractionQuality.industryIdentified}`,
    );
    console.log(
      `Overall confidence: ${hrInsights.extractionQuality.overallConfidence}`,
    );

    return hrInsights;
  } catch (error) {
    console.error("HR analysis failed:", error);
    throw new Error(
      `Failed to generate HR insights: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
