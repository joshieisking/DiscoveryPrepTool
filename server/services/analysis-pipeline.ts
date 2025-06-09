import { extractFinancialMetrics, FinancialMetrics } from "./financial-extractor";
import { generateHRInsights, HRInsights } from "./hr-analyzer";
import { HRAnalysisResult } from "./gemini";

export async function analyzeDocumentPipeline(filePath: string): Promise<HRAnalysisResult> {
  try {
    console.log('Starting multi-stage analysis pipeline...');
    
    // Stage 1: Extract financial metrics
    console.log('Stage 1: Extracting financial metrics...');
    const financialMetrics = await extractFinancialMetrics(filePath);
    console.log('Financial extraction completed');
    
    // Stage 2: Generate HR insights with financial context
    console.log('Stage 2: Generating HR insights...');
    const hrInsights = await generateHRInsights(filePath, financialMetrics);
    console.log('HR analysis completed');
    
    // Stage 3: Merge results into expected format
    console.log('Stage 3: Merging results...');
    const result = mergeResults(financialMetrics, hrInsights);
    console.log('Pipeline completed successfully');
    
    return result;
  } catch (error) {
    console.error('Pipeline stage failed:', error);
    throw error;
  }
}

function mergeResults(financialMetrics: FinancialMetrics, hrInsights: HRInsights): HRAnalysisResult {
  // Create enhanced summary incorporating financial context
  const financialSummary = buildFinancialSummary(financialMetrics);
  const enhancedSummary = financialSummary + " " + hrInsights.summary;
  
  // Add financial context to business insights
  const enhancedBusinessContext = [
    ...createFinancialInsights(financialMetrics),
    ...hrInsights.businessContext
  ];
  
  return {
    summary: enhancedSummary,
    businessContext: enhancedBusinessContext,
    workforceInsights: hrInsights.workforceInsights,
    operationalChallenges: hrInsights.operationalChallenges,
    strategicPeopleInitiatives: hrInsights.strategicPeopleInitiatives
  };
}

function buildFinancialSummary(metrics: FinancialMetrics): string {
  const parts = [];
  
  if (metrics.revenue.current) {
    parts.push(`Revenue of ${metrics.revenue.current} ${metrics.revenue.currency}`);
  }
  
  if (metrics.profit.amount) {
    const profitType = metrics.profit.type === 'loss' ? 'loss' : 'profit';
    parts.push(`${profitType} of ${metrics.profit.amount}`);
  }
  
  if (metrics.employees.total) {
    parts.push(`${metrics.employees.total} employees`);
  }
  
  return parts.length > 0 
    ? `Financial overview: ${parts.join(', ')}.`
    : 'Financial data extraction completed.';
}

function createFinancialInsights(metrics: FinancialMetrics): Array<{
  dataPoint: string;
  hrRelevance: string;
  conversationStarter: string;
  sourceContext?: string;
  confidence?: number;
  pageReference?: string;
}> {
  const insights = [];
  
  // Revenue insight
  if (metrics.revenue.current) {
    insights.push({
      dataPoint: `Current revenue: ${metrics.revenue.current} ${metrics.revenue.currency}`,
      hrRelevance: "Revenue scale indicates potential for workforce expansion and HR infrastructure investment needs.",
      conversationStarter: "How is the current revenue growth trajectory influencing your workforce planning and HR budget allocation?",
      sourceContext: "Financial statements analysis",
      confidence: metrics.revenue.confidence === 'high' ? 9 : 7,
      pageReference: "Financial data extraction"
    });
  }
  
  // Employee count insight
  if (metrics.employees.total) {
    const revenuePerEmployee = metrics.revenue.current && metrics.employees.total 
      ? calculateRevenuePerEmployee(metrics.revenue.current, metrics.employees.total)
      : null;
    
    insights.push({
      dataPoint: `Total workforce: ${metrics.employees.total} employees${revenuePerEmployee ? `, revenue per employee: ${revenuePerEmployee}` : ''}`,
      hrRelevance: "Workforce size and productivity metrics indicate HR operational scale and efficiency opportunities.",
      conversationStarter: "What are your current workforce productivity targets and how do you measure HR operational efficiency?",
      sourceContext: "Employee data analysis",
      confidence: metrics.employees.confidence === 'high' ? 9 : 7,
      pageReference: "Workforce metrics"
    });
  }
  
  // Profit/Loss insight
  if (metrics.profit.amount) {
    const profitability = metrics.profit.type === 'loss' 
      ? "operational losses requiring cost optimization" 
      : "strong profitability enabling strategic HR investments";
    
    insights.push({
      dataPoint: `Net ${metrics.profit.type}: ${metrics.profit.amount}${metrics.profit.margin ? ` (${metrics.profit.margin} margin)` : ''}`,
      hrRelevance: `Current ${profitability} and workforce cost management strategies.`,
      conversationStarter: `How is the current ${metrics.profit.type === 'loss' ? 'cost optimization focus' : 'profitability'} influencing your HR investment priorities and compensation strategy?`,
      sourceContext: "Profitability analysis",
      confidence: metrics.profit.confidence === 'high' ? 9 : 7,
      pageReference: "Financial performance"
    });
  }
  
  return insights;
}

function calculateRevenuePerEmployee(revenueStr: string, employees: number): string {
  // Simple calculation for revenue per employee
  const revenue = parseRevenueString(revenueStr);
  if (revenue && employees > 0) {
    const perEmployee = revenue / employees;
    if (perEmployee >= 1000000) {
      return `$${(perEmployee / 1000000).toFixed(1)}M`;
    } else if (perEmployee >= 1000) {
      return `$${(perEmployee / 1000).toFixed(0)}K`;
    }
    return `$${perEmployee.toFixed(0)}`;
  }
  return '';
}

function parseRevenueString(revenueStr: string): number | null {
  const match = revenueStr.match(/([\d.]+)\s*([BMK]?)/);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const scale = match[2];
  
  switch (scale) {
    case 'B': return value * 1000000000;
    case 'M': return value * 1000000;
    case 'K': return value * 1000;
    default: return value;
  }
}