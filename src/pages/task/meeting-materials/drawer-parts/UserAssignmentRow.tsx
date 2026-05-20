import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatPageRange } from "@/lib/utils";
import type {
  MeetingMaterialDeptAssignment,
  MeetingMaterialPageSubmission,
  MeetingMaterialUserAssignment,
} from "@/contexts/TaskContext";
import { StatusBadge } from "../components/StatusBadge";
import { approveQuickFeedbacks, rejectQuickFeedbacks } from "./constants";

export interface ReviewSheetState {
  deptId: string;
  ua: MeetingMaterialUserAssignment;
  sub: MeetingMaterialPageSubmission;
  canApprove: boolean;
  canReject: boolean;
}

interface UserAssignmentRowProps {
  dept: MeetingMaterialDeptAssignment;
  ua: MeetingMaterialUserAssignment;
  isDeptHead: boolean;
  canCoordinateTask: boolean;
  canReviewTask: boolean;
  reviewSheet: ReviewSheetState | null;
  reviewFeedback: string;
  onReviewFeedbackChange: (value: string) => void;
  onOpenReviewPanel: (state: ReviewSheetState) => void;
  onCloseReviewPanel: () => void;
  onApprove: () => void;
  onReject: () => void;
  onPreview: (file: { fileName: string; fileUrl?: string }) => void;
}

/** 部门下单条员工分配（含展开的审核面板） */
export function UserAssignmentRow({
  dept,
  ua,
  isDeptHead,
  canCoordinateTask,
  canReviewTask,
  reviewSheet,
  reviewFeedback,
  onReviewFeedbackChange,
  onOpenReviewPanel,
  onCloseReviewPanel,
  onApprove,
  onReject,
  onPreview,
}: UserAssignmentRowProps) {
  const latestSub = ua.submissions[ua.submissions.length - 1];

  const canDeptReview = isDeptHead && canReviewTask && ua.status === "submitted" && Boolean(latestSub);
  const canCoordinatorReject =
    canCoordinateTask &&
    !!latestSub &&
    ua.status !== "pending" &&
    ua.status !== "in_progress" &&
    ua.status !== "rejected";
  const canApprove = Boolean(canDeptReview);
  const canReject = Boolean(canDeptReview || canCoordinatorReject);
  const canReview = canApprove || canReject;
  const canInspect = !!latestSub && (isDeptHead || canCoordinateTask);
  const isReviewing = reviewSheet?.ua.id === ua.id;
  const assignmentDescription = ua.taskDescription || dept.requirement || "暂无任务描述";
  const hasConflict = ua.submissions.some(s => s.hasConflict);

  const handleToggleReview = () => {
    if (isReviewing) {
      onCloseReviewPanel();
      return;
    }
    if (!latestSub) return;
    onOpenReviewPanel({
      deptId: dept.id,
      ua,
      sub: latestSub,
      canApprove,
      canReject,
    });
  };

  return (
    <div
      className={cn(
        "group relative p-4 sm:p-5 transition-all duration-200 ease-in-out rounded-2xl",
        hasConflict
          ? "bg-amber-50/50 border border-amber-200/60 shadow-sm"
          : "bg-card border border-border/60 shadow-sm hover:shadow-md hover:border-primary/20"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-background shadow-sm">
            <AvatarFallback className="text-sm bg-primary/10 text-primary font-medium">{ua.userAvatar}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="text-[15px] font-semibold text-foreground/90">{ua.userName}</p>
              <StatusBadge status={ua.status} type="user" />
              <Badge
                variant="secondary"
                className="h-[22px] px-2 text-[11px] font-medium bg-secondary/50 text-muted-foreground shrink-0 rounded-md"
              >
                第 {formatPageRange(ua.pages)} 页
              </Badge>
            </div>
            <p
              className="text-[13px] text-muted-foreground/80 leading-relaxed max-w-[90%]"
              title={assignmentDescription}
            >
              {assignmentDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 sm:mt-1 self-start sm:self-auto ml-14 sm:ml-0">
          {hasConflict && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/50 text-amber-700 text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>冲突</span>
            </div>
          )}
          {canInspect && (
            <Button
              size="sm"
              variant={canReview ? "default" : "secondary"}
              className={cn(
                "h-8 px-3.5 text-xs font-medium transition-all shadow-sm",
                canReview
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-secondary/80 hover:bg-secondary border border-border/50 text-foreground/80"
              )}
              onClick={handleToggleReview}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5 opacity-70" />
              {isReviewing ? "收起面板" : canApprove ? "开始审核" : canReject ? "查看/驳回" : "查看详情"}
            </Button>
          )}
        </div>
      </div>

      {!isReviewing && ua.submissions.length > 0 && (
        <LatestSubmissionPreview submission={ua.submissions[ua.submissions.length - 1]} />
      )}

      {isReviewing && latestSub && (
        <ReviewPanel
          submission={latestSub}
          canReview={canReview}
          canApprove={Boolean(reviewSheet?.canApprove)}
          canReject={Boolean(reviewSheet?.canReject)}
          feedback={reviewFeedback}
          onFeedbackChange={onReviewFeedbackChange}
          onApprove={onApprove}
          onReject={onReject}
          onPreview={onPreview}
        />
      )}
    </div>
  );
}

function LatestSubmissionPreview({ submission }: { submission: MeetingMaterialPageSubmission }) {
  return (
    <div className="mt-4 ml-14 max-w-2xl">
      <div
        className={cn(
          "flex items-center gap-3 text-[13px] p-2.5 rounded-lg border transition-colors",
          submission.hasConflict
            ? "bg-amber-100/50 border-amber-200/60"
            : "bg-card border-border/40 shadow-sm hover:border-primary/20"
        )}
      >
        <div
          className={cn(
            "h-6 w-6 rounded-md flex items-center justify-center shrink-0",
            submission.hasConflict ? "bg-amber-100" : "bg-blue-50"
          )}
        >
          {submission.hasConflict ? (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          ) : (
            <FileText className="h-3.5 w-3.5 text-blue-500" />
          )}
        </div>
        <span className="flex-1 truncate font-medium text-foreground/80">{submission.fileName}</span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-muted-foreground/60 font-mono text-[11px] bg-secondary/50 px-1.5 py-0.5 rounded">
            v{submission.version}
          </span>
          <span className="text-muted-foreground/60">{submission.submittedAt.split(" ")[0]}</span>
          {submission.feedback && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide",
                submission.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}
            >
              {submission.feedback.substring(0, 10)}
              {submission.feedback.length > 10 ? "..." : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReviewPanelProps {
  submission: MeetingMaterialPageSubmission;
  canReview: boolean;
  canApprove: boolean;
  canReject: boolean;
  feedback: string;
  onFeedbackChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onPreview: (file: { fileName: string; fileUrl?: string }) => void;
}

function ReviewPanel({
  submission,
  canReview,
  canApprove,
  canReject,
  feedback,
  onFeedbackChange,
  onApprove,
  onReject,
  onPreview,
}: ReviewPanelProps) {
  return (
    <div className="mt-4 ml-14 p-4 rounded-xl border border-transparent bg-secondary/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
      {submission.hasConflict && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-sm space-y-1.5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
          <p className="font-semibold text-amber-800 flex items-center gap-1.5 ml-2">
            <AlertTriangle className="h-4 w-4" />
            发现版本冲突
          </p>
          <p className="text-amber-700 leading-relaxed">{submission.conflictDescription}</p>
        </div>
      )}

      <div className="space-y-2.5">
        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">提交文件</h4>
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg border border-border/60 bg-secondary/10">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{submission.fileName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{submission.fileSize} MB</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg font-medium"
              onClick={() => onPreview({ fileName: submission.fileName, fileUrl: submission.fileUrl })}
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              预览
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-lg font-medium">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              下载
            </Button>
          </div>
        </div>
        {submission.note && <p className="text-xs text-muted-foreground pl-1">{submission.note}</p>}
      </div>

      {canReview && (
        <div className="space-y-4 pt-2">
          <h4 className="font-semibold text-foreground text-sm">{canApprove ? "审核意见" : "驳回意见"}</h4>

          <div className="flex flex-wrap gap-2">
            {(canApprove ? approveQuickFeedbacks : rejectQuickFeedbacks).map(text => (
              <button
                key={text}
                type="button"
                onClick={() => onFeedbackChange(text)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                  feedback === text
                    ? "bg-orange-100/80 text-orange-800 border-orange-200"
                    : "bg-background border-border/80 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                {text}
              </button>
            ))}
          </div>

          <Textarea
            rows={3}
            placeholder={canApprove ? "输入审核意见（驳回时必填）..." : "输入驳回原因（必填）..."}
            value={feedback}
            onChange={e => onFeedbackChange(e.target.value)}
            className="resize-none text-sm bg-background border-border focus-visible:ring-primary/20 rounded-xl px-4 py-3"
          />

          <div className="flex flex-col sm:flex-row gap-4 pt-2 pb-2">
            {canReject && (
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl border-destructive/60 text-destructive hover:bg-destructive/5 hover:text-destructive gap-2 text-sm font-semibold transition-colors"
                onClick={onReject}
              >
                <XCircle className="h-4 w-4" />
                驳回
              </Button>
            )}
            {canApprove && (
              <Button
                className="flex-1 h-11 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white gap-2 text-sm font-semibold shadow-sm transition-colors"
                onClick={onApprove}
              >
                <CheckCircle2 className="h-4 w-4" />
                通过
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
