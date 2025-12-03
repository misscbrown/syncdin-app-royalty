import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Upload, FileText, CheckCircle2, AlertCircle, RotateCcw, 
  File, Loader2 
} from "lucide-react";
import type { UploadedFile } from "@shared/schema";

type FileType = "distributor" | "royalty_statement" | "metadata";

export default function UploadTracks() {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState<FileType | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRefs = useRef<Record<FileType, HTMLInputElement | null>>({
    distributor: null,
    royalty_statement: null,
    metadata: null,
  });

  const { data: files = [], isLoading } = useQuery<UploadedFile[]>({
    queryKey: ['/api/files'],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, fileType }: { file: File; fileType: FileType }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = useCallback((e: React.DragEvent, fileType: FileType) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(fileType);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, fileType: FileType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const file = droppedFiles[0];
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        uploadMutation.mutate({ file, fileType });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
  }, [uploadMutation, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, fileType: FileType) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv') || selectedFile.type === 'text/csv') {
        uploadMutation.mutate({ file: selectedFile, fileType });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
    e.target.value = '';
  }, [uploadMutation, toast]);

  const handleDropzoneClick = useCallback((fileType: FileType) => {
    fileInputRefs.current[fileType]?.click();
  }, []);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "distributor":
        return "Distributor CSV";
      case "royalty_statement":
        return "Royalty Statement";
      case "metadata":
        return "Metadata Sheet";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-primary";
      case "failed":
        return "text-destructive";
      case "processing":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadOptions: { label: string; type: FileType; icon: typeof File }[] = [
    { label: "Distributor CSVs", type: "distributor", icon: File },
    { label: "Royalty Statements", type: "royalty_statement", icon: File },
    { label: "Metadata Sheets (ISRC lists, etc.)", type: "metadata", icon: File },
  ];

  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-upload-tracks">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-upload-title">
            Upload Files
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload distributor data, royalty statements, and metadata for processing
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Upload Files:
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {uploadOptions.map((item) => {
                const Icon = item.icon;
                const isActive = dragActive === item.type;
                const isUploading = uploadMutation.isPending;

                return (
                  <div key={item.type}>
                    <input
                      ref={(el) => { fileInputRefs.current[item.type] = el; }}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, item.type)}
                      data-testid={`input-file-${item.type}`}
                    />
                    <div
                      onClick={() => !isUploading && handleDropzoneClick(item.type)}
                      onDragEnter={(e) => handleDrag(e, item.type)}
                      onDragLeave={(e) => handleDrag(e, item.type)}
                      onDragOver={(e) => handleDrag(e, item.type)}
                      onDrop={(e) => handleDrop(e, item.type)}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                      data-testid={`dropzone-${item.type}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {isUploading ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          ) : (
                            <Icon className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {isUploading ? "Uploading..." : "Click or drag CSV file"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Upload History:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading files...</p>
                </div>
              ) : files.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                          File
                        </th>
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                          Type
                        </th>
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                          Size
                        </th>
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                          Records
                        </th>
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                          Status
                        </th>
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                          Uploaded
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr
                          key={file.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                          data-testid={`row-file-${file.id}`}
                        >
                          <td className="py-3 px-3 text-foreground">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate max-w-[200px]" title={file.originalName}>
                                {file.originalName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground text-xs">
                            <span className="bg-muted/50 px-2 py-1 rounded-md">
                              {getTypeLabel(file.fileType)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground text-sm">
                            {formatFileSize(file.fileSize)}
                          </td>
                          <td className="py-3 px-3 text-foreground text-sm font-medium">
                            {file.recordCount?.toLocaleString() || '-'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(file.status)}
                              <span className={`text-xs font-medium ${getStatusColor(file.status)}`}>
                                {file.status === "completed"
                                  ? "Completed"
                                  : file.status === "failed"
                                    ? "Failed"
                                    : "Processing"}
                              </span>
                            </div>
                            {file.errorMessage && (
                              <p className="text-xs text-destructive mt-1 truncate max-w-[150px]" title={file.errorMessage}>
                                {file.errorMessage}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground text-sm">
                            {formatDate(file.uploadedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No files uploaded yet</p>
                  <p className="text-sm mt-1">Upload a CSV file to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
