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
  Layers
} from "lucide-react";
import { Task } from "@/contexts/TaskContext";
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

          {/* PPTist Preview - 使用放映模式，最大化预览区域 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">在线预览</h4>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                下载合并PPT
              </Button>
            </div>
            <PPTistViewer 
              title={`${task.title} - 合并预览`}
              height="500px"
              mode="screen"
              defaultScreen={true}
            />
          </div>

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
