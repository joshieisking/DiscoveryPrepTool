import { useState } from "react";
import { BarChart3, FileText, Eye, EyeOff, Palette, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ChartRenderer from "./chart-renderer";
import ChartExport from "./chart-export";
import { ChartFactory, chartTemplates, type ChartConfig } from "./chart-factory";
import type { AnalysisData } from "@/types/upload";

export type ViewMode = 'text' | 'visual' | 'combined';

interface VisualizationControlsProps {
  analysisData: AnalysisData;
  fileName: string;
  defaultView?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

const colorSchemes = [
  {
    name: 'Default',
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  },
  {
    name: 'Corporate',
    colors: ['#1e40af', '#059669', '#d97706', '#dc2626', '#7c3aed']
  },
  {
    name: 'Presentation',
    colors: ['#0f172a', '#374151', '#6b7280', '#9ca3af', '#d1d5db']
  },
  {
    name: 'High Contrast',
    colors: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff']
  }
];

export default function VisualizationControls({ 
  analysisData, 
  fileName, 
  defaultView = 'combined',
  onViewModeChange 
}: VisualizationControlsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  const [colorScheme, setColorScheme] = useState(colorSchemes[0]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>(() => {
    return ChartFactory.generateChartConfigs(analysisData);
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  const handleChartSelection = (chartId: string) => {
    setSelectedCharts(prev => 
      prev.includes(chartId) 
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  const handleColorSchemeChange = (schemeName: string) => {
    const scheme = colorSchemes.find(s => s.name === schemeName);
    if (scheme) {
      setColorScheme(scheme);
      // Update chart configs with new colors
      setChartConfigs(prev => prev.map(config => ({
        ...config,
        colors: scheme.colors
      })));
    }
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const newConfigs = ChartFactory.generateChartConfigs(analysisData);
      setChartConfigs(newConfigs.map(config => ({
        ...config,
        colors: colorScheme.colors
      })));
      setIsRegenerating(false);
    }, 1000);
  };

  const visibleCharts = selectedCharts.length > 0 
    ? chartConfigs.filter((_, index) => selectedCharts.includes(index.toString()))
    : chartConfigs;

  if (viewMode === 'text') {
    return null; // Text view is handled by the parent component
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Visual Analytics</h3>
            <p className="text-sm text-muted-foreground">
              {chartConfigs.length} charts generated from analysis
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={colorScheme.name} onValueChange={handleColorSchemeChange}>
            <SelectTrigger className="w-40">
              <Palette className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorSchemes.map(scheme => (
                <SelectItem key={scheme.name} value={scheme.name}>
                  {scheme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          
          <ChartExport configs={visibleCharts} fileName={fileName} />
        </div>
      </div>

      {/* Chart Selection */}
      {chartConfigs.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Available Visualizations</h4>
              <div className="flex flex-wrap gap-2">
                {chartConfigs.map((config, index) => (
                  <Badge
                    key={index}
                    variant={selectedCharts.includes(index.toString()) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleChartSelection(index.toString())}
                  >
                    {selectedCharts.includes(index.toString()) ? (
                      <Eye className="w-3 h-3 mr-1" />
                    ) : (
                      <EyeOff className="w-3 h-3 mr-1" />
                    )}
                    {config.title}
                  </Badge>
                ))}
              </div>
              {selectedCharts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCharts([])}
                >
                  Show All Charts
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Display */}
      <div className="space-y-8">
        {visibleCharts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No Visualizations Available
                </h3>
                <p className="text-sm text-muted-foreground">
                  Unable to generate charts from the current analysis data.
                  Try regenerating or switch to text view for detailed insights.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          visibleCharts.map((config, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <ChartRenderer config={config} />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Chart Templates Info */}
      {chartConfigs.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Available Chart Templates</h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {chartTemplates.map(template => {
                  const hasData = chartConfigs.some(config => 
                    config.title.toLowerCase().includes(template.name.toLowerCase().split(' ')[0])
                  );
                  return (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg text-center ${
                        hasData ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-muted'
                      }`}
                    >
                      <div className="text-sm font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </div>
                      {hasData && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Generated
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}