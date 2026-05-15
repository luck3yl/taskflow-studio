import { useState } from "react";
import { CheckCircle2, XCircle, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTaskContext } from "@/contexts/TaskContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PptCollabFormProps } from "./types";
import type { MeetingMaterialDeptAssignment } from "@/types/task";

// ---- DeptSummaryCard ----
function DeptSummaryCard({ dept }: { dept: MeetingMaterialDeptAssignment }) {
  const total = dept.userAssignments.length;
  const approved = dept.userAssignments.filter(
    (ua) => ua.status === "dept_approved" || ua.status === "final_approved"
  ).length;
  const rejected = dept.userAssignments.filter(
    (ua) => ua.status === "rejected"
  ).length;
  const pending = total - approved - rejected;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground/90">
              {dept.department}
            </p>
            <p className="text-xs text-muted-foreground">
              负责人：{dept.headUserName || "未指定"}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            approved === total && total > 0
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          )}
        >
          {approved === total && total > 0 ? "全部通过" : `${approved}/${total} 通过`}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-green-50 py-2">
          <p className="text-lg font-bold text-green-700">{approved}</p>
          <p className="text-xs text-green-600/80">已通过</p>
        </div>
        <div className="rounded-lg bg-red-50 py-2">
          <p className="text-lg font-bold text-red-700">{rejected}</p>
          <p className="text-xs text-red-600/80">已驳回</p>
        </div>
        <div className="rounded-lg bg-amber-50 py-2">
          <p className="text-lg font-bold text-amber-700">{pending}</p>
          <p className="text-xs text-amber-600/80">待审核</p>
        </div>
      </div>
    </div>
  );
}

// ---- FinalApproveForm ----
export function FinalApproveForm({ task, onSuccess, onError }: PptCollabFormProps) {
  const { executePptCollabAction } = useTaskContext();
  const { toast } = useToast();

  const workflow = task.meetingMaterialWorkflow;
  const deptAssignments = workflow?.deptAssignments ?? [];

  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const updatedTask = await executePptCollabAction(task.id, {
        action: "final_approve",
        payload: { approved: true, feedback: feedback.trim() || undefined },
      });
      toast({ title: "终审通过", description: "任务已进入合并阶段" });
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
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast({ title: "请填写驳回原因", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const updatedTask = await executePptCollabAction(task.id, {
        action: "final_approve",
        payload: { approved: false, feedback: feedback.trim() },
      });
      toast({ title: "已驳回", description: "任务已退回重新编辑" });
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">终审审批</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          查看各部门审核汇总，进行最终审批
        </p>
      </div>

      {/* Dept summaries */}
      <div className="space-y-3">
        {deptAssignments.map((dept) => (
          <DeptSummaryCard key={dept.id} dept={dept} />
        ))}
      </div>

      {/* Feedback */}
      <div>
        <Label className="text-xs font-medium">审批意见</Label>
        <Textarea
          className="mt-1.5 resize-none text-sm"
          rows={3}
          placeholder="填写审批意见（驳回时必填）..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-10 border-destructive/50 text-destructive hover:bg-destructive/5 font-semibold"
          disabled={isSubmitting}
          onClick={handleReject}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <XCircle className="h-4 w-4 mr-1.5" />
          驳回
        </Button>
        <Button
          className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          disabled={isSubmitting}
          onClick={handleApprove}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
          终审通过
        </Button>
      </div>
    </div>
  );
}
