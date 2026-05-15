import { useEffect, useState } from "react";
import { Loader2, FileX, Download, ExternalLink, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchFilePreviewBlob } from "@/services/apis/files";

interface PdfPreviewerProps {
  /** 文件 ID（必需）。后端会把 ppt/pptx/doc 等转成 PDF 流返回 */
  fileId?: string;
  /** 显示文件名（仅用于下载时的文件名） */
  fileName?: string;
  /** 预览区高度，默认 100% 占满父容器 */
  height?: string;
  /** 额外类名 */
  className?: string;
  /** 是否显示顶部工具栏（重新加载、下载） */
  showToolbar?: boolean;
  /** 无 fileId 时显示的占位内容 */
  placeholder?: React.ReactNode;
}

/**
 * PDF 文件预览组件
 *
 * 后端 `/api/v1/files/{fileId}/preview` 返回 PDF 流，
 * 这里用 axios responseType: 'blob' 拉到本地后通过 createObjectURL
 * 套进原生 <iframe> 渲染（浏览器自带 PDF 阅读器）。
 */
export function PdfPreviewer({
  fileId,
  fileName,
  height = "100%",
  className,
  showToolbar = true,
  placeholder,
}: PdfPreviewerProps) {
  const [blobUrl, setBlobUrl] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!fileId) {
      setBlobUrl(undefined);
      setError(undefined);
      return;
    }

    let cancelled = false;
    let createdUrl: string | undefined;

    setLoading(true);
    setError(undefined);

    fetchFilePreviewBlob(fileId)
      .then(blob => {
        if (cancelled) return;
        // 强制 PDF mime，避免浏览器把未知 blob 当成下载
        const pdfBlob = blob.type === "application/pdf"
          ? blob
          : new Blob([blob], { type: "application/pdf" });
        createdUrl = URL.createObjectURL(pdfBlob);
        setBlobUrl(createdUrl);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "预览加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [fileId, reloadKey]);

  const handleReload = () => {
    setBlobUrl(undefined);
    setError(undefined);
    setReloadKey(k => k + 1);
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = (fileName || "preview").replace(/\.(pptx?|docx?|xlsx?)$/i, "") + ".pdf";
    a.click();
  };

  const handleOpenNewTab = () => {
    if (blobUrl) window.open(blobUrl, "_blank");
  };

  // 无 fileId
  if (!fileId) {
    return (
      <div
        style={{ height }}
        className={cn(
          "flex items-center justify-center bg-muted/30 text-sm text-muted-foreground",
          className,
        )}
      >
        {placeholder ?? "暂无可预览的文件"}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col bg-background", className)} style={{ height }}>
      {showToolbar && (
        <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/40">
          <span className="text-xs text-muted-foreground truncate">
            {fileName || "PDF 预览"}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleReload}
              disabled={loading}
            >
              <RotateCw className={cn("h-3.5 w-3.5 mr-1", loading && "animate-spin")} />
              重新加载
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleOpenNewTab}
              disabled={!blobUrl}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              新窗口
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleDownload}
              disabled={!blobUrl}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              下载 PDF
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden bg-muted/20">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>正在加载预览...</span>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-3 text-center max-w-sm">
              <FileX className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm text-foreground">预览加载失败</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={handleReload}>
                <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                重试
              </Button>
            </div>
          </div>
        )}

        {blobUrl && !error && (
          <iframe
            key={blobUrl}
            src={blobUrl}
            title={fileName || "PDF 预览"}
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  );
}
