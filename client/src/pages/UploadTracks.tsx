import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileAudio, CheckCircle } from "lucide-react";

export default function UploadTracks() {
  return (
    <AppLayout>
      <div className="space-y-6" data-testid="page-upload-tracks">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-upload-title">Upload Tracks</h1>
          <p className="text-muted-foreground mt-1">Add new tracks to your catalog for royalty tracking</p>
        </div>

        <Card className="bg-card border-border border-dashed">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Drop files here or click to upload</h3>
                <p className="text-muted-foreground text-sm mt-1">Supports MP3, WAV, FLAC up to 100MB</p>
              </div>
              <Button data-testid="button-browse-files">
                <FileAudio className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Upload Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "Include accurate metadata (title, artist, ISRC)",
                "Use high-quality audio files for best matching",
                "Ensure you have rights to upload content",
                "Files will be processed within 24 hours"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
