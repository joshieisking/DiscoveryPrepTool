
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HRInsight } from "@/types/upload";
import { InsightDetailModal } from "./insight-detail-modal";

interface ExpandableBadgeProps {
  insight: HRInsight;
  variant?: "default" | "secondary" | "destructive" | "outline";
  displayMode?: "badge" | "card";
  showPageReference?: boolean;
  className?: string;
}

export function ExpandableBadge({ 
  insight, 
  variant = "secondary", 
  displayMode = "badge",
  showPageReference = false,
  className 
}: ExpandableBadgeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleBadgeClick = () => {
    setIsModalOpen(true);
  };

  // Badge mode (existing functionality)
  if (displayMode === "badge") {
    // Truncate for badge display
    const truncatedText = insight.dataPoint.length > 50 
      ? `${insight.dataPoint.substring(0, 50)}...` 
      : insight.dataPoint;
    
    // Preview text for tooltip (longer than badge, shorter than full)
    const previewText = insight.dataPoint.length > 200 
      ? `${insight.dataPoint.substring(0, 200)}...` 
      : insight.dataPoint;

    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={variant} 
                className={cn(
                  "text-xs cursor-pointer hover:opacity-80 transition-opacity",
                  "border-dashed border-2", // Visual indicator of expandability
                  className
                )}
                onClick={handleBadgeClick}
              >
                {truncatedText}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm p-3">
              <div className="space-y-2">
                <p className="font-medium text-sm">{previewText}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {insight.confidence && `Confidence: ${insight.confidence}/10`}
                  </span>
                  <span>Click for details</span>
                </div>
                {insight.pageReference && (
                  <p className="text-xs text-muted-foreground">
                    Source: {insight.pageReference}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <InsightDetailModal 
          insight={insight}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  // Card mode (new functionality)
  return (
    <Card className={cn("mb-4 border-l-4 border-l-blue-500", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-slate-700">
                {insight.dataPoint}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {showPageReference && insight.pageReference && (
                <Badge variant="outline" className="text-xs">
                  {insight.pageReference}
                </Badge>
              )}
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer p-1 hover:bg-slate-100 rounded">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-slate-900 mb-1">HR Relevance</h4>
                <p className="text-slate-600 leading-relaxed">{insight.hrRelevance}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-900 mb-1">Conversation Starter</h4>
                <p className="text-slate-600 leading-relaxed italic">"{insight.conversationStarter}"</p>
              </div>
              
              {insight.strategicImplications && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">Strategic Implications</h4>
                  <p className="text-slate-600 leading-relaxed">{insight.strategicImplications}</p>
                </div>
              )}
              
              {insight.sourceContext && (
                <div className="bg-slate-50 p-3 rounded-md">
                  <h4 className="font-medium text-slate-900 mb-1">Source Context</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{insight.sourceContext}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {insight.confidence && (
                    <span>Confidence: {insight.confidence}/10</span>
                  )}
                  {insight.pageReference && (
                    <span>Source: {insight.pageReference}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
