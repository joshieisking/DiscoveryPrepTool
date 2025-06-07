import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { FileText, CheckCircle, Loader2, AlertTriangle, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUploads, deleteUpload } from "@/services/upload";
import { formatFileSize, formatUploadTime } from "@/utils/file";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { UploadFile } from "@/types/upload";

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    case 'failed':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    default:
      return <FileText className="w-4 h-4 text-slate-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

export default function UploadHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: uploads = [], isLoading } = useQuery({
    queryKey: ['/api/uploads'],
    queryFn: getUploads,
  });

  // Set up polling for processing uploads
  useEffect(() => {
    const hasProcessing = uploads.some(upload => upload.status === 'processing');
    
    if (hasProcessing) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [uploads, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: deleteUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
      toast({
        title: "File Deleted",
        description: "The file has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <section>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">Upload History</CardTitle>
            <span className="text-sm text-slate-500">
              {uploads.length} file{uploads.length !== 1 ? 's' : ''} processed
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {uploads.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-medium text-slate-600 mb-2">No uploads yet</h4>
              <p className="text-slate-500">Your uploaded files and analysis results will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {uploads.map((upload) => (
                <div key={upload.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">{upload.fileName}</h4>
                        <p className="text-sm text-slate-500">
                          {formatUploadTime(upload.uploadTime)} • {formatFileSize(upload.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                        {getStatusIcon(upload.status)}
                        <span className="ml-1 capitalize">{upload.status}</span>
                      </span>
                      {upload.status === 'completed' && (
                        <Link href={`/analysis/${upload.id}`}>
                          <Button variant="outline" size="sm" className="text-primary">
                            <Eye className="w-4 h-4 mr-1" />
                            View Analysis
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(upload.id)}
                        className="text-slate-500 hover:text-red-600"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
