import { useState } from "react";
import { GitMerge, RefreshCcw, Loader2, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTaskContext } from "@/contexts/TaskContext";
import { useToast } from "@/hooks/use-toast";
import { cn, formatPageRange } from "@/lib/utils";
import { getFileDownloadUrl } from "@/services/apis/files";
import type { PptCollabFormProps } from "./types";
import type { MeetingMaterialDeptAssignment, MeetingMaterialUserAssignment } from "@/types/task";

// ---- SubmissionFileItem ----
function SubmissionFileItem({ ua }: { ua: MeetingMaterialUserAssignment }) {
  const approvedSub = ua.submissions.find(
    (s) => s.status === "approved" || s.status === "dept_approved" || s.status === "final_approved"
  ) || ua.submissions[ua.submissions.length - 1];

  if (!approvedSub) return null;

  const fileId = approvedSub.fileId;
  const downloadUrl = fileId ? getFileDownloadUrl(fileId) : undefined;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-secondary/5 hover:bg-secondary/20 transition-colors">
      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-[11px] font-semibold text-primary">{ua.userName.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-foreground">{ua.userName}</span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">第 {formatPageRange(ua.pages)} 页</span>
        </div>
        <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 leading-tight">
          {approvedSub.fileName || "已提交文件"}
        </p>
      </div>
      <div className="flex gap-0.5 shrink-0">
        {downloadUrl && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={async () => {
              try {
                const resp = await fetch(downloadUrl);
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = approvedSub.fileName || "下载文件";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch {
                window.location.href = downloadUrl;
              }
            }}
            title="下载"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---- DeptCompletionCard ----
function DeptCompletionCard({ dept }: { dept: MeetingMaterialDeptAssignment }) {
  const total = dept.userAssignments.length;
  const approved = dept.userAssignments.filter(
    (ua) => ua.status === "dept_approved" || ua.status === "final_approved"
  ).length;
  const allDone = total > 0 && approved === total;

  const approvedAssignments = dept.userAssignments.filter(
    (ua) =>
      (ua.status === "dept_approved" || ua.status === "final_approved") &&
      ua.submissions.length > 0
  );

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">
            {dept.department}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {approved}/{total} 人已完成
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[11px] h-5 px-2",
            allDone
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-amber-50 text-amber-600 border-amber-200"
          )}
        >
          {allDone ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              已完成
            </span>
          ) : (
            "进行中"
          )}
        </Badge>
      </div>

      {approvedAssignments.length > 0 && (
        <div className="space-y-1.5">
          {approvedAssignments.map((ua) => (
            <SubmissionFileItem key={ua.id} ua={ua} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- MergeForm ----
export function MergeForm({ task, onSuccess, onError }: PptCollabFormProps) {
  const { completePptAction } = useTaskContext();
  const { toast } = useToast();

  const workflow = task.meetingMaterialWorkflow;
  const deptAssignments = workflow?.deptAssignments ?? [];

  const [isMerging, setIsMerging] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      const updatedTask = await completePptAction(task.id, {
        action: "mark_merged",
        payload: {},
      });
      toast({ title: "合并完成", description: "已将各员工审核通过的稿件自动合并" });
      onSuccess(updatedTask);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast({ title: "合并失败", description: err.message, variant: "destructive" });
      onError?.(err);
    } finally {
      setIsMerging(false);
    }
  };

  const handleRejectAll = async () => {
    setIsRejecting(true);
    try {
      const updatedTask = await completePptAction(task.id, {
        action: "reject_all",
        payload: {},
      });
      toast({ title: "已驳回重做", description: "所有员工将重新提交" });
      onSuccess(updatedTask);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast({ title: "操作失败", description: err.message, variant: "destructive" });
      onError?.(err);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 标题 */}
      <div>
        <h3 className="text-base font-semibold text-foreground">确认合并</h3>
        <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
          确认后系统将自动把各员工已审核通过的 PPT 稿件合并为最终文件
        </p>
      </div>

      {/* 部门完成情况 */}
      <div className="space-y-3">
        {deptAssignments.map((dept) => (
          <DeptCompletionCard key={dept.id} dept={dept} />
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          className="flex-1 h-10 text-[13px] font-medium gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
          disabled={isRejecting || isMerging}
          onClick={handleRejectAll}
        >
          {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          驳回重做
        </Button>
        <Button
          className="flex-1 h-10 text-[13px] font-medium gap-1.5"
          disabled={isMerging || isRejecting}
          onClick={handleMerge}
        >
          {isMerging ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
          确认合并
        </Button>
      </div>
    </div>
  );
}
