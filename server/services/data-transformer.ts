import { PipelineResult } from './analysis-pipeline';

export interface AnalysisData {
  summary: string;
  businessOverview?: any;
  businessContext: any[];
  workforceInsights: any[];
  operationalChallenges: any[];
  strategicPeopleInitiatives: any[];
  financialMetrics?: any;
}

/**
 * Transforms pipeline result from analysis-pipeline to frontend AnalysisData format
 */
export function transformPipelineResultToAnalysisData(pipelineResult: PipelineResult): AnalysisData {
  return {
    summary: pipelineResult.hrInsights.summary,
    businessOverview: pipelineResult.businessOverview,
    businessContext: pipelineResult.hrInsights.businessContext,
    workforceInsights: pipelineResult.hrInsights.workforceInsights,
    operationalChallenges: pipelineResult.hrInsights.operationalChallenges,
    strategicPeopleInitiatives: pipelineResult.hrInsights.strategicPeopleInitiatives,
    financialMetrics: pipelineResult.financialMetrics
  };
}

/**
 * Validates that the transformed data has required fields
 */
export function validateAnalysisData(data: AnalysisData): boolean {
  return !!(
    data.summary &&
    data.businessContext &&
    data.workforceInsights &&
    data.operationalChallenges &&
    data.strategicPeopleInitiatives
  );
}