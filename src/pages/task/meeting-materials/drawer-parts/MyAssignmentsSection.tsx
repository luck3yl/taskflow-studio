import { AlertTriangle, Download, Eye, FileText, Upload, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPageRange } from "@/lib/utils";
import type {
  MeetingMaterialDeptAssignment,
  MeetingMaterialUserAssignment,
} from "@/contexts/TaskContext";
import type { Task } from "@/types/task";
import { StatusBadge } from "../components/StatusBadge";

interface MyAssignmentsSectionProps {
  task: Task;
  myAssignments: { dept: MeetingMaterialDeptAssignment; ua: MeetingMaterialUserAssignment }[];
  onPreview: (file: { fileName: string; fileUrl?: string }) => void;
  onSubmit: (payload: { deptId: string; ua: MeetingMaterialUserAssignment }) => void;
}

/** 员工视角：我负责的任务 */
export function MyAssignmentsSection({
  task,
  myAssignments,
  onPreview,
  onSubmit,
}: MyAssignmentsSectionProps) {
  if (myAssignments.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold flex items-center gap-2 text-foreground">
        <Users className="h-4 w-4 text-blue-500" />
        我的任务
      </div>
      <div className="space-y-4 bg-background rounded-2xl p-6 border border-border/40 shadow-sm hover:shadow-md transition-shadow">
        {myAssignments.map(({ dept, ua }) => {
          const latestSub = ua.submissions[ua.submissions.length - 1];
          const canSubmit =
            ua.status === "pending" || ua.status === "rejected" || ua.status === "in_progress";

          return (
            <div key={ua.id} className="space-y-5 border-b border-border/40 pb-5 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    负责第 <span className="text-blue-500 font-bold">{formatPageRange(ua.pages)}</span> 页
                  </p>
                  <p className="text-xs text-muted-foreground">所属部门：{dept.department}</p>
                </div>
                <div className="flex shrink-0 whitespace-nowrap">
                  <StatusBadge status={ua.status} type="user" />
                </div>
              </div>

              {/* 下载模板 */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 transition-colors hover:border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 shadow-sm">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-sm text-foreground/80 truncate font-medium">{task.templateFileName}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 font-medium gap-2 shrink-0 border-border/60 hover:bg-background"
                  disabled={!task.templateFileUrl}
                  onClick={() =>
                    task.templateFileUrl &&
                    window.open(`${task.templateFileUrl}?ua_id=${ua.id}`, "_blank", "noopener,noreferrer")
                  }
                >
                  <Download className="h-4 w-4 text-muted-foreground" />下载模板
                </Button>
              </div>

              {/* 驳回说明 */}
              {ua.status === "rejected" && latestSub && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                  <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-destructive">已被驳回</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{latestSub.feedback || "请修改后重新提交"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">⚠️ 重新提交后需重新走完整审核流程</p>
                  </div>
                </div>
              )}

              {/* 提交历史 */}
              {ua.submissions.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-border/40">
                  <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-3">历史记录</p>
                  {ua.submissions.slice(-2).map(sub => (
                    <div
                      key={sub.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                        sub.hasConflict
                          ? "bg-amber-50 border-amber-200 hover:border-amber-300"
                          : "bg-secondary/40 border-transparent hover:bg-background/80"
                      )}
                    >
                      {sub.hasConflict ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                        <p className="text-sm font-medium truncate text-foreground/90">{sub.fileName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded font-medium",
                              sub.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : sub.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {sub.status === "approved" ? "已通过" : sub.status === "rejected" ? "已驳回" : "审核中"}
                          </span>
                          <span>•</span>
                          <span className="font-mono">v{sub.version}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 shrink-0 rounded-lg hover:bg-secondary"
                        onClick={() => onPreview({ fileName: sub.fileName, fileUrl: sub.fileUrl })}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {canSubmit && (
                <Button
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all gap-2 mt-4"
                  onClick={() => onSubmit({ deptId: dept.id, ua })}
                >
                  <Upload className="h-4 w-4" />
                  {ua.status === "rejected" ? "重新提交" : "上传提交"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
