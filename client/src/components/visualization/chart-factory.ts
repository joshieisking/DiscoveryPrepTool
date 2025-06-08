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
// Currency support for international annual reports
interface CurrencyInfo {
  symbol: string;
  code: string;
  name: string;
}

const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  'S$': { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' },
  '$': { symbol: '$', code: 'USD', name: 'US Dollar' },
  'USD': { symbol: '$', code: 'USD', name: 'US Dollar' },
  '€': { symbol: '€', code: 'EUR', name: 'Euro' },
  'EUR': { symbol: '€', code: 'EUR', name: 'Euro' },
  '£': { symbol: '£', code: 'GBP', name: 'British Pound' },
  'GBP': { symbol: '£', code: 'GBP', name: 'British Pound' },
  '¥': { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  'JPY': { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  'RM': { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit' },
  'MYR': { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit' },
  '₹': { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  'INR': { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  'CNY': { symbol: '¥', code: 'CNY', name: 'Chinese Yuan' },
  'HK$': { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar' },
  'HKD': { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar' },
  '฿': { symbol: '฿', code: 'THB', name: 'Thai Baht' },
  'THB': { symbol: '฿', code: 'THB', name: 'Thai Baht' },
  'Rp': { symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah' },
  'IDR': { symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah' },
  '₱': { symbol: '₱', code: 'PHP', name: 'Philippine Peso' },
  'PHP': { symbol: '₱', code: 'PHP', name: 'Philippine Peso' },
  '₩': { symbol: '₩', code: 'KRW', name: 'South Korean Won' },
  'KRW': { symbol: '₩', code: 'KRW', name: 'South Korean Won' },
  'A$': { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  'AUD': { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  'C$': { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  'CAD': { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' }
};

// Financial keywords for consistent extraction
const financialKeywords = {
  revenue: ["total revenue", "net sales", "operating revenue", "turnover", "total income"],
  profit: ["net profit", "net income", "profit after tax", "net earnings"],
  profitSecondary: ["underlying net profit", "adjusted net profit", "core net profit", "normalised net profit"],
  employees: ["total employees", "workforce", "headcount", "number of employees", "staff count"],
  assets: ["total assets", "total resources"]
};

// Enhanced patterns with multi-currency support
const fallbackPatterns = {
  revenue: /(revenue|sales|income).*?([S$€£¥]?RM?[\d,]+\.?\d*\s?(million|billion|thousand|m|b))/i,
  profit: /(profit|income|earnings).*?([S$€£¥]?RM?[\d,]+\.?\d*\s?(million|billion|thousand|m|b))/i,
  employees: /employ.*?(\d{1,3}(?:,\d{3})*)/i,
  countries: /(?:countries|markets|territories).*?(\d+)/i
};

interface FinancialMatch {
  value: number;
  currency: CurrencyInfo;
  context: string;
  year?: string;
  confidence: 'high' | 'medium' | 'low';
}

class FinancialDataExtractor {
  static extractRevenue(analysisData: AnalysisData): number | null {
    try {
      const enhanced = this.extractRevenueMultiStrategy(analysisData);
      if (enhanced) {
        return enhanced;
      }
    } catch (error) {
      console.warn('Multi-strategy revenue extraction failed, using fallback');
    }
    
    // Fallback to original logic
    return this.extractRevenueFallback(analysisData);
  }

  private static extractRevenueMultiStrategy(analysisData: AnalysisData): number | null {
    const strategies = [
      () => this.extractRevenueScaled(analysisData),    // "$4.2B revenue"
      () => this.extractRevenueFull(analysisData),      // "$4,241,838,000"
      () => this.extractRevenueFiscal(analysisData),    // "Fiscal 2025 revenue"
      () => this.extractRevenueContext(analysisData)    // Large numbers near "revenue"
    ];
    
    for (const strategy of strategies) {
      try {
        const result = strategy();
        if (result && this.validateRevenueRange(result)) {
          return result;
        }
      } catch (error) {
        console.warn(`Revenue extraction strategy failed:`, error);
      }
    }
    
    return null;
  }

  private static extractRevenueScaled(analysisData: AnalysisData): number | null {
    const allText = this.getAllAnalysisText(analysisData);
    const currency = this.getExtractedCurrency(analysisData);
    
    // Look for scaled revenue formats like "$4.2B revenue"
    const scaledPattern = new RegExp(`(?:fiscal\\s+\\d{4}\\s+)?(?:total\\s+|net\\s+|operating\\s+)?revenue[^.]*?(${currency.symbol}?[\\d,]+\\.?\\d*\\s?(?:billion|million|thousand|b|m))`, 'gi');
    const matches = allText.match(scaledPattern);
    
    if (matches) {
      for (const match of matches) {
        const valueMatch = match.match(/([\d,]+\.?\d*)\s?(billion|million|thousand|b|m)/i);
        if (valueMatch) {
          return this.parseFinancialValueEnhanced(`${valueMatch[1]} ${valueMatch[2]}`);
        }
      }
    }
    
    return null;
  }

  private static extractRevenueFull(analysisData: AnalysisData): number | null {
    const allText = this.getAllAnalysisText(analysisData);
    const currency = this.getExtractedCurrency(analysisData);
    
    // Look for full digit revenue formats like "$4,241,838,000"
    const fullPattern = new RegExp(`(?:fiscal\\s+\\d{4}\\s+)?(?:total\\s+|net\\s+|operating\\s+)?revenue[^.]*?(${currency.symbol}?[\\d,]{7,})`, 'gi');
    const matches = allText.match(fullPattern);
    
    if (matches) {
      for (const match of matches) {
        const valueMatch = match.match(/([\\d,]{7,})/);
        if (valueMatch) {
          const value = parseInt(valueMatch[1].replace(/,/g, ''));
          if (value >= 1000000) { // Minimum $1M for reasonable revenue
            return value;
          }
        }
      }
    }
    
    return null;
  }

  private static extractRevenueFiscal(analysisData: AnalysisData): number | null {
    const allText = this.getAllAnalysisText(analysisData);
    const currency = this.getExtractedCurrency(analysisData);
    
    // Look specifically for fiscal year revenue patterns
    const fiscalPattern = new RegExp(`fiscal\\s+\\d{4}\\s+revenue[^.]*?(${currency.symbol}?[\\d,]+(?:\\.\\d+)?(?:\\s?(?:billion|million|thousand|b|m))?[^.]*?)`, 'gi');
    const matches = allText.match(fiscalPattern);
    
    if (matches) {
      for (const match of matches) {
        // Try scaled format first
        const scaledMatch = match.match(/([\d,]+\.?\d*)\s?(billion|million|thousand|b|m)/i);
        if (scaledMatch) {
          return this.parseFinancialValueEnhanced(`${scaledMatch[1]} ${scaledMatch[2]}`);
        }
        
        // Try full format
        const fullMatch = match.match(/([\\d,]{7,})/);
        if (fullMatch) {
          const value = parseInt(fullMatch[1].replace(/,/g, ''));
          if (value >= 1000000) {
            return value;
          }
        }
      }
    }
    
    return null;
  }

  private static extractRevenueContext(analysisData: AnalysisData): number | null {
    const allText = this.getAllAnalysisText(analysisData);
    const currency = this.getExtractedCurrency(analysisData);
    
    // Look for large dollar amounts near revenue context
    const contextPattern = new RegExp(`revenue[^.]{0,100}(${currency.symbol}?[\\d,]{7,})|([\\d,]{7,})[^.]{0,100}revenue`, 'gi');
    const matches = allText.match(contextPattern);
    
    if (matches) {
      for (const match of matches) {
        const valueMatch = match.match(/([\\d,]{7,})/);
        if (valueMatch) {
          const value = parseInt(valueMatch[1].replace(/,/g, ''));
          if (value >= 1000000) {
            return value;
          }
        }
      }
    }
    
    return null;
  }

  private static validateRevenueRange(value: number): boolean {
    // Reasonable range for enterprise revenue: $1M to $1T
    return value >= 1000000 && value <= 1000000000000;
  }

  static extractProfit(analysisData: AnalysisData): number | null {
    try {
      const enhanced = this.extractProfitIsolated(analysisData);
      if (enhanced) {
        return enhanced;
      }
    } catch (error) {
      console.warn('Enhanced profit extraction failed, using fallback');
    }
    
    // Fallback to original logic
    return this.extractProfitFallback(analysisData);
  }

  private static extractProfitIsolated(analysisData: AnalysisData): number | null {
    const allText = this.getAllAnalysisText(analysisData);
    
    // Look for profit-specific contexts, avoiding revenue sections
    const profitKeywords = ['net profit', 'net income', 'profit after tax', 'net earnings'];
    const currency = this.getExtractedCurrency(analysisData);
    
    for (const keyword of profitKeywords) {
      const keywordRegex = new RegExp(`(${keyword})[^.]*?(${currency.symbol}?[\\d,]+\\.?\\d*\\s?(?:million|billion|thousand|m|b))`, 'gi');
      const matches = allText.match(keywordRegex);
      
      if (matches) {
        for (const match of matches) {
          // Skip if this appears to be in a revenue context
          if (match.toLowerCase().includes('revenue') || match.toLowerCase().includes('sales')) {
            continue;
          }
          
          const valueMatch = match.match(/([\d,]+\.?\d*)\s?(million|billion|thousand|m|b)/i);
          if (valueMatch) {
            const value = this.parseFinancialValueEnhanced(`${valueMatch[1]} ${valueMatch[2]}`);
            if (value) {
              return value;
            }
          }
        }
      }
    }
    
    return null;
  }

  private static extractRevenueWithContext(analysisData: AnalysisData): FinancialMatch | null {
    const allText = this.getAllAnalysisText(analysisData);
    const matches = this.findAllFinancialMatches(allText, 'revenue');
    
    if (matches.length === 0) return null;
    
    // Select the best match based on year and context
    return this.selectBestMatch(matches);
  }

  private static extractProfitWithContext(analysisData: AnalysisData): FinancialMatch | null {
    const allText = this.getAllAnalysisText(analysisData);
    
    // First try primary profit keywords
    let matches = this.findAllFinancialMatches(allText, 'profit');
    
    // If no primary matches, try secondary profit terms but mark as lower confidence
    if (matches.length === 0) {
      matches = this.findAllFinancialMatches(allText, 'profitSecondary');
      matches.forEach(match => match.confidence = 'medium');
    }
    
    if (matches.length === 0) return null;
    
    // Prioritize "net profit" over "underlying profit"
    const netProfitMatches = matches.filter(m => 
      m.context.toLowerCase().includes('net profit') && 
      !m.context.toLowerCase().includes('underlying')
    );
    
    const bestMatches = netProfitMatches.length > 0 ? netProfitMatches : matches;
    return this.selectBestMatch(bestMatches);
  }

  private static findAllFinancialMatches(text: string, type: keyof typeof financialKeywords): FinancialMatch[] {
    const matches: FinancialMatch[] = [];
    const keywords = financialKeywords[type];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword.replace(/\s+/g, '\\s+')})([^.]*?)((?:RM|S\\$|\\$|€|£|¥)?[\\d,]+\\.?\\d*\\s?(?:million|billion|thousand|m|b))`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const context = match[0];
        const valueStr = match[3];
        const currency = this.detectCurrency(valueStr, context);
        const value = this.parseFinancialValueEnhanced(valueStr);
        const year = this.extractYear(context);
        
        if (value && currency) {
          matches.push({
            value,
            currency,
            context,
            year,
            confidence: this.calculateConfidence(context, keyword, year)
          });
        }
      }
    });
    
    return matches;
  }

  private static selectBestMatch(matches: FinancialMatch[]): FinancialMatch | null {
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];
    
    // Prioritize by: 1) Latest year, 2) High confidence, 3) Context quality
    return matches.sort((a, b) => {
      // Latest year first
      if (a.year && b.year) {
        const yearA = parseInt(a.year);
        const yearB = parseInt(b.year);
        if (yearA !== yearB) return yearB - yearA;
      } else if (a.year && !b.year) return -1;
      else if (!a.year && b.year) return 1;
      
      // Higher confidence first
      const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const confDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
      if (confDiff !== 0) return -confDiff;
      
      // Prefer shorter, more specific context
      return a.context.length - b.context.length;
    })[0];
  }

  private static detectCurrency(valueStr: string, context: string): CurrencyInfo | null {
    const combinedText = `${valueStr} ${context}`.toLowerCase();
    
    // Check for currency symbols in order of specificity (most specific first)
    const currencyPriority = ['RM', 'S$', '€', '£', '¥', '$'];
    
    for (const symbol of currencyPriority) {
      const info = SUPPORTED_CURRENCIES[symbol];
      if (info && (valueStr.includes(symbol) || combinedText.includes(symbol.toLowerCase()))) {
        return info;
      }
    }
    
    // Check for currency codes in context
    for (const [code, info] of Object.entries(SUPPORTED_CURRENCIES)) {
      if (combinedText.includes(code.toLowerCase())) {
        return info;
      }
    }
    
    // Default to USD if no currency found
    return SUPPORTED_CURRENCIES['$'];
  }

  private static extractYear(context: string): string | undefined {
    // Look for FY2024, 2024, etc.
    const yearMatch = context.match(/(?:FY|fy)?\s?(\d{4})/);
    return yearMatch ? yearMatch[1] : undefined;
  }

  private static calculateConfidence(context: string, keyword: string, year?: string): 'high' | 'medium' | 'low' {
    let score = 0;
    
    // Year context increases confidence
    if (year && parseInt(year) >= 2023) score += 2;
    
    // Exact keyword match increases confidence
    if (context.toLowerCase().includes(keyword)) score += 2;
    
    // Recent/current context increases confidence
    if (context.toLowerCase().includes('current') || context.toLowerCase().includes('latest')) score += 1;
    
    // Avoid secondary/adjusted figures
    if (context.toLowerCase().includes('underlying') || context.toLowerCase().includes('adjusted')) score -= 1;
    
    if (score >= 3) return 'high';
    if (score >= 1) return 'medium';
    return 'low';
  }

  private static parseFinancialValueEnhanced(valueStr: string): number | null {
    // Remove currency symbols and clean the value, keeping scale indicators
    const cleanValue = valueStr.replace(/[S$€£¥RM,\s]/g, '').toLowerCase();
    const numberPart = parseFloat(cleanValue.replace(/[^\d.]/g, ''));
    
    if (isNaN(numberPart)) return null;
    
    // Apply scale multipliers
    if (cleanValue.includes('billion') || cleanValue.includes('b')) {
      return numberPart * 1000000000;
    } else if (cleanValue.includes('million') || cleanValue.includes('m')) {
      return numberPart * 1000000;
    } else if (cleanValue.includes('thousand') || cleanValue.includes('k')) {
      return numberPart * 1000;
    }
    
    return numberPart * 1000000; // Assume millions if no scale specified
  }

  private static extractRevenueFallback(analysisData: AnalysisData): number | null {
    const allText = this.getAllAnalysisText(analysisData).toLowerCase();
    
    for (const keyword of financialKeywords.revenue) {
      const match = this.findFinancialValue(allText, keyword);
      if (match) return match;
    }
    
    const patternMatch = allText.match(fallbackPatterns.revenue);
    if (patternMatch) {
      return this.parseFinancialValue(patternMatch[2]);
    }
    
    return null;
  }

  private static extractProfitFallback(analysisData: AnalysisData): number | null {
    const allText = this.getAllAnalysisText(analysisData).toLowerCase();
    
    for (const keyword of financialKeywords.profit) {
      const match = this.findFinancialValue(allText, keyword);
      if (match) return match;
    }
    
    const profitPattern = /(?:profit|income|earnings).*?([S$€£¥]?[\d,]+\.?\d*\s?(million|billion|thousand))/i;
    const patternMatch = allText.match(profitPattern);
    if (patternMatch) {
      return this.parseFinancialValue(patternMatch[1]);
    }
    
    return null;
  }

  static extractEmployees(analysisData: AnalysisData): number | null {
    const allText = this.getAllAnalysisText(analysisData);
    const lowerText = allText.toLowerCase();
    
    // Check if explicitly stated as not available
    const notAvailablePatterns = [
      'not explicitly stated',
      'not stated',
      'not mentioned',
      'not disclosed',
      'not provided',
      'not available',
      'not specified'
    ];
    
    const hasEmployeeContext = lowerText.includes('employee') || lowerText.includes('workforce') || lowerText.includes('headcount');
    if (hasEmployeeContext) {
      for (const pattern of notAvailablePatterns) {
        if (lowerText.includes(pattern)) {
          return null; // Explicitly not available
        }
      }
    }
    
    // Try exact keyword matches with improved patterns
    for (const keyword of financialKeywords.employees) {
      const keywordIndex = lowerText.indexOf(keyword);
      if (keywordIndex !== -1) {
        const contextStart = Math.max(0, keywordIndex - 50);
        const contextEnd = Math.min(allText.length, keywordIndex + 150);
        const context = allText.substring(contextStart, contextEnd);
        
        // Enhanced employee number patterns for larger companies
        const enhancedEmployeePattern = /(\d{1,3}(?:,\d{3})*(?:\+|k|thousand)?)/gi;
        const matches = context.match(enhancedEmployeePattern);
        
        if (matches) {
          for (const match of matches) {
            let value = parseInt(match.replace(/[,+k]/g, ''));
            
            // Handle 'k' or 'thousand' suffixes
            if (match.toLowerCase().includes('k') || match.toLowerCase().includes('thousand')) {
              value *= 1000;
            }
            
            // Improved validation for enterprise-scale companies
            if (value >= 500 && value <= 500000) { // Reasonable range for large corporations
              return value;
            }
          }
        }
      }
    }
    
    // Enhanced fallback pattern for employees
    const enhancedPattern = /(?:employ|workforce|headcount|staff).*?(\d{1,3}(?:,\d{3})*(?:\+|k|thousand)?)/gi;
    const fallbackMatches = allText.match(enhancedPattern);
    
    if (fallbackMatches) {
      for (const match of fallbackMatches) {
        const numberMatch = match.match(/(\d{1,3}(?:,\d{3})*(?:\+|k|thousand)?)/i);
        if (numberMatch) {
          let value = parseInt(numberMatch[1].replace(/[,+k]/g, ''));
          
          if (numberMatch[1].toLowerCase().includes('k') || numberMatch[1].toLowerCase().includes('thousand')) {
            value *= 1000;
          }
          
          if (value >= 500 && value <= 500000) {
            return value;
          }
        }
      }
    }
    
    return null;
  }

  static calculateProfitMargin(revenue: number, profit: number): number {
    if (!revenue || revenue === 0) return 0;
    return (profit / revenue) * 100;
  }

  static formatFinancialValue(value: number | null, type: 'currency' | 'number' | 'percentage', currency?: CurrencyInfo): string {
    if (value === null || value === undefined) return 'N/A';
    
    switch (type) {
      case 'currency':
        const currencySymbol = currency?.symbol || '$';
        if (value >= 1000000000) {
          return `${currencySymbol}${(value / 1000000000).toFixed(1)}B`;
        } else if (value >= 1000000) {
          return `${currencySymbol}${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${currencySymbol}${(value / 1000).toFixed(1)}K`;
        }
        return `${currencySymbol}${value.toLocaleString()}`;
      
      case 'number':
        return value.toLocaleString();
      
      case 'percentage':
        return `${value.toFixed(1)}%`;
      
      default:
        return value.toString();
    }
  }

  static getExtractedCurrency(analysisData: AnalysisData): CurrencyInfo {
    const allText = this.getAllAnalysisText(analysisData);
    
    // Priority order: most specific currency symbols first to avoid conflicts
    const currencyPriority = ['HK$', 'A$', 'C$', 'S$', 'RM', '₹', '₱', '฿', 'Rp', '₩', '¥', '€', '£', '$'];
    
    for (const symbol of currencyPriority) {
      if (allText.includes(symbol)) {
        return SUPPORTED_CURRENCIES[symbol];
      }
    }
    
    // Check for currency codes in text
    const currencyCodes = ['INR', 'CNY', 'HKD', 'THB', 'IDR', 'PHP', 'KRW', 'AUD', 'CAD', 'MYR', 'SGD', 'EUR', 'GBP', 'USD'];
    for (const code of currencyCodes) {
      if (allText.toUpperCase().includes(code)) {
        return SUPPORTED_CURRENCIES[code];
      }
    }
    
    return SUPPORTED_CURRENCIES['$']; // Default to USD
  }

  private static getAllAnalysisText(analysisData: AnalysisData): string {
    const allInsights = [
      ...analysisData.businessContext,
      ...analysisData.workforceInsights,
      ...analysisData.operationalChallenges,
      ...analysisData.strategicPeopleInitiatives
    ];
    
    return [
      analysisData.summary,
      ...allInsights.map(insight => `${insight.dataPoint} ${insight.hrRelevance}`)
    ].join(' ');
  }

  private static findFinancialValue(text: string, keyword: string): number | null {
    const keywordIndex = text.indexOf(keyword);
    if (keywordIndex === -1) return null;
    
    // Look in a 150 character context around the keyword
    const contextStart = Math.max(0, keywordIndex - 50);
    const contextEnd = Math.min(text.length, keywordIndex + 100);
    const context = text.substring(contextStart, contextEnd);
    
    // Find financial values near the keyword
    const financialPattern = /(\$?[\d,]+\.?\d*\s?(million|billion|thousand|m|b))/i;
    const match = context.match(financialPattern);
    
    if (match) {
      return this.parseFinancialValue(match[1]);
    }
    
    return null;
  }

  private static parseFinancialValue(valueStr: string): number {
    const cleanValue = valueStr.replace(/[$,\s]/g, '').toLowerCase();
    const numberPart = parseFloat(cleanValue.replace(/[^\d.]/g, ''));
    
    if (cleanValue.includes('billion') || cleanValue.includes('b')) {
      return numberPart * 1000000000;
    } else if (cleanValue.includes('million') || cleanValue.includes('m')) {
      return numberPart * 1000000;
    } else if (cleanValue.includes('thousand') || cleanValue.includes('k')) {
      return numberPart * 1000;
    }
    
    return numberPart;
  }
}

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
    id: 'financial-dashboard',
    name: 'Financial Key Metrics',
    description: 'Essential financial indicators from annual report',
    icon: 'DollarSign',
    generate: (analysisData: AnalysisData) => {
      const currency = FinancialDataExtractor.getExtractedCurrency(analysisData);
      const revenue = FinancialDataExtractor.extractRevenue(analysisData);
      let profit = FinancialDataExtractor.extractProfit(analysisData);
      const employees = FinancialDataExtractor.extractEmployees(analysisData);
      
      // Financial validation: profit should not exceed revenue
      if (revenue && profit && profit > revenue) {
        console.warn('Profit extraction appears incorrect (profit > revenue), setting to null');
        profit = null;
      }
      
      const profitMargin = (revenue && profit) 
        ? FinancialDataExtractor.calculateProfitMargin(revenue, profit)
        : null;

      const financialData: ChartDataPoint[] = [
        {
          name: 'Total Revenue',
          value: revenue || 0,
          description: revenue ? FinancialDataExtractor.formatFinancialValue(revenue, 'currency', currency) : 'Data not available',
          category: 'financial'
        },
        {
          name: 'Net Profit',
          value: profit || 0,
          description: profit ? FinancialDataExtractor.formatFinancialValue(profit, 'currency', currency) : 'Data not available',
          category: 'financial'
        },
        {
          name: 'Total Employees',
          value: employees || 0,
          description: employees ? FinancialDataExtractor.formatFinancialValue(employees, 'number') : 'Data not available',
          category: 'workforce'
        },
        {
          name: 'Profit Margin',
          value: profitMargin || 0,
          description: profitMargin ? FinancialDataExtractor.formatFinancialValue(profitMargin, 'percentage') : 'Data not available',
          category: 'financial'
        }
      ];

      // Only return the chart if we have at least one piece of financial data
      const hasFinancialData = revenue || profit || employees;
      if (!hasFinancialData) return null;

      return {
        type: 'metric-cards',
        title: 'Financial Key Metrics',
        data: financialData,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        description: `Key financial indicators extracted from the annual report (${currency.code})`,
        insights: analysisData.businessContext.filter(insight => 
          insight.dataPoint.toLowerCase().includes('revenue') ||
          insight.dataPoint.toLowerCase().includes('profit') ||
          insight.dataPoint.toLowerCase().includes('income') ||
          insight.dataPoint.toLowerCase().includes('employ')
        )
      };
    }
  },
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
    
    // Always try financial dashboard first
    const financialTemplate = chartTemplates.find(t => t.id === 'financial-dashboard');
    if (financialTemplate) {
      const financialConfig = financialTemplate.generate(analysisData);
      if (financialConfig) {
        configs.push(financialConfig);
      }
    }
    
    // Try remaining templates and add successful generations
    chartTemplates.forEach(template => {
      if (template.id !== 'financial-dashboard') { // Skip financial dashboard as it's already processed
        const config = template.generate(analysisData);
        if (config) {
          configs.push(config);
        }
      }
    });

    return configs;
  }

  static getAvailableTemplates(): ChartTemplate[] {
    return chartTemplates;
  }
}