import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Minimize2, Play } from "lucide-react";
import { PPTistViewer } from "./PPTistViewer";

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
 * 使用PPTist进行PPT在线演示预览
 * 由于本地PPT文件无法直接在浏览器中渲染，使用PPTist作为演示工具
 */
export function FilePreviewDialog({ 
  open,
  onOpenChange,
  fileName,
  file,
  fileUrl
}: FilePreviewDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // 全屏预览模式 - 最大化PPTist展示区域
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50 shrink-0">
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
              <Minimize2 className="h-4 w-4 mr-2" />
              退出全屏
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <PPTistViewer
            title={fileName}
            height="100%"
            className="h-full border-0 rounded-none"
            mode="screen"
            defaultScreen={true}
          />
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/30 text-center shrink-0">
          <p className="text-xs text-muted-foreground">
            <Play className="h-3 w-3 inline mr-1" />
            提示：点击PPT区域内的 "从头开始" 或 "从当前开始" 按钮进入纯放映模式（无编辑区域）
          </p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {fileName}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
                全屏预览
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                下载
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* PPTist 预览区域 - 放大展示 */}
        <div className="flex-1 overflow-hidden">
          <PPTistViewer
            title={fileName}
            height="100%"
            className="h-full border-0 rounded-none"
            mode="screen"
            defaultScreen={true}
          />
        </div>
        
        {/* 使用提示 */}
        <div className="px-6 py-3 border-t border-border bg-muted/30 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            <Play className="h-3 w-3 inline mr-1" />
            提示：点击PPT区域内的 "从头开始" 或 "从当前开始" 按钮进入纯放映模式（无编辑区域）
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
