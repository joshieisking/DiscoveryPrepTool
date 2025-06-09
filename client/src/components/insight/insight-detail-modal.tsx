
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, MessageSquare, Lightbulb, MapPin } from "lucide-react";
import { HRInsight } from "@/types/upload";

interface InsightDetailModalProps {
  insight: HRInsight;
  isOpen: boolean;
  onClose: () => void;
}

export function InsightDetailModal({ insight, isOpen, onClose }: InsightDetailModalProps) {
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "bg-gray-500";
    if (confidence >= 8) return "bg-green-500";
    if (confidence >= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return "Unknown";
    if (confidence >= 8) return "High";
    if (confidence >= 6) return "Medium";
    return "Low";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            HR Insight Details
          </DialogTitle>
          <DialogDescription>
            Complete insight with source context and validation information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Confidence and Source Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {insight.confidence && (
                <Badge variant="outline" className="gap-1">
                  <div 
                    className={`w-2 h-2 rounded-full ${getConfidenceColor(insight.confidence)}`}
                  />
                  {getConfidenceLabel(insight.confidence)} Confidence ({insight.confidence}/10)
                </Badge>
              )}
            </div>
            {insight.pageReference && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {insight.pageReference}
              </div>
            )}
          </div>

          {/* Data Point */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">Data Point</h3>
            </div>
            <p className="text-sm leading-relaxed bg-gray-50 p-3 rounded-md">
              {insight.dataPoint}
            </p>
          </div>

          <Separator />

          {/* HR Relevance */}
          <div className="space-y-2">
            <h3 className="font-semibold text-green-700">Why This Matters to HR</h3>
            <p className="text-sm leading-relaxed">
              {insight.hrRelevance}
            </p>
          </div>

          <Separator />

          {/* Conversation Starter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-purple-700">Suggested Discovery Question</h3>
            </div>
            <p className="text-sm leading-relaxed bg-purple-50 p-3 rounded-md italic">
              "{insight.conversationStarter}"
            </p>
          </div>

          {/* Source Context */}
          {insight.sourceContext && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Source Context</h3>
                <p className="text-xs leading-relaxed text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-gray-300">
                  {insight.sourceContext}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
