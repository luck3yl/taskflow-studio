import { useState, useMemo } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Maximize2 } from "lucide-react";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 文件名 */
  fileName: string;
  /** 本地文件对象 (优先使用) */
  file?: File | null;
  /** 文件 URL (备用) */
  fileUrl?: string;
}

/**
 * 文件预览对话框
 * 
 * 使用 @cyntler/react-doc-viewer 在浏览器中直接渲染文档
 * 支持 PPTX, DOCX, PDF 等多种格式
 */
export function FilePreviewDialog({ 
  open,
  onOpenChange,
  fileName,
  file,
  fileUrl
}: FilePreviewDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 生成用于预览的文档配置
  const docs = useMemo(() => {
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      return [{ 
        uri: blobUrl,
        fileName: file.name,
      }];
    } else if (fileUrl) {
      return [{ 
        uri: fileUrl,
        fileName: fileName,
      }];
    }
    return [];
  }, [file, fileUrl, fileName]);

  const handleDownload = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } else if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  // 全屏预览
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium">{fileName}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              下载
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(false)}>
              退出全屏
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {docs.length > 0 ? (
            <DocViewer
              documents={docs}
              pluginRenderers={DocViewerRenderers}
              config={{
                header: { disableHeader: true },
                pdfVerticalScrollByDefault: true
              }}
              style={{ height: "100%" }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">无法预览此文件</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {fileName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
            <Maximize2 className="h-4 w-4 mr-2" />
            全屏
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            下载
          </Button>
        </div>

        <div className="flex-1 overflow-hidden rounded-lg border border-border min-h-[500px]">
          {docs.length > 0 ? (
            <DocViewer
              documents={docs}
              pluginRenderers={DocViewerRenderers}
              config={{
                header: { disableHeader: true },
                pdfVerticalScrollByDefault: true
              }}
              style={{ height: "100%", minHeight: "500px" }}
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[500px] bg-muted/30">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">无法预览此文件</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  下载文件
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
