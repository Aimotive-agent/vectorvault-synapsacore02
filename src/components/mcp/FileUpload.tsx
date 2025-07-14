import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, File, X, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileAnalyzed: (analysis: string, fileName: string) => void;
  className?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  analysis?: string;
}

export const FileUpload = ({ onFileAnalyzed, className }: FileUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload files",
          variant: "destructive",
        });
        return;
      }

      for (const file of Array.from(files)) {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 10MB`,
            variant: "destructive",
          });
          continue;
        }

        // Check file type
        const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf', 'text/csv', 'application/json'];
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Unsupported file type",
            description: `${file.name} is not a supported file type`,
            variant: "destructive",
          });
          continue;
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('ai-chat-files')
          .upload(fileName, file);

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('ai-chat-files')
          .getPublicUrl(fileName);

        const uploadedFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);

        // Analyze the file content
        await analyzeFile(uploadedFile);
      }

      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) uploaded and ready for analysis`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const analyzeFile = async (file: UploadedFile) => {
    setIsAnalyzing(true);

    try {
      // Read file content for analysis
      let content = '';
      
      if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'text/csv') {
        const response = await fetch(file.url);
        content = await response.text();
      } else if (file.type === 'application/json') {
        const response = await fetch(file.url);
        const jsonData = await response.json();
        content = JSON.stringify(jsonData, null, 2);
      } else if (file.type === 'application/pdf') {
        content = `PDF file: ${file.name} (${(file.size / 1024).toFixed(1)} KB) - PDF content analysis requires additional processing.`;
      }

      // Generate analysis
      const analysis = `📄 **File Analysis: ${file.name}**

**File Details:**
- Type: ${file.type}
- Size: ${(file.size / 1024).toFixed(1)} KB
- Uploaded: ${new Date().toLocaleString()}

**Content Preview:**
${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}

This file has been uploaded and is ready for AI analysis. You can ask me questions about its content, request summaries, or have me process the data in various ways.`;

      // Update the file with analysis
      setUploadedFiles(prev => 
        prev.map(f => f.id === file.id ? { ...f, analysis } : f)
      );

      // Notify parent component
      onFileAnalyzed(analysis, file.name);
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast({
        title: "Analysis failed",
        description: `Failed to analyze ${file.name}`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      const file = uploadedFiles.find(f => f.id === fileId);
      if (!file) return;

      // Remove from storage
      const fileName = file.url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('ai-chat-files')
          .remove([fileName]);
      }

      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
        <div className="p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.csv,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          
          <Button
            onClick={handleFileSelect}
            disabled={isUploading}
            variant="outline"
            className="mb-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </>
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Upload text files, PDFs, CSVs, or JSON files for AI analysis
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max 10MB per file • Supported: .txt, .md, .pdf, .csv, .json
          </p>
        </div>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          {uploadedFiles.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.analysis && (
                    <Badge variant="outline" className="text-success border-success/50">
                      Analyzed
                    </Badge>
                  )}
                  {isAnalyzing && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Button
                    onClick={() => removeFile(file.id)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};