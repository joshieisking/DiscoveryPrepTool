
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { HRInsight } from "server/services/gemini";
import { InsightDetailModal } from "./insight-detail-modal";

interface ExpandableBadgeProps {
  insight: HRInsight;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function ExpandableBadge({ insight, variant = "secondary", className }: ExpandableBadgeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Truncate for badge display
  const truncatedText = insight.dataPoint.length > 50 
    ? `${insight.dataPoint.substring(0, 50)}...` 
    : insight.dataPoint;
  
  // Preview text for tooltip (longer than badge, shorter than full)
  const previewText = insight.dataPoint.length > 200 
    ? `${insight.dataPoint.substring(0, 200)}...` 
    : insight.dataPoint;

  const handleBadgeClick = () => {
    setIsModalOpen(true);
  };

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
