import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, TrendingUp, Users, AlertTriangle, Target, Building, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/header";
import { getUploadById } from "@/services/upload";
import { formatFileSize, formatUploadTime } from "@/utils/file";
import { Link } from "wouter";
import VisualizationControls, { type ViewMode } from "@/components/visualization/visualization-controls";
import type { AnalysisData, HRInsight } from "@/types/upload";

interface InsightSectionProps {
  title: string;
  icon: React.ReactNode;
  insights: HRInsight[];
  description: string;
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
        <div className="space-y-6">
          {insights.map((insight, index) => (
            <div key={index} className="border-l-4 border-primary/20 pl-4">
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-sm text-slate-600 font-medium mb-1">Data Point:</p>
                  <p className="text-slate-800">{insight.dataPoint}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium mb-1">HR Relevance:</p>
                  <p className="text-blue-800">{insight.hrRelevance}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-1">Conversation Starter:</p>
                  <p className="text-green-900 font-medium">"{insight.conversationStarter}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analysis() {
  const { id } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  
  const { data: upload, isLoading, error } = useQuery({
    queryKey: ['/api/uploads', id],
    queryFn: () => getUploadById(parseInt(id!)),
    enabled: !!id,
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
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          </div>
        </div>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Text View
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Visual View
            </TabsTrigger>
            <TabsTrigger value="combined" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Combined View
            </TabsTrigger>
          </TabsList>

          {/* Text View */}
          <TabsContent value="text" className="space-y-6">
            {/* Summary */}
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

            {/* Business Context */}
            <InsightSection 
              title="Business Context" 
              icon={<Building className="w-5 h-5 mr-2 text-primary" />}
              insights={analysisData.businessContext}
              description="Revenue, expansion, and strategic priorities"
            />

            {/* Workforce Insights */}
            <InsightSection 
              title="Workforce Insights" 
              icon={<Users className="w-5 h-5 mr-2 text-primary" />}
              insights={analysisData.workforceInsights}
              description="Employee data, hiring challenges, and talent initiatives"
            />

            {/* Operational Challenges */}
            <InsightSection 
              title="Operational Challenges" 
              icon={<AlertTriangle className="w-5 h-5 mr-2 text-primary" />}
              insights={analysisData.operationalChallenges}
              description="Compliance, technology, and efficiency initiatives"
            />

            {/* Strategic People Initiatives */}
            <InsightSection 
              title="Strategic People Initiatives" 
              icon={<TrendingUp className="w-5 h-5 mr-2 text-primary" />}
              insights={analysisData.strategicPeopleInitiatives}
              description="ESG, remote work, learning, and culture initiatives"
            />
          </TabsContent>

          {/* Visual View */}
          <TabsContent value="visual">
            <VisualizationControls 
              analysisData={analysisData}
              fileName={upload.fileName}
              defaultView="visual"
              onViewModeChange={setViewMode}
            />
          </TabsContent>

          {/* Combined View */}
          <TabsContent value="combined" className="space-y-8">
            {/* Executive Summary with Charts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed mb-6">{analysisData.summary}</p>
                
                {/* Key Metrics Dashboard */}
                <VisualizationControls 
                  analysisData={analysisData}
                  fileName={upload.fileName}
                  defaultView="combined"
                  onViewModeChange={setViewMode}
                />
              </CardContent>
            </Card>

            {/* Text Insights with Expandable Details */}
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
