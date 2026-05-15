import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Maximize2, Minimize2 } from "lucide-react";
import { PdfSlideViewer } from "./PdfSlideViewer";
import { extractFileIdFromUrl } from "@/services/apis/files";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 文件名 */
  fileName: string;
  /** 文件 ID（优先使用） */
  fileId?: string;
  /**
   * 兼容老调用方：仅传 fileUrl 时会自动从 URL 中反解 fileId
   * fileUrl 形如 ${baseURL}/api/v1/files/{fileId}
   */
  fileUrl?: string;
  /** 仅显示指定页码（1-based） */
  visiblePages?: Set<number>;
}

/**
 * 文件预览对话框
 *
 * 左右布局：左侧页码缩略图列表 + 右侧当前页大图
 * 后端 `/api/v1/files/{fileId}/preview` 返回 PDF 流，
 * 通过 pdfjs-dist 逐页渲染。
 */
export function FilePreviewDialog({
  open,
  onOpenChange,
  fileName,
  fileId,
  fileUrl,
  visiblePages,
}: FilePreviewDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const resolvedFileId = useMemo(
    () => fileId || extractFileIdFromUrl(fileUrl),
    [fileId, fileUrl],
  );

  // 全屏模式
  if (open && isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium truncate">{fileName}</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(false)}>
              <Minimize2 className="h-4 w-4 mr-2" />
              退出全屏
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <PdfSlideViewer
            fileId={resolvedFileId}
            fileName={fileName}
            height="100%"
            layout="left-right"
            className="h-full"
            visiblePages={visiblePages}
          />
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">{fileName}</span>
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(true)}
              className="shrink-0 mr-6"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              全屏
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <PdfSlideViewer
            fileId={resolvedFileId}
            fileName={fileName}
            height="100%"
            layout="left-right"
            className="h-full"
            visiblePages={visiblePages}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
