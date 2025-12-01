import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertCircle, RotateCcw, File } from "lucide-react";

interface FileHistoryItem {
  id: string;
  filename: string;
  type: "distributor_csv" | "royalty_statement" | "metadata_sheet";
  status: "success" | "failed" | "pending";
  processedDate: string;
  uploadedDate: string;
}

export default function UploadTracks() {
  const [dragActive, setDragActive] = useState(false);
  const [fileHistory] = useState<FileHistoryItem[]>([
    {
      id: "1",
      filename: "spotify_streams_november.csv",
      type: "distributor_csv",
      status: "success",
      processedDate: "Nov 28, 2024",
      uploadedDate: "Nov 27, 2024",
    },
    {
      id: "2",
      filename: "royalty_statement_q4.csv",
      type: "royalty_statement",
      status: "success",
      processedDate: "Nov 25, 2024",
      uploadedDate: "Nov 24, 2024",
    },
    {
      id: "3",
      filename: "isrc_metadata_list.xlsx",
      type: "metadata_sheet",
      status: "failed",
      processedDate: "Nov 22, 2024",
      uploadedDate: "Nov 22, 2024",
    },
  ]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const getTypeLabel = (
    type: "distributor_csv" | "royalty_statement" | "metadata_sheet"
  ) => {
    switch (type) {
      case "distributor_csv":
        return "Distributor CSV";
      case "royalty_statement":
        return "Royalty Statement";
      case "metadata_sheet":
        return "Metadata Sheet";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-primary";
      case "failed":
        return "text-destructive";
      case "pending":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "pending":
        return <FileText className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

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

        {/* Upload Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              User uploads:
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Distributor CSVs", icon: File },
                { label: "Royalty Statements", icon: File },
                { label: "Metadata Sheets (ISRC lists, etc.)", icon: File },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 cursor-pointer ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`dropzone-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">Click or drag files</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <Button className="w-full" data-testid="button-browse-files">
                <Upload className="w-4 h-4 mr-2" />
                Browse and Upload Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File History Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              User sees:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fileHistory.length > 0 ? (
                <>
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
                            Status
                          </th>
                          <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                            Last Processed
                          </th>
                          <th className="text-right py-3 px-3 text-muted-foreground font-medium">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileHistory.map((file) => (
                          <tr
                            key={file.id}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                            data-testid={`row-file-${file.id}`}
                          >
                            <td className="py-3 px-3 text-foreground flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{file.filename}</span>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground text-xs">
                              <span className="bg-muted/50 px-2 py-1 rounded-md">
                                {getTypeLabel(file.type)}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(file.status)}
                                <span className={`text-xs font-medium ${getStatusColor(file.status)}`}>
                                  {file.status === "success"
                                    ? "Parse Success"
                                    : file.status === "failed"
                                      ? "Parse Failed"
                                      : "Pending"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground text-sm">
                              {file.processedDate}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary"
                                data-testid={`button-rerun-${file.id}`}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      variant="outline"
                      className="gap-2"
                      data-testid="button-rerun-all-matching"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Re-run matching
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No files uploaded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
