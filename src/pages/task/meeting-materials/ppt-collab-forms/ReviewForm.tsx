import { useState } from "react";
import { CheckCircle2, XCircle, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTaskContext } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { getFileDownloadUrl, extractFileIdFromUrl } from "@/services/apis/files";
import { formatPageRange } from "@/lib/utils";
import type { PptCollabFormProps } from "./types";
import type {
  MeetingMaterialUserAssignment,
  MeetingMaterialPageSubmission,
} from "@/types/task";

// ---- ReviewItem ----
function ReviewItem({
  ua,
  submission,
  onApprove,
  onReject,
  isSubmitting,
}: {
  ua: MeetingMaterialUserAssignment;
  submission: MeetingMaterialPageSubmission;
  onApprove: (feedback: string) => Promise<void>;
  onReject: (feedback: string) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [feedback, setFeedback] = useState("");
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");

  const handleApprove = async () => {
    await onApprove(feedback || "室主任审核通过");
  };

  const handleReject = async () => {
    if (!feedback.trim()) return;
    await onReject(feedback);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-sm bg-primary/10 text-primary font-medium">
              {ua.userAvatar}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground/90">{ua.userName}</p>
            <p className="text-xs text-muted-foreground">
              第 {formatPageRange(ua.pages)} 页
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
        >
          待审核
        </Badge>
      </div>

      {/* Submission file */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-secondary/20">
        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {submission.fileName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            v{submission.version} · {submission.submittedAt.split(" ")[0]}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {(submission.fileId || submission.fileUrl) && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={async () => {
                const fileId = submission.fileId || extractFileIdFromUrl(submission.fileUrl);
                const downloadUrl = fileId ? getFileDownloadUrl(fileId) : submission.fileUrl;
                if (!downloadUrl) return;
                try {
                  const resp = await fetch(downloadUrl);
                  const blob = await resp.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = submission.fileName || "下载文件";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch {
                  window.location.href = downloadUrl;
                }
              }}
            >
              <Download className="h-3.5 w-3.5" />
              下载
            </Button>
          )}
        </div>
      </div>

      {submission.note && (
        <p className="text-xs text-muted-foreground pl-1">{submission.note}</p>
      )}

      {/* Action area */}
      {mode === "idle" && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 text-xs border-destructive/50 text-destructive hover:bg-destructive/5"
            disabled={isSubmitting}
            onClick={() => setMode("reject")}
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            驳回
          </Button>
          <Button
            size="sm"
            className="flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSubmitting}
            onClick={() => setMode("approve")}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            通过
          </Button>
        </div>
      )}

      {mode === "approve" && (
        <div className="space-y-2 pt-1">
          <Label className="text-xs font-medium">审核意见（选填）</Label>
          <Textarea
            className="resize-none text-sm"
            rows={2}
            placeholder="填写审核意见..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 text-xs"
              disabled={isSubmitting}
              onClick={() => setMode("idle")}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting}
              onClick={handleApprove}
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              确认通过
            </Button>
          </div>
        </div>
      )}

      {mode === "reject" && (
        <div className="space-y-2 pt-1">
          <Label className="text-xs font-medium">
            驳回原因 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            className="resize-none text-sm"
            rows={2}
            placeholder="请填写驳回原因（必填）..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 text-xs"
              disabled={isSubmitting}
              onClick={() => setMode("idle")}
            >
              取消
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 text-xs border-destructive/50 text-destructive hover:bg-destructive/5"
              disabled={isSubmitting || !feedback.trim()}
              onClick={handleReject}
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              确认驳回
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- ReviewForm ----
export function ReviewForm({ task, onSuccess, onError }: PptCollabFormProps) {
  const { completePptAction } = useTaskContext();
  const { currentUser } = useUserContext();
  const { toast } = useToast();

  const workflow = task.meetingMaterialWorkflow;

  // Find dept where current user is head
  const myDept = workflow?.deptAssignments.find(
    (d) => d.headUserId === currentUser.id
  );

  // Submitted user assignments in my dept
  const pendingReviews = myDept
    ? myDept.userAssignments.filter((ua) => ua.status === "submitted")
    : [];

  // Per-item submitting state
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());

  const setItemSubmitting = (uaId: string, val: boolean) => {
    setSubmittingIds((prev) => {
      const next = new Set(prev);
      if (val) next.add(uaId);
      else next.delete(uaId);
      return next;
    });
  };

  const getSubmissionId = (ua: MeetingMaterialUserAssignment): string => {
    // Find the pending submission
    const pendingSub = ua.submissions.find((s) => s.status === "pending");
    return pendingSub?.id ?? ua.submissions[ua.submissions.length - 1]?.id ?? "";
  };

  const handleApprove = async (
    ua: MeetingMaterialUserAssignment,
    feedback: string
  ) => {
    const submissionId = getSubmissionId(ua);
    if (!submissionId) return;

    setItemSubmitting(ua.id, true);
    try {
      const updatedTask = await completePptAction(task.id, {
        action: "review",
        payload: { submissionId, approved: true, feedback },
      });
      toast({ title: "审核通过", description: `${ua.userName} 的提交已通过` });
      onSuccess(updatedTask);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast({
        title: "操作失败",
        description: err.message,
        variant: "destructive",
      });
      onError?.(err);
    } finally {
      setItemSubmitting(ua.id, false);
    }
  };

  const handleReject = async (
    ua: MeetingMaterialUserAssignment,
    feedback: string
  ) => {
    const submissionId = getSubmissionId(ua);
    if (!submissionId) return;

    setItemSubmitting(ua.id, true);
    try {
      const updatedTask = await completePptAction(task.id, {
        action: "review",
        payload: { submissionId, approved: false, feedback },
      });
      toast({ title: "已驳回", description: `${ua.userName} 的提交已被驳回` });
      onSuccess(updatedTask);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast({
        title: "操作失败",
        description: err.message,
        variant: "destructive",
      });
      onError?.(err);
    } finally {
      setItemSubmitting(ua.id, false);
    }
  };

  if (!myDept) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        您不是任何部门的室主任，无法进行审核。
      </div>
    );
  }

  if (pendingReviews.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        当前没有待审核的提交。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">审核提交</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="font-medium text-foreground/80">{myDept.department}</span>{" "}
          · 共 {pendingReviews.length} 条待审核
        </p>
      </div>

      <div className="space-y-3">
        {pendingReviews.map((ua) => {
          const latestSub = ua.submissions[ua.submissions.length - 1];
          if (!latestSub) return null;
          return (
            <ReviewItem
              key={ua.id}
              ua={ua}
              submission={latestSub}
              isSubmitting={submittingIds.has(ua.id)}
              onApprove={(feedback) => handleApprove(ua, feedback)}
              onReject={(feedback) => handleReject(ua, feedback)}
            />
          );
        })}
      </div>
    </div>
  );
}
