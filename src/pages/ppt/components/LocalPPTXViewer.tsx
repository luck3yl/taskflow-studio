import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { PdfPreviewer } from "./PdfPreviewer";
import { extractFileIdFromUrl } from "@/services/apis/files";

interface LocalPPTXViewerProps {
  /** 已上传到后端的文件 ID（优先） */
  fileId?: string;
  /** 已上传到后端的文件 URL（次选，会自动反解 fileId） */
  fileUrl?: string;
  /**
   * 仅本地选中、还未上传的 File 对象。
   * 后端转 PDF 流是基于 fileId 的，所以纯本地文件无法预览，
   * 这里只显示文件名提示，等上传成功拿到 fileId 后再切到 PDF 预览。
   */
  file?: File | null;
  /** 预览标题（仅装饰） */
  title?: string;
  /** 预览区高度 */
  height?: string;
  /** 额外类名 */
  className?: string;
  /** 是否显示上传提示 */
  showUploadHint?: boolean;
}

/**
 * PPT 模板预览组件（兼容历史调用名）
 *
 * 实际渲染走 PdfPreviewer：后端把 .ppt/.pptx 转成 PDF 流后由 iframe 显示。
 * 仅本地未上传的 File 对象无法预览，显示占位。
 */
export function LocalPPTXViewer({
  fileId,
  fileUrl,
  file,
  title = "",
  height = "500px",
  className = "",
  showUploadHint = true,
}: LocalPPTXViewerProps) {
  const resolvedFileId = fileId || extractFileIdFromUrl(fileUrl);

  // 已有 fileId → PDF 预览
  if (resolvedFileId) {
    return (
      <div
        className={cn("rounded-lg overflow-hidden border border-border bg-background", className)}
        style={{ height }}
      >
        <PdfPreviewer
          fileId={resolvedFileId}
          fileName={file?.name || title}
          height="100%"
          showToolbar={false}
        />
      </div>
    );
  }

  // 本地 File 但还没 fileId（理论上不应该长时间停留在这里）
  if (file) {
    return (
      <div
        className={cn(
          "rounded-lg overflow-hidden border border-border flex items-center justify-center bg-muted/20",
          className,
        )}
        style={{ height }}
      >
        <div className="text-center p-8">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground mt-1">上传完成后将自动加载预览</p>
        </div>
      </div>
    );
  }

  // 完全空状态
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden border border-border flex items-center justify-center bg-muted/20",
        className,
      )}
      style={{ height }}
    >
      <div className="text-center p-8">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        {showUploadHint ? (
          <>
            <p className="text-sm font-medium text-foreground">暂无可预览的文件</p>
            <p className="text-xs text-muted-foreground mt-1">上传后将在此显示预览</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{title || "PPT 预览区"}</p>
        )}
      </div>
    </div>
  );
}
