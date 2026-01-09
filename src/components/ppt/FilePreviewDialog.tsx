import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, FileText, AlertCircle } from "lucide-react";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileUrl?: string;
}

/**
 * 文件预览对话框
 * 使用 Google Docs Viewer 或 Microsoft Office Online 预览PPT文件
 * 需要文件URL是公开可访问的
 */
export function FilePreviewDialog({
  open,
  onOpenChange,
  fileName,
  fileUrl,
}: FilePreviewDialogProps) {
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Microsoft Office Online Viewer
  const getMsViewerUrl = (url: string) => {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  };

  // Google Docs Viewer 作为备选
  const getGoogleViewerUrl = (url: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  const handleOpenExternal = () => {
    if (fileUrl) {
      window.open(getMsViewerUrl(fileUrl), "_blank");
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSwitchViewer = () => {
    setUseGoogleViewer(!useGoogleViewer);
    setLoadError(false);
  };

  if (!fileUrl) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{fileName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-lg">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium">暂无可预览的文件</p>
              <p className="text-sm text-muted-foreground mt-1">
                文件URL不可用
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const viewerUrl = useGoogleViewer ? getGoogleViewerUrl(fileUrl) : getMsViewerUrl(fileUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {fileName}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSwitchViewer}>
                {useGoogleViewer ? "切换微软预览" : "切换谷歌预览"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                下载
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                <ExternalLink className="h-4 w-4 mr-1" />
                新窗口
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="relative">
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-warning mb-3" />
                <p className="font-medium">预览加载失败</p>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  请尝试切换预览方式或下载文件查看
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={handleSwitchViewer}>
                    切换预览方式
                  </Button>
                  <Button variant="default" size="sm" onClick={handleDownload}>
                    下载文件
                  </Button>
                </div>
              </div>
            </div>
          )}
          <iframe
            src={viewerUrl}
            className="w-full h-[600px] border border-border rounded-lg"
            title={fileName}
            onError={() => setLoadError(true)}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          使用 {useGoogleViewer ? "Google Docs Viewer" : "Microsoft Office Online"} 预览 · 
          如无法显示请尝试切换预览方式或下载文件
        </p>
      </DialogContent>
    </Dialog>
  );
}
