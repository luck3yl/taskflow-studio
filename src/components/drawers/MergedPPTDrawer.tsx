import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  FileText, 
  CheckCircle2,
  Clock,
  Layers,
  Eye,
  Play
} from "lucide-react";
import { useState } from "react";
import { Task } from "@/contexts/TaskContext";
import { FilePreviewDialog } from "@/components/ppt/FilePreviewDialog";
import { PPTistViewer } from "@/components/ppt/PPTistViewer";

interface MergedPPTDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}

export function MergedPPTDrawer({ 
  open, 
  onOpenChange, 
  task 
}: MergedPPTDrawerProps) {
  const [selectedFilePreview, setSelectedFilePreview] = useState<{
    fileName: string;
    fileUrl?: string;
  } | null>(null);

  if (!task) return null;

  const approvedAssignees = task.assignees.filter(a => a.status === "approved");
  const allApproved = approvedAssignees.length === task.assignees.length;
  const totalPages = task.templatePageCount || 0;

  // Calculate merge status
  const getMergeProgress = () => {
    const approvedPages = new Set<number>();
    approvedAssignees.forEach(a => {
      if (a.pageRange) {
        const [start, end] = a.pageRange.split("-").map(Number);
        for (let i = start; i <= end; i++) {
          approvedPages.add(i);
        }
      }
    });
    return {
      approved: approvedPages.size,
      total: totalPages,
      percentage: totalPages > 0 ? Math.round((approvedPages.size / totalPages) * 100) : 0
    };
  };

  const progress = getMergeProgress();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            合并PPT预览
          </SheetTitle>
          <div className="flex items-center gap-3 mt-2">
            <Badge 
              className={allApproved 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-warning/10 text-warning border-warning/20"
              }
            >
              {allApproved ? "全部完成" : `进行中 ${approvedAssignees.length}/${task.assignees.length}`}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {task.title}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Merge Status */}
          <div className="rounded-lg border border-border p-4 bg-secondary/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">合并进度</span>
              <span className="text-sm text-muted-foreground">
                {progress.approved}/{progress.total} 页已完成 ({progress.percentage}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-success transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Page Breakdown by Assignee */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm">各成员提交内容</h4>
            <div className="space-y-2">
              {task.assignees.map((assignee) => {
                const latestSubmission = assignee.submissions[assignee.submissions.length - 1];
                return (
                  <div 
                    key={assignee.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {assignee.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{assignee.name}</span>
                        {assignee.pageRange && (
                          <Badge variant="outline" className="text-xs">
                            第 {assignee.pageRange} 页
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {latestSubmission?.fileName || "未提交"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {latestSubmission && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setSelectedFilePreview({
                            fileName: latestSubmission.fileName,
                            fileUrl: latestSubmission.fileUrl
                          })}
                          title="预览PPT"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">预览</span>
                        </Button>
                      )}
                      {assignee.status === "approved" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : assignee.status === "submitted" ? (
                        <Clock className="h-4 w-4 text-warning" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={`text-xs ${
                        assignee.status === "approved" 
                          ? "text-success" 
                          : assignee.status === "submitted"
                            ? "text-warning"
                            : "text-muted-foreground"
                      }`}>
                        {assignee.status === "approved" && "已合并"}
                        {assignee.status === "submitted" && "待审核"}
                        {assignee.status === "pending" && "未提交"}
                        {assignee.status === "rejected" && "需重做"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* 合并PPT预览 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">合并预览</h4>
            <div className="rounded-lg border border-border overflow-hidden">
              <PPTistViewer
                title="合并PPT预览"
                height="450px"
                mode="screen"
                defaultScreen={true}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              <Play className="h-3 w-3 inline mr-1" />
              提示：点击 "从头开始" 或 "从当前开始" 按钮进入纯放映模式
            </p>
          </div>

          {/* File Preview Dialog */}
          <FilePreviewDialog
            open={!!selectedFilePreview}
            onOpenChange={(open) => !open && setSelectedFilePreview(null)}
            fileName={selectedFilePreview?.fileName || ""}
            fileUrl={selectedFilePreview?.fileUrl}
          />
          {/* Merged File Info */}
          {allApproved && (
            <>
              <Separator />
              <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {task.title}_合并版.pptx
                    </p>
                    <p className="text-xs text-muted-foreground">
                      共 {totalPages} 页 · 合并于 {new Date().toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <Button size="sm" className="gradient-success">
                    <Download className="h-4 w-4 mr-2" />
                    下载
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
