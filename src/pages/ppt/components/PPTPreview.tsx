import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, ExternalLink, FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface PPTPreviewProps {
  /** PPT文件的公开URL地址，用于Office Online预览 */
  fileUrl?: string;
  /** 预览标题 */
  title?: string;
  /** 预览区域高度 */
  height?: string;
  /** 额外的CSS类名 */
  className?: string;
  /** 是否显示上传提示（当没有fileUrl时） */
  showUploadHint?: boolean;
}

/**
 * PPT预览组件 - 使用 Microsoft Office Online Viewer 预览真实PPT文件
 * 
 * 支持预览公开可访问的 .ppt, .pptx 文件
 * 需要文件有公网可访问的URL
 */
export function PPTPreview({ 
  fileUrl,
  title = "PPT预览", 
  height = "500px",
  className = "",
  showUploadHint = true
}: PPTPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Office Online Viewer URL
  const getViewerUrl = (url: string) => {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  };

  // Google Docs Viewer as fallback
  const getGoogleViewerUrl = (url: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  const handleOpenExternal = () => {
    if (fileUrl) {
      window.open(getViewerUrl(fileUrl), "_blank");
    }
  };

  // 无文件URL时显示占位符
  if (!fileUrl) {
    return (
      <div className={cn("rounded-lg overflow-hidden border border-border", className)}>
        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <div 
          style={{ height }}
          className="flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/50"
        >
          <div className="text-center p-8">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
            {showUploadHint ? (
              <>
                <p className="text-lg font-medium text-foreground">暂无可预览的PPT文件</p>
                <p className="text-sm text-muted-foreground mt-1">
                  请先上传PPT文件或等待提交
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  上传PPT
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">PPT 预览区域</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 全屏模式
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenExternal}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            新窗口打开
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsFullscreen(false)}
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            退出全屏
          </Button>
        </div>
        <iframe
          src={previewError ? getGoogleViewerUrl(fileUrl) : getViewerUrl(fileUrl)}
          className="w-full h-full border-0"
          title={title}
          onError={() => setPreviewError(true)}
        />
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg overflow-hidden border border-border", className)}>
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            className="h-7 px-2"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            新窗口
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(true)}
            className="h-7 px-2"
          >
            <Maximize2 className="h-3.5 w-3.5 mr-1" />
            全屏
          </Button>
        </div>
      </div>
      <iframe
        src={previewError ? getGoogleViewerUrl(fileUrl) : getViewerUrl(fileUrl)}
        style={{ height }}
        className="w-full border-0"
        title={title}
        onError={() => setPreviewError(true)}
      />
    </div>
  );
}
