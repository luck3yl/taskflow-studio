import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, FileX, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { fetchFilePreviewBlob } from "@/services/apis/files";
import * as pdfjsLib from "pdfjs-dist";

// 配置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfSlideViewerProps {
  /** 文件 ID */
  fileId?: string;
  /** 文件名（展示用） */
  fileName?: string;
  /** 总页数（可选，用于标题显示；如果不传会从 PDF 自动获取） */
  pageCount?: number;
  /** 容器高度 */
  height?: string;
  /** 额外类名 */
  className?: string;
  /**
   * 布局模式：
   * - 'top-bottom'：上方大图 + 下方缩略图网格（如截图所示，适合分派页面）
   * - 'left-right'：左侧缩略图列表 + 右侧大图（适合文件预览对话框）
   */
  layout?: "top-bottom" | "left-right";
  /** 当前选中页码（受控模式，1-based） */
  activePage?: number;
  /** 页码变化回调 */
  onPageChange?: (page: number) => void;
  /** 高亮的页码集合（用于分派时标记已分配的页） */
  highlightedPages?: Set<number>;
  /** 高亮颜色 class（默认 ring-primary） */
  highlightClass?: string;
  /** 仅显示指定页码（1-based），其他页不渲染也不展示 */
  visiblePages?: Set<number>;
  /** 隐藏组件内部的标题栏（当外层已有标题时使用） */
  hideHeader?: boolean;
}

interface PageImage {
  pageNum: number;
  dataUrl: string;
}

/**
 * PDF 幻灯片查看器
 *
 * 后端把 PPT 转成 PDF 流返回，前端用 pdfjs-dist 逐页渲染成 canvas 图片，
 * 展示为"大图 + 缩略图网格"或"左侧列表 + 右侧大图"两种布局。
 */
export function PdfSlideViewer({
  fileId,
  fileName,
  pageCount: externalPageCount,
  height = "100%",
  className,
  layout = "top-bottom",
  activePage: controlledActivePage,
  onPageChange,
  highlightedPages,
  highlightClass = "ring-primary",
  visiblePages,
  hideHeader = false,
}: PdfSlideViewerProps) {
  const [pages, setPages] = useState<PageImage[]>([]);
  const [totalPages, setTotalPages] = useState(externalPageCount || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [internalActivePage, setInternalActivePage] = useState(
    visiblePages ? Math.min(...visiblePages) : 1
  );
  const [reloadKey, setReloadKey] = useState(0);

  const activePage = controlledActivePage ?? internalActivePage;

  const setActivePage = useCallback(
    (page: number) => {
      setInternalActivePage(page);
      onPageChange?.(page);
    },
    [onPageChange],
  );

  // 渲染单页为 dataUrl
  const renderPage = useCallback(
    async (
      pdf: pdfjsLib.PDFDocumentProxy,
      pageNum: number,
      scale: number,
    ): Promise<PageImage> => {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      return { pageNum, dataUrl: canvas.toDataURL("image/png") };
    },
    [],
  );

  useEffect(() => {
    if (!fileId) {
      setPages([]);
      setError(undefined);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(undefined);
    setPages([]);

    (async () => {
      try {
        const blob = await fetchFilePreviewBlob(fileId);
        if (cancelled) return;

        const arrayBuffer = await blob.arrayBuffer();
        if (cancelled) return;

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;

        setTotalPages(pdf.numPages);

        // 渲染所有页面（缩略图用较低 scale，大图用较高 scale）
        // 先用统一 scale 渲染缩略图，大图通过 CSS 放大即可（PNG 质量足够）
        const scale = 1.5; // 平衡质量和性能
        const rendered: PageImage[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const pageImg = await renderPage(pdf, i, scale);
          rendered.push(pageImg);
          // 逐步更新，让用户看到加载进度
          setPages([...rendered]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "PDF 解析失败");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId, reloadKey, renderPage]);

  const handleReload = () => {
    setReloadKey((k) => k + 1);
  };

  const currentPageImage = pages.find((p) => p.pageNum === activePage);

  // 根据 visiblePages 过滤要展示的页面
  const displayPages = visiblePages
    ? pages.filter((p) => visiblePages.has(p.pageNum))
    : pages;
  const displayTotalPages = visiblePages ? visiblePages.size : totalPages;

  // 无 fileId
  if (!fileId) {
    return (
      <div
        style={{ height }}
        className={cn(
          "flex items-center justify-center bg-muted/20 text-sm text-muted-foreground rounded-lg border border-border",
          className,
        )}
      >
        暂无可预览的文件
      </div>
    );
  }

  // 错误状态
  if (error && !loading) {
    return (
      <div
        style={{ height }}
        className={cn(
          "flex items-center justify-center bg-muted/20 rounded-lg border border-border",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center p-6">
          <FileX className="h-10 w-10 text-muted-foreground/60" />
          <p className="text-sm text-foreground">预览加载失败</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={handleReload}>
            <RotateCw className="h-3.5 w-3.5 mr-1.5" />
            重试
          </Button>
        </div>
      </div>
    );
  }

  // ========== 上下布局（分派页面用） ==========
  if (layout === "top-bottom") {
    return (
      <div
        style={{ height }}
        className={cn("flex flex-col bg-background overflow-hidden", className)}
      >
        {/* 标题栏 */}
        {!hideHeader && (
          <div className="shrink-0 px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">PPT 预览</span>
            {displayTotalPages > 0 && (
              <span className="text-sm text-muted-foreground">
                （共 {displayTotalPages} 页）
              </span>
            )}
          </div>
        )}

        {/* 大图区域 */}
        <div className="shrink-0 px-4 pb-3">
          <div className="relative w-full aspect-[16/9] rounded-lg border border-border bg-white overflow-hidden shadow-sm">
            {loading && pages.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : currentPageImage ? (
              <img
                src={currentPageImage.dataUrl}
                alt={`第 ${activePage} 页`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                加载中...
              </div>
            )}
          </div>
        </div>

        {/* 缩略图网格 */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 pb-4">
            <div className="grid grid-cols-5 gap-2.5">
              {displayPages.map((page) => {
                const isActive = page.pageNum === activePage;
                const isHighlighted = highlightedPages?.has(page.pageNum);
                return (
                  <div
                    key={page.pageNum}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                    onClick={() => setActivePage(page.pageNum)}
                  >
                    <div
                      className={cn(
                        "w-full aspect-[16/9] rounded border overflow-hidden transition-all bg-white",
                        isActive
                          ? "ring-2 ring-primary border-primary shadow-md"
                          : isHighlighted
                            ? `ring-2 ${highlightClass} border-primary/50`
                            : "border-border group-hover:border-primary/40 group-hover:shadow-sm",
                      )}
                    >
                      <img
                        src={page.dataUrl}
                        alt={`第 ${page.pageNum} 页`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs",
                        isActive
                          ? "text-primary font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      {page.pageNum}
                    </span>
                  </div>
                );
              })}
              {/* 加载中的占位 */}
              {loading &&
                displayPages.length < displayTotalPages &&
                Array.from({ length: Math.min(displayTotalPages - displayPages.length, 5) }).map(
                  (_, i) => (
                    <div
                      key={`loading-${i}`}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="w-full aspect-[16/9] rounded border border-border bg-muted/30 animate-pulse" />
                      <span className="text-xs text-muted-foreground">
                        {displayPages.length + i + 1}
                      </span>
                    </div>
                  ),
                )}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ========== 左右布局（文件预览对话框用） ==========
  return (
    <div
      style={{ height }}
      className={cn("flex bg-background overflow-hidden", className)}
    >
      {/* 左侧缩略图列表 */}
      <ScrollArea className="w-[180px] shrink-0 border-r border-border bg-muted/30">
        <div className="p-2 space-y-2">
          {displayPages.map((page) => {
            const isActive = page.pageNum === activePage;
            const isHighlighted = highlightedPages?.has(page.pageNum);
            return (
              <div
                key={page.pageNum}
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors",
                  isActive
                    ? "bg-primary/10"
                    : "hover:bg-muted",
                )}
                onClick={() => setActivePage(page.pageNum)}
              >
                <div
                  className={cn(
                    "w-[100px] shrink-0 aspect-[16/9] rounded border overflow-hidden bg-white",
                    isActive
                      ? "ring-2 ring-primary border-primary"
                      : isHighlighted
                        ? `ring-2 ${highlightClass} border-primary/50`
                        : "border-border",
                  )}
                >
                  <img
                    src={page.dataUrl}
                    alt={`第 ${page.pageNum} 页`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {page.pageNum}
                </span>
              </div>
            );
          })}
          {loading &&
            displayPages.length < displayTotalPages &&
            Array.from({ length: Math.min(displayTotalPages - displayPages.length, 3) }).map(
              (_, i) => (
                <div key={`loading-${i}`} className="flex items-center gap-2 p-1.5">
                  <div className="w-[100px] shrink-0 aspect-[16/9] rounded border border-border bg-muted/30 animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    {displayPages.length + i + 1}
                  </span>
                </div>
              ),
            )}
        </div>
      </ScrollArea>

      {/* 右侧大图 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 py-2 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium">
            {fileName || "PPT 预览"}
            {displayTotalPages > 0 && (
              <span className="text-muted-foreground ml-2">
                第 {activePage}/{displayTotalPages} 页
              </span>
            )}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 bg-muted/10 overflow-auto">
          {loading && pages.length === 0 ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : currentPageImage ? (
            <img
              src={currentPageImage.dataUrl}
              alt={`第 ${activePage} 页`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-border"
            />
          ) : (
            <span className="text-sm text-muted-foreground">加载中...</span>
          )}
        </div>
      </div>
    </div>
  );
}
