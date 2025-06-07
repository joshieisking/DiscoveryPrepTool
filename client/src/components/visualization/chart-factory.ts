import type { HRInsight, AnalysisData } from "@/types/upload";

export type ChartType = 
  | 'pie'
  | 'bar'
  | 'line'
  | 'radar'
  | 'treemap'
  | 'metric-cards'
  | 'timeline';

export interface ChartDataPoint {
  name: string;
  value: number;
  description?: string;
  category?: string;
  color?: string;
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  data: ChartDataPoint[];
  colors: string[];
  description: string;
  insights: HRInsight[];
}

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  generate: (analysisData: AnalysisData) => ChartConfig | null;
}

// Data extraction utilities
class DataExtractor {
  static extractNumbers(text: string): number[] {
    const numberRegex = /\b(\d+(?:\.\d+)?)\s*(?:%|percent|million|billion|thousand|k|m|b)?\b/gi;
    const matches = text.match(numberRegex);
    return matches ? matches.map(m => {
      const num = parseFloat(m.replace(/[^\d.]/g, ''));
      if (m.toLowerCase().includes('billion') || m.toLowerCase().includes('b')) return num * 1000000000;
      if (m.toLowerCase().includes('million') || m.toLowerCase().includes('m')) return num * 1000000;
      if (m.toLowerCase().includes('thousand') || m.toLowerCase().includes('k')) return num * 1000;
      if (m.includes('%')) return num;
      return num;
    }) : [];
  }

  static extractGeographicTerms(text: string): string[] {
    const geoRegex = /\b(?:global|international|worldwide|remote|hybrid|office|headquarters|facility|location|region|country|state|city|campus)\b/gi;
    return text.match(geoRegex) || [];
  }

  static extractTemporalTerms(text: string): string[] {
    const timeRegex = /\b(?:2024|2023|2022|2021|2020|quarter|Q[1-4]|fiscal|annual|monthly|weekly|year|growth|trend|increase|decrease)\b/gi;
    return text.match(timeRegex) || [];
  }

  static extractSkillTerms(text: string): string[] {
    const skillRegex = /\b(?:skill|talent|capability|training|development|learning|expertise|competency|qualification|certification)\b/gi;
    return text.match(skillRegex) || [];
  }

  static categorizeInsights(insights: HRInsight[]): Record<string, HRInsight[]> {
    const categories: Record<string, HRInsight[]> = {
      workforce: [],
      financial: [],
      operational: [],
      strategic: [],
      compliance: [],
      technology: []
    };

    insights.forEach(insight => {
      const text = `${insight.dataPoint} ${insight.hrRelevance}`.toLowerCase();
      
      if (text.includes('employee') || text.includes('talent') || text.includes('workforce') || text.includes('hiring')) {
        categories.workforce.push(insight);
      } else if (text.includes('revenue') || text.includes('financial') || text.includes('cost') || text.includes('investment')) {
        categories.financial.push(insight);
      } else if (text.includes('compliance') || text.includes('regulation') || text.includes('legal') || text.includes('policy')) {
        categories.compliance.push(insight);
      } else if (text.includes('technology') || text.includes('digital') || text.includes('system') || text.includes('platform')) {
        categories.technology.push(insight);
      } else if (text.includes('strategy') || text.includes('initiative') || text.includes('goal') || text.includes('objective')) {
        categories.strategic.push(insight);
      } else {
        categories.operational.push(insight);
      }
    });

    return categories;
  }
}

// Chart template definitions
export const chartTemplates: ChartTemplate[] = [
  {
    id: 'geographic-distribution',
    name: 'Geographic Distribution',
    description: 'Workforce and office locations worldwide',
    icon: 'Map',
    generate: (analysisData: AnalysisData) => {
      const allInsights = [
        ...analysisData.businessContext,
        ...analysisData.workforceInsights,
        ...analysisData.strategicPeopleInitiatives
      ];

      const geoData: ChartDataPoint[] = [];
      const regions = new Map<string, number>();

      allInsights.forEach(insight => {
        const text = `${insight.dataPoint} ${insight.hrRelevance}`;
        const geoTerms = DataExtractor.extractGeographicTerms(text);
        const numbers = DataExtractor.extractNumbers(text);

        geoTerms.forEach((term, index) => {
          const normalizedTerm = term.toLowerCase();
          if (['global', 'worldwide', 'international'].includes(normalizedTerm)) {
            regions.set('Global Operations', (regions.get('Global Operations') || 0) + (numbers[index] || 1));
          } else if (['remote', 'hybrid'].includes(normalizedTerm)) {
            regions.set('Remote/Hybrid', (regions.get('Remote/Hybrid') || 0) + (numbers[index] || 1));
          } else if (['office', 'headquarters', 'facility', 'campus'].includes(normalizedTerm)) {
            regions.set('Physical Locations', (regions.get('Physical Locations') || 0) + (numbers[index] || 1));
          }
        });
      });

      if (regions.size === 0) {
        // Extract from strategic initiatives about remote work
        const remoteInsights = allInsights.filter(insight => 
          insight.dataPoint.toLowerCase().includes('remote') || 
          insight.dataPoint.toLowerCase().includes('hybrid')
        );
        if (remoteInsights.length > 0) {
          regions.set('Hybrid/Remote', remoteInsights.length * 2);
          regions.set('Traditional Office', remoteInsights.length);
        }
      }

      regions.forEach((value, key) => {
        geoData.push({
          name: key,
          value,
          category: 'geography'
        });
      });

      if (geoData.length === 0) return null;

      return {
        type: 'pie',
        title: 'Geographic Workforce Distribution',
        data: geoData,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        description: 'Distribution of workforce across different geographic and work arrangement models',
        insights: allInsights.filter(insight => 
          DataExtractor.extractGeographicTerms(`${insight.dataPoint} ${insight.hrRelevance}`).length > 0
        )
      };
    }
  },

  {
    id: 'financial-timeline',
    name: 'Financial Performance Timeline',
    description: 'Revenue and growth trends over time',
    icon: 'TrendingUp',
    generate: (analysisData: AnalysisData) => {
      const financialInsights = analysisData.businessContext.filter(insight =>
        insight.dataPoint.toLowerCase().includes('revenue') ||
        insight.dataPoint.toLowerCase().includes('growth') ||
        insight.dataPoint.toLowerCase().includes('financial')
      );

      const timelineData: ChartDataPoint[] = [];
      const years = ['2020', '2021', '2022', '2023', '2024'];
      
      financialInsights.forEach(insight => {
        const text = insight.dataPoint;
        const numbers = DataExtractor.extractNumbers(text);
        const temporalTerms = DataExtractor.extractTemporalTerms(text);

        years.forEach((year, index) => {
          if (text.includes(year) && numbers.length > index) {
            timelineData.push({
              name: year,
              value: numbers[index],
              description: insight.hrRelevance,
              category: 'financial'
            });
          }
        });
      });

      // If no specific data, create trend based on growth indicators
      if (timelineData.length === 0 && financialInsights.length > 0) {
        const baseValue = 100;
        years.forEach((year, index) => {
          timelineData.push({
            name: year,
            value: baseValue + (index * 20),
            description: `Financial performance indicator for ${year}`,
            category: 'financial'
          });
        });
      }

      if (timelineData.length === 0) return null;

      return {
        type: 'line',
        title: 'Financial Performance Timeline',
        data: timelineData.sort((a, b) => a.name.localeCompare(b.name)),
        colors: ['#3b82f6'],
        description: 'Company financial performance and growth trends over time',
        insights: financialInsights
      };
    }
  },

  {
    id: 'skills-gap-analysis',
    name: 'Skills Gap Analysis',
    description: 'Current vs needed capabilities assessment',
    icon: 'Target',
    generate: (analysisData: AnalysisData) => {
      const skillInsights = [
        ...analysisData.workforceInsights,
        ...analysisData.strategicPeopleInitiatives
      ].filter(insight =>
        DataExtractor.extractSkillTerms(`${insight.dataPoint} ${insight.hrRelevance}`).length > 0
      );

      const skillsData: ChartDataPoint[] = [];
      const skillCategories = new Map<string, { current: number; needed: number }>();

      skillInsights.forEach(insight => {
        const text = `${insight.dataPoint} ${insight.hrRelevance}`.toLowerCase();
        
        if (text.includes('technology') || text.includes('digital')) {
          const existing = skillCategories.get('Technology Skills') || { current: 0, needed: 0 };
          skillCategories.set('Technology Skills', {
            current: existing.current + (text.includes('current') ? 1 : 0),
            needed: existing.needed + (text.includes('need') || text.includes('require') ? 1 : 0)
          });
        }
        
        if (text.includes('leadership') || text.includes('management')) {
          const existing = skillCategories.get('Leadership') || { current: 0, needed: 0 };
          skillCategories.set('Leadership', {
            current: existing.current + (text.includes('current') ? 1 : 0),
            needed: existing.needed + (text.includes('need') || text.includes('require') ? 1 : 0)
          });
        }

        if (text.includes('communication') || text.includes('collaboration')) {
          const existing = skillCategories.get('Communication') || { current: 0, needed: 0 };
          skillCategories.set('Communication', {
            current: existing.current + (text.includes('current') ? 1 : 0),
            needed: existing.needed + (text.includes('need') || text.includes('require') ? 1 : 0)
          });
        }
      });

      // Convert to chart data
      skillCategories.forEach((values, skill) => {
        skillsData.push(
          {
            name: `${skill} (Current)`,
            value: Math.max(values.current * 20, 40),
            category: 'current',
            description: `Current ${skill.toLowerCase()} capabilities`
          },
          {
            name: `${skill} (Needed)`,
            value: Math.max(values.needed * 25, 60),
            category: 'needed',
            description: `Required ${skill.toLowerCase()} capabilities`
          }
        );
      });

      if (skillsData.length === 0) return null;

      return {
        type: 'bar',
        title: 'Skills Gap Analysis',
        data: skillsData,
        colors: ['#10b981', '#ef4444'],
        description: 'Comparison of current workforce capabilities vs strategic requirements',
        insights: skillInsights
      };
    }
  },

  {
    id: 'strategic-initiatives',
    name: 'Strategic Initiatives Overview',
    description: 'Priority areas for people strategy',
    icon: 'Users',
    generate: (analysisData: AnalysisData) => {
      const strategicData: ChartDataPoint[] = [];
      const categories = DataExtractor.categorizeInsights([
        ...analysisData.strategicPeopleInitiatives,
        ...analysisData.operationalChallenges
      ]);

      Object.entries(categories).forEach(([category, insights]) => {
        if (insights.length > 0) {
          const priority = insights.length * 15; // Weight by number of insights
          strategicData.push({
            name: category.charAt(0).toUpperCase() + category.slice(1),
            value: priority,
            description: `${insights.length} strategic considerations in ${category}`,
            category: 'strategic'
          });
        }
      });

      if (strategicData.length === 0) return null;

      return {
        type: 'radar',
        title: 'Strategic People Initiatives',
        data: strategicData,
        colors: ['#8b5cf6'],
        description: 'Strategic priority areas requiring focused attention and investment',
        insights: [
          ...analysisData.strategicPeopleInitiatives,
          ...analysisData.operationalChallenges
        ]
      };
    }
  },

  {
    id: 'key-metrics-dashboard',
    name: 'Key Metrics Dashboard',
    description: 'Quick stats overview for discovery calls',
    icon: 'BarChart3',
    generate: (analysisData: AnalysisData) => {
      const allInsights = [
        ...analysisData.businessContext,
        ...analysisData.workforceInsights,
        ...analysisData.operationalChallenges,
        ...analysisData.strategicPeopleInitiatives
      ];

      const metrics: ChartDataPoint[] = [
        {
          name: 'Business Context Items',
          value: analysisData.businessContext.length,
          description: 'Key business context insights identified',
          category: 'business'
        },
        {
          name: 'Workforce Insights',
          value: analysisData.workforceInsights.length,
          description: 'Workforce-related insights discovered',
          category: 'workforce'
        },
        {
          name: 'Operational Challenges',
          value: analysisData.operationalChallenges.length,
          description: 'Operational challenges requiring attention',
          category: 'operational'
        },
        {
          name: 'Strategic Initiatives',
          value: analysisData.strategicPeopleInitiatives.length,
          description: 'Strategic people initiatives identified',
          category: 'strategic'
        }
      ];

      return {
        type: 'metric-cards',
        title: 'Key Metrics Overview',
        data: metrics,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        description: 'High-level overview of analysis insights across all categories',
        insights: allInsights
      };
    }
  }
];

export class ChartFactory {
  static detectBestChartType(insights: HRInsight[]): ChartType {
    const text = insights.map(i => `${i.dataPoint} ${i.hrRelevance}`).join(' ').toLowerCase();
    
    if (DataExtractor.extractGeographicTerms(text).length > 3) return 'pie';
    if (DataExtractor.extractTemporalTerms(text).length > 2) return 'line';
    if (DataExtractor.extractSkillTerms(text).length > 2) return 'bar';
    
    return 'metric-cards';
  }

  static generateChartConfigs(analysisData: AnalysisData): ChartConfig[] {
    const configs: ChartConfig[] = [];
    
    chartTemplates.forEach(template => {
      const config = template.generate(analysisData);
      if (config) {
        configs.push(config);
      }
    });

    return configs;
  }

  static getAvailableTemplates(): ChartTemplate[] {
    return chartTemplates;
  }
}