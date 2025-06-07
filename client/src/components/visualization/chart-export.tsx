import { useState } from "react";
import { Download, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { ChartConfig } from "./chart-factory";

interface ChartExportProps {
  configs: ChartConfig[];
  fileName: string;
}

export default function ChartExport({ configs, fileName }: ChartExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPNG = async () => {
    setIsExporting(true);
    try {
      const html2canvas = await import('html2canvas');
      
      // Find all chart containers
      const chartElements = document.querySelectorAll('[data-chart]');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx || chartElements.length === 0) {
        throw new Error('No charts found to export');
      }

      // Set canvas dimensions for multiple charts
      const chartWidth = 800;
      const chartHeight = 600;
      canvas.width = chartWidth;
      canvas.height = chartHeight * chartElements.length;

      // Capture each chart
      for (let i = 0; i < chartElements.length; i++) {
        const element = chartElements[i] as HTMLElement;
        const chartCanvas = await html2canvas.default(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        
        ctx.drawImage(chartCanvas, 0, i * chartHeight, chartWidth, chartHeight);
      }

      // Download the combined image
      const link = document.createElement('a');
      link.download = `${fileName.replace(/\.[^/.]+$/, '')}_charts.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: "Export Successful",
        description: "Charts exported as PNG image",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export charts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const jsPDF = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      const pdf = new jsPDF.jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add title page
      pdf.setFontSize(20);
      pdf.text('HR Analytics Report', pageWidth / 2, 30, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated from: ${fileName}`, pageWidth / 2, 40, { align: 'center' });
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 50, { align: 'center' });

      // Add charts
      const chartElements = document.querySelectorAll('[data-chart]');
      
      for (let i = 0; i < chartElements.length; i++) {
        if (i > 0 || chartElements.length > 0) {
          pdf.addPage();
        }
        
        const element = chartElements[i] as HTMLElement;
        const canvas = await html2canvas.default(element, {
          backgroundColor: '#ffffff',
          scale: 1,
          useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, Math.min(imgHeight, pageHeight - 40));
        
        // Add chart title
        const config = configs[i];
        if (config) {
          pdf.setFontSize(14);
          pdf.text(config.title, 10, 15);
        }
      }

      pdf.save(`${fileName.replace(/\.[^/.]+$/, '')}_charts.pdf`);

      toast({
        title: "Export Successful",
        description: "Charts exported as PDF document",
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportInsightsAsText = () => {
    const content = configs.map(config => {
      const insightText = config.insights.map(insight => 
        `• ${insight.dataPoint}\n  HR Relevance: ${insight.hrRelevance}\n  Conversation Starter: "${insight.conversationStarter}"\n`
      ).join('\n');
      
      return `${config.title}\n${'='.repeat(config.title.length)}\n${config.description}\n\nKey Insights:\n${insightText}\n`;
    }).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}_insights.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Insights exported as text file",
    });
  };

  if (configs.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPNG}>
          <FileImage className="w-4 h-4 mr-2" />
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportInsightsAsText}>
          <FileText className="w-4 h-4 mr-2" />
          Export Insights as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}