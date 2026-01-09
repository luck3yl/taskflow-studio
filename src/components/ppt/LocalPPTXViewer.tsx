import { useState, useMemo } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Maximize2, Minimize2, FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocalPPTXViewerProps {
  /** 本地文件对象 */
  file?: File | null;
  /** 文件的 blob URL (用于已存储的文件) */
  fileUrl?: string;
  /** 预览标题 */
  title?: string;
  /** 预览区域高度 */
  height?: string;
  /** 额外的CSS类名 */
  className?: string;
  /** 是否显示上传提示（当没有文件时） */
  showUploadHint?: boolean;
  /** 作为对话框使用 */
  asDialog?: boolean;
  /** 对话框是否打开 */
  open?: boolean;
  /** 对话框关闭回调 */
  onOpenChange?: (open: boolean) => void;
}

/**
 * 本地 PPTX 预览组件
 * 
 * 使用 @cyntler/react-doc-viewer 在浏览器中直接渲染 PPTX 文件
 * 支持本地 File 对象，无需公网 URL
 */
export function LocalPPTXViewer({ 
  file,
  fileUrl,
  title = "PPT预览", 
  height = "500px",
  className = "",
  showUploadHint = true,
  asDialog = false,
  open = false,
  onOpenChange
}: LocalPPTXViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 生成用于预览的文档配置
  const docs = useMemo(() => {
    if (file) {
      // 本地文件使用 blob URL
      const blobUrl = URL.createObjectURL(file);
      return [{ 
        uri: blobUrl,
        fileName: file.name,
        fileType: file.name.endsWith('.pptx') 
          ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          : file.name.endsWith('.ppt')
            ? 'application/vnd.ms-powerpoint'
            : undefined
      }];
    } else if (fileUrl) {
      return [{ uri: fileUrl }];
    }
    return [];
  }, [file, fileUrl]);

  // 无文件时显示占位符
  const renderPlaceholder = () => (
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
              请先上传PPT文件
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
  );

  // 预览内容
  const renderPreview = () => {
    if (docs.length === 0) {
      return renderPlaceholder();
    }

    return (
      <div style={{ height }} className="overflow-hidden">
        <DocViewer
          documents={docs}
          pluginRenderers={DocViewerRenderers}
          config={{
            header: {
              disableHeader: true,
              disableFileName: true,
              retainURLParams: false
            },
            pdfVerticalScrollByDefault: true
          }}
          style={{ height: "100%" }}
        />
      </div>
    );
  };

  // 作为对话框渲染
  if (asDialog) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
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
            onClick={() => setIsFullscreen(false)}
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            退出全屏
          </Button>
        </div>
        <div className="w-full h-full">
          {docs.length > 0 ? (
            <DocViewer
              documents={docs}
              pluginRenderers={DocViewerRenderers}
              config={{
                header: {
                  disableHeader: false,
                  disableFileName: false,
                },
                pdfVerticalScrollByDefault: true
              }}
              style={{ height: "100%" }}
            />
          ) : (
            renderPlaceholder()
          )}
        </div>
      </div>
    );
  }

  // 普通模式
  return (
    <div className={cn("rounded-lg overflow-hidden border border-border", className)}>
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <div className="flex gap-2">
          {docs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(true)}
              className="h-7 px-2"
            >
              <Maximize2 className="h-3.5 w-3.5 mr-1" />
              全屏
            </Button>
          )}
        </div>
      </div>
      {renderPreview()}
    </div>
  );
}
