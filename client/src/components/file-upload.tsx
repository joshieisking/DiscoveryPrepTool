import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cloud, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/services/upload";
import { validateFile, formatFileSize } from "@/utils/file";
import { useToast } from "@/hooks/use-toast";
import type { UploadProgress } from "@/types/upload";

export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
      setUploadProgress(null);
      toast({
        title: "Upload Successful",
        description: "Your file has been uploaded and is being processed.",
      });
    },
    onError: (error) => {
      setUploadProgress(null);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setUploadProgress({
      fileName: file.name,
      progress: 0,
      isUploading: true,
    });

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (!prev || prev.progress >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, progress: prev.progress + Math.random() * 20 };
      });
    }, 200);

    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <section className="mb-16">
      <div className="max-w-2xl mx-auto">
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-slate-300 hover:border-primary hover:bg-primary/5"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInputChange}
          />

          {uploadProgress?.isUploading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Uploading File...</h3>
              <p className="text-slate-600 mb-4">{uploadProgress.fileName}</p>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              <p className="text-sm text-slate-600">
                Processing... {Math.round(uploadProgress.progress)}%
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Cloud className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Annual Report</h3>
              <p className="text-slate-600 mb-6">
                Drag and drop your PDF file here, or click to browse
              </p>
              
              <Button className="inline-flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Choose File</span>
              </Button>
              
              <div className="mt-6 text-sm text-slate-500">
                <p>Supported formats: PDF, DOC, DOCX • Max size: 50MB</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
