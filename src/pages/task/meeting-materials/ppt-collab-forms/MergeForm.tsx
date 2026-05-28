import { useState } from "react";
import {
  GitMerge,
  Loader2,
  CheckCircle2,
  Download,
  XCircle,
  FileText,
  Users,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTaskContext } from "@/contexts/TaskContext";
import { useToast } from "@/hooks/use-toast";
import { cn, formatPageRange } from "@/lib/utils";
import { getFileDownloadUrl } from "@/services/apis/files";
import type { PptCollabFormProps } from "./types";
import type {
  MeetingMaterialDeptAssignment,
  MeetingMaterialUserAssignment,
} from "@/types/task";

// ---- UserAssignmentCard ----
function UserAssignmentCard({
  ua,
  onReject,
  onPreview,
  isSubmitting,
  isPreviewActive,
}: {
  ua: MeetingMaterialUserAssignment;
  onReject: (ua: MeetingMaterialUserAssignment, feedback: string) => Promise<void>;
  onPreview?: (fileId: string) => void;
  isSubmitting: boolean;
  isPreviewActive: boolean;
}) {
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [feedback, setFeedback] = useState("");

  const latestSub = ua.submissions[ua.submissions.length - 1];
  const isRejected = ua.initiatorReviewStatus === "rejected";
  const fileId = latestSub?.fileId;
  const downloadUrl = fileId ? getFileDownloadUrl(fileId) : undefined;

  const handleReject = async () => {
    if (!feedback.trim()) return;
    await onReject(ua, feedback.trim());
    setFeedback("");
    setMode("idle");
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3 transition-all",
        isRejected
          ? "border-destructive/30 bg-red-50/50 dark:bg-destructive/5"
          : isPreviewActive
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          : "border-border/50 bg-card hover:border-border/80 hover:shadow-sm"
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
          <span className="text-sm font-semibold text-primary">
            {ua.userName.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {ua.userName}
            </span>
            <span className="text-xs text-muted-foreground/80">
              第 {formatPageRange(ua.pages)} 页
            </span>
          </div>
        </div>
        {isRejected ? (
          <Badge className="text-[11px] h-5 px-2 bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            已驳回
          </Badge>
        ) : (
          <Badge className="text-[11px] h-5 px-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
            <CheckCircle2 className="h-3 w-3 mr-0.5" />
            已通过
          </Badge>
        )}
      </div>

      {/* File actions row */}
      {latestSub && !isRejected && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/40 border border-border/30">
          <FileText className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-xs text-foreground/80 truncate flex-1">
            {latestSub.fileName || "提交文件"}
            {latestSub.version ? ` · v${latestSub.version}` : ""}
            {latestSub.submittedAt ? ` · ${latestSub.submittedAt.split(" ")[0]}` : ""}
          </span>
          <div className="flex gap-1 shrink-0">
            {onPreview && fileId && (
              <Button
                size="sm"
                variant={isPreviewActive ? "default" : "ghost"}
                className={cn(
                  "h-7 px-2.5 text-xs gap-1 rounded-md",
                  isPreviewActive
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
                onClick={() => onPreview(fileId)}
              >
                <Eye className="h-3 w-3" />
                预览
              </Button>
            )}
            {downloadUrl && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-xs gap-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={async () => {
                  try {
                    const resp = await fetch(downloadUrl);
                    const blob = await resp.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = latestSub.fileName || "下载文件";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch {
                    window.location.href = downloadUrl;
                  }
                }}
              >
                <Download className="h-3 w-3" />
                下载
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Rejected feedback display */}
      {isRejected && ua.initiatorReviewFeedback && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 dark:bg-destructive/10 dark:border-destructive/20">
          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-destructive leading-relaxed">
            {ua.initiatorReviewFeedback}
          </p>
        </div>
      )}

      {/* Reject action area */}
      {!isRejected && mode === "idle" && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={isSubmitting}
            onClick={() => setMode("reject")}
          >
            <XCircle className="h-3 w-3 mr-1" />
            驳回
          </Button>
        </div>
      )}

      {!isRejected && mode === "reject" && (
        <div className="space-y-2.5 pt-1 border-t border-border/30">
          <Label className="text-xs font-medium text-foreground/80">
            驳回原因 <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {["数据有误，请核实", "格式不符合要求", "内容不完整，请补充", "与模板要求不一致"].map((opt) => (
              <button
                key={opt}
                type="button"
                className={cn(
                  "px-2.5 py-1 rounded-md border text-xs transition-colors",
                  feedback === opt
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                )}
                onClick={() => setFeedback(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <Textarea
            className="resize-none text-sm min-h-[60px] focus-visible:ring-destructive/30"
            rows={2}
            placeholder="请填写驳回原因，该员工将收到通知并重新提交..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              disabled={isSubmitting}
              onClick={() => {
                setMode("idle");
                setFeedback("");
              }}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-destructive hover:bg-destructive/90 text-white"
              disabled={isSubmitting || !feedback.trim()}
              onClick={handleReject}
            >
              {isSubmitting && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              确认驳回
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- DeptSection ----
function DeptSection({
  dept,
  onReject,
  onPreview,
  submittingIds,
  activePreviewFileId,
}: {
  dept: MeetingMaterialDeptAssignment;
  onReject: (ua: MeetingMaterialUserAssignment, feedback: string) => Promise<void>;
  onPreview?: (fileId: string) => void;
  submittingIds: Set<string>;
  activePreviewFileId: string;
}) {
  const total = dept.userAssignments.length;
  const rejectedCount = dept.userAssignments.filter(
    (ua) => ua.initiatorReviewStatus === "rejected"
  ).length;
  const completedCount = total - rejectedCount;

  return (
    <div className="space-y-3">
      {/* Dept header */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center ring-1 ring-indigo-100">
          <Users className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {dept.department}
            </span>
            {rejectedCount > 0 && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-red-50 text-red-600 border-red-200">
                {rejectedCount} 驳回
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {dept.headUserName ? `负责人：${dept.headUserName} · ` : ""}
            {completedCount}/{total} 人完成
          </p>
        </div>
      </div>

      {/* UA cards */}
      <div className="space-y-2.5 ml-3 pl-3 border-l-2 border-border/30">
        {dept.userAssignments.map((ua) => (
          <UserAssignmentCard
            key={ua.id}
            ua={ua}
            onReject={onReject}
            onPreview={onPreview}
            isSubmitting={submittingIds.has(ua.id)}
            isPreviewActive={
              ua.submissions[ua.submissions.length - 1]?.fileId === activePreviewFileId
            }
          />
        ))}
      </div>
    </div>
  );
}

// ---- MergeForm ----
export function MergeForm({ task, onSuccess, onError, onPreviewFile }: PptCollabFormProps) {
  const { completePptAction, fetchTaskDetail } = useTaskContext();
  const { toast } = useToast();

  const workflow = task.meetingMaterialWorkflow;
  const deptAssignments = workflow?.deptAssignments ?? [];

  const [isMerging, setIsMerging] = useState(false);
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const [activePreviewFileId, setActivePreviewFileId] = useState<string>("");

  // 检查是否有被驳回的员工（合并按钮 disabled 条件）
  const hasRejected = deptAssignments.some((dept) =>
    dept.userAssignments.some((ua) => ua.initiatorReviewStatus === "rejected")
  );

  // 检查是否有人还在 pending/submitted 状态（被驳回后重新提交中）
  const hasPending = deptAssignments.some((dept) =>
    dept.userAssignments.some(
      (ua) => ua.status === "pending" || ua.status === "submitted"
    )
  );

  const mergeDisabled = hasRejected || hasPending;

  // 统计
  const allUas = deptAssignments.flatMap((d) => d.userAssignments);
  const totalCount = allUas.length;
  const rejectedCount = allUas.filter(
    (ua) => ua.initiatorReviewStatus === "rejected"
  ).length;

  const setItemSubmitting = (uaId: string, val: boolean) => {
    setSubmittingIds((prev) => {
      const next = new Set(prev);
      if (val) next.add(uaId);
      else next.delete(uaId);
      return next;
    });
  };

  const handlePreview = (fileId: string) => {
    setActivePreviewFileId(fileId);
    onPreviewFile?.(fileId);
  };

  const handleReject = async (
    ua: MeetingMaterialUserAssignment,
    feedback: string
  ) => {
    const latestSub = ua.submissions[ua.submissions.length - 1];
    if (!latestSub) return;

    setItemSubmitting(ua.id, true);
    try {
      await completePptAction(task.id, {
        action: "initiator_review",
        payload: {
          mode: "single",
          uaId: ua.id,
          submissionId: latestSub.id,
          approved: false,
          feedback,
          version: ua.version,
        },
      });
      toast({
        title: "已驳回",
        description: `${ua.userName} 的提交已被驳回，将重新提交`,
      });
      // 不跳转，刷新当前页数据
      await fetchTaskDetail(task.id);
      onSuccess(undefined);
    } catch (error: any) {
      const code =
        error?.detail?.code || error?.response?.data?.detail?.code;
      const message =
        error?.detail?.message ||
        error?.response?.data?.detail?.message ||
        error?.message ||
        "操作失败";

      if (code === "VERSION_CONFLICT") {
        toast({
          title: "页面信息已过期，请刷新后重试",
          variant: "destructive",
        });
        await fetchTaskDetail(task.id);
      } else {
        toast({
          title: "操作失败",
          description: message,
          variant: "destructive",
        });
      }
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setItemSubmitting(ua.id, false);
    }
  };

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      const updatedTask = await completePptAction(task.id, {
        action: "mark_merged",
        payload: {},
      });
      toast({
        title: "合并完成",
        description: "已将各员工审核通过的稿件自动合并为最终文件",
      });
      onSuccess(updatedTask);
    } catch (error: any) {
      const code =
        error?.detail?.code || error?.response?.data?.detail?.code;
      const message =
        error?.detail?.message ||
        error?.response?.data?.detail?.message ||
        error?.message ||
        "合并失败";

      if (code === "WRONG_STATUS") {
        toast({
          title: "无法合并",
          description: message,
          variant: "destructive",
        });
        await fetchTaskDetail(task.id);
      } else {
        toast({
          title: "合并失败",
          description: message,
          variant: "destructive",
        });
      }
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">确认合并</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          查看各员工提交详情，点击「预览」可在左侧查看文件内容。确认无误后合并，如有问题可驳回对应员工重新提交。
        </p>
      </div>

      {/* Summary bar - 仅在有驳回时展示 */}
      {rejectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50/50 dark:border-destructive/30 dark:bg-destructive/5">
          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          <span className="text-sm text-red-700 dark:text-destructive">
            {rejectedCount} 人被驳回，等待重新提交后方可合并
          </span>
        </div>
      )}

      {/* Dept sections */}
      <div className="space-y-6">
        {deptAssignments.map((dept) => (
          <DeptSection
            key={dept.id}
            dept={dept}
            onReject={handleReject}
            onPreview={onPreviewFile ? handlePreview : undefined}
            submittingIds={submittingIds}
            activePreviewFileId={activePreviewFileId}
          />
        ))}
      </div>

      {/* Merge button */}
      <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-background via-background to-transparent -mx-6 px-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button
                  className={cn(
                    "w-full h-11 text-sm font-semibold gap-2 shadow-lg transition-all",
                    !mergeDisabled && "bg-primary hover:bg-primary/90 hover:shadow-xl"
                  )}
                  disabled={isMerging || mergeDisabled}
                  onClick={handleMerge}
                >
                  {isMerging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitMerge className="h-4 w-4" />
                  )}
                  确认合并
                </Button>
              </div>
            </TooltipTrigger>
            {mergeDisabled && (
              <TooltipContent side="top">
                <p>
                  {hasRejected
                    ? "有员工被驳回尚未重新提交，无法合并"
                    : "有员工尚未完成提交或审核，无法合并"}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
