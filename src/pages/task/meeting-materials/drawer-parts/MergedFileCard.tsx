import { Download, Eye, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MergedFileCardProps {
  stage: string;
  fileName: string;
  fileUrl?: string;
  onPreview: (file: { fileName: string; fileUrl?: string }) => void;
}

/** 合并后文件卡片：预览/下载入口 */
export function MergedFileCard({ stage, fileName, fileUrl, onPreview }: MergedFileCardProps) {
  const description =
    stage === "merged"
      ? "已完成合并，可直接预览最终文件。"
      : "全部页面审核通过后，发起人可在这里发起合并，并在生成后预览最终文件。";

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3 mt-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            合并后文件
          </p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={!fileUrl}
            onClick={() => onPreview({ fileName, fileUrl })}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />预览
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={!fileUrl}
            onClick={() => fileUrl && window.open(fileUrl, "_blank", "noopener,noreferrer")}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />下载
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
        文件名：{fileName}{!fileUrl ? "，合并文件生成后可预览/下载" : ""}
      </div>
    </div>
  );
}
