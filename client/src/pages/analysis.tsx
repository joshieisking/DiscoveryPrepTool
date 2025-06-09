import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, TrendingUp, Users, AlertTriangle, Target, Building, RefreshCw, DollarSign, TrendingDown, TrendingUp as TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import { getUploadById, reanalyzeUpload } from "@/services/upload";
import { formatFileSize, formatUploadTime } from "@/utils/file";
import { Link } from "wouter";
import type { AnalysisData, HRInsight, FinancialMetrics } from "@/types/upload";
import { useToast } from "@/hooks/use-toast";
import { ExpandableBadge } from "@/components/insight/expandable-badge";

interface InsightSectionProps {
  title: string;
  icon: React.ReactNode;
  insights: HRInsight[];
  description: string;
}

interface FinancialSummaryProps {
  financialMetrics: FinancialMetrics;
}

function FinancialSummary({ financialMetrics }: FinancialSummaryProps) {
  const formatCurrency = (amount: string | null, currency: string) => {
    if (!amount) return "N/A";
    const num = parseFloat(amount);
    if (num >= 1000000000) {
      return `${currency} ${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `${currency} ${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${currency} ${(num / 1000).toFixed(1)}K`;
    }
    return `${currency} ${num.toLocaleString()}`;
  };

  const formatEmployees = (count: number | string | null) => {
    if (!count) return "N/A";
    const num = typeof count === 'string' ? parseFloat(count) : count;
    return num.toLocaleString();
  };

  const calculateProfitMargin = () => {
    const revenue = financialMetrics.revenue.current;
    const profit = financialMetrics.profitLoss.amount;
    
    if (!revenue || !profit) return "N/A";
    
    const revenueNum = parseFloat(revenue);
    const profitNum = parseFloat(profit);
    
    if (revenueNum === 0) return "N/A";
    
    const margin = (profitNum / revenueNum) * 100;
    return `${margin.toFixed(1)}%`;
  };

  const getGrowthIndicator = (growth: string | null) => {
    if (!growth) return null;
    const growthNum = parseFloat(growth);
    if (growthNum > 0) {
      return <TrendingUpIcon className="w-4 h-4 text-green-600" />;
    } else if (growthNum < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-primary" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Revenue</span>
              <Badge variant={financialMetrics.revenue.confidence === 'high' ? 'default' : 'secondary'}>
                {financialMetrics.revenue.confidence}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold">
                {formatCurrency(financialMetrics.revenue.current, financialMetrics.revenue.currency)}
              </span>
              {financialMetrics.revenue.growth && getGrowthIndicator(financialMetrics.revenue.growth)}
            </div>
            {financialMetrics.revenue.growth && (
              <span className="text-xs text-slate-500">
                {parseFloat(financialMetrics.revenue.growth) > 0 ? '+' : ''}{(parseFloat(financialMetrics.revenue.growth) * 100).toFixed(1)}% YoY
              </span>
            )}
          </div>

          {/* Profit/Loss */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                {financialMetrics.profitLoss.type === 'profit' ? 'Profit' : 'Loss'}
              </span>
              <Badge variant={financialMetrics.profitLoss.confidence === 'high' ? 'default' : 'secondary'}>
                {financialMetrics.profitLoss.confidence}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-lg font-semibold ${
                financialMetrics.profitLoss.type === 'profit' ? 'text-green-700' : 'text-red-700'
              }`}>
                {formatCurrency(financialMetrics.profitLoss.amount, financialMetrics.revenue.currency)}
              </span>
            </div>
          </div>

          {/* Employees */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Employees</span>
              <Badge variant={financialMetrics.employees.confidence === 'high' ? 'default' : 'secondary'}>
                {financialMetrics.employees.confidence}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold">
                {formatEmployees(financialMetrics.employees.total)}
              </span>
              {financialMetrics.employees.growth && getGrowthIndicator(financialMetrics.employees.growth)}
            </div>
            {financialMetrics.employees.growth && (
              <span className="text-xs text-slate-500">
                {parseFloat(financialMetrics.employees.growth) > 0 ? '+' : ''}{(parseFloat(financialMetrics.employees.growth) * 100).toFixed(1)}% YoY
              </span>
            )}
          </div>

          {/* Profit Margin */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-600">Profit Margin</span>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold">
                {calculateProfitMargin()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightSection({ title, icon, insights, description }: InsightSectionProps) {
  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {icon}
            {title}
          </CardTitle>
          <p className="text-sm text-slate-600">{description}</p>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 italic">No specific insights found in this category.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon}
          {title}
        </CardTitle>
        <p className="text-sm text-slate-600">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <ExpandableBadge
              key={index}
              insight={insight}
              displayMode="card"
              showPageReference={true}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analysis() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: upload, isLoading, error } = useQuery({
    queryKey: ['/api/uploads', id],
    queryFn: () => getUploadById(parseInt(id!)),
    enabled: !!id,
  });

  const reanalyzeMutation = useMutation({
    mutationFn: () => reanalyzeUpload(parseInt(id!)),
    onSuccess: () => {
      toast({
        title: "Re-analysis Started",
        description: "The document is being re-analyzed with updated prompts.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/uploads', id] });
    },
    onError: (error) => {
      toast({
        title: "Re-analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const analysisData: AnalysisData | null = upload?.analysisData 
    ? JSON.parse(upload.analysisData) 
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !upload) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Analysis Not Found</h3>
                <p className="text-slate-600 mb-4">
                  The requested analysis could not be found or is not yet available.
                </p>
                <Link href="/">
                  <Button>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (upload.status !== 'completed' || !analysisData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Analysis In Progress</h3>
                <p className="text-slate-600 mb-4">
                  Your file is being processed. This usually takes a few minutes.
                </p>
                <Link href="/">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{upload.fileName}</h1>
                <p className="text-slate-600">
                  Analyzed {formatUploadTime(upload.uploadTime)} • {formatFileSize(upload.fileSize)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => reanalyzeMutation.mutate()}
                disabled={reanalyzeMutation.isPending}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
                <span>{reanalyzeMutation.isPending ? 'Re-analyzing...' : 'Re-analyze'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Analysis Content */}
        <div className="space-y-8">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed">{analysisData.summary}</p>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          {analysisData.financialMetrics && (
            <FinancialSummary financialMetrics={analysisData.financialMetrics} />
          )}

          {/* HR Insights Sections */}
          <div className="grid gap-6">
            <InsightSection 
              title="Business Context" 
              icon={<Building className="w-5 h-5 mr-2 text-primary" />}
              insights={analysisData.businessContext}
              description="Revenue, expansion, and strategic priorities"
            />

            <InsightSection 
              title="Workforce Insights" 
              icon={<Users className="w-5 h-5 mr-2 text-primary" />}
              insights={analysisData.workforceInsights}
              description="Employee data, hiring challenges, and talent initiatives"
            />

            <InsightSection 
              title="Operational Challenges" 
              icon={<AlertTriangle className="w-5 h-5 mr-2 text-primary" />}
              insights={analysisData.operationalChallenges}
              description="Compliance, technology, and efficiency initiatives"
            />

            <InsightSection 
              title="Strategic People Initiatives" 
              icon={<TrendingUp className="w-5 h-5 mr-2 text-primary" />}
              insights={analysisData.strategicPeopleInitiatives}
              description="ESG, remote work, learning, and culture initiatives"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
