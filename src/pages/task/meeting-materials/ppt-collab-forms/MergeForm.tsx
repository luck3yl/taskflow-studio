import { useState } from "react";
import { GitMerge, RefreshCcw, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTaskContext } from "@/contexts/TaskContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PptCollabFormProps } from "./types";
import type { MeetingMaterialDeptAssignment } from "@/types/task";

// ---- DeptCompletionCard ----
function DeptCompletionCard({ dept }: { dept: MeetingMaterialDeptAssignment }) {
  const total = dept.userAssignments.length;
  const approved = dept.userAssignments.filter(
    (ua) => ua.status === "dept_approved" || ua.status === "final_approved"
  ).length;
  const allDone = total > 0 && approved === total;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground/90 truncate">
          {dept.department}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {approved} / {total} 员工已完成
        </p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "text-xs shrink-0",
          allDone
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        )}
      >
        {allDone ? (
          <>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            已完成
          </>
        ) : (
          "进行中"
        )}
      </Badge>
    </div>
  );
}

// ---- MergeForm ----
export function MergeForm({ task, onSuccess, onError }: PptCollabFormProps) {
  const { executePptCollabAction } = useTaskContext();
  const { toast } = useToast();

  const workflow = task.meetingMaterialWorkflow;
  const deptAssignments = workflow?.deptAssignments ?? [];

  const [isMerging, setIsMerging] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      // 直接发起合并，系统会自动将已审核通过的员工稿件合并
      const updatedTask = await executePptCollabAction(task.id, {
        action: "mark_merged",
        payload: {},
      });

      toast({ title: "合并完成", description: "系统已将各员工已审核通过的稿件自动合并" });
      onSuccess(updatedTask);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast({
        title: "合并失败",
        description: err.message,
        variant: "destructive",
      });
      onError?.(err);
    } finally {
      setIsMerging(false);
    }
  };

  const handleRejectAll = async () => {
    setIsRejecting(true);
    try {
      const updatedTask = await executePptCollabAction(task.id, {
        action: "reject_all",
        payload: {},
      });
      toast({
        title: "已驳回重做",
        description: "所有员工将重新提交",
      });
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
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">确认合并</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          系统将自动把各员工已审核通过的 PPT 稿件合并为最终文件
        </p>
      </div>

      {/* Dept completion summary */}
      <div className="space-y-2">
        {deptAssignments.map((dept) => (
          <DeptCompletionCard key={dept.id} dept={dept} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-10 font-semibold gap-1.5"
          disabled={isRejecting || isMerging}
          onClick={handleRejectAll}
        >
          {isRejecting && <Loader2 className="h-4 w-4 animate-spin" />}
          <RefreshCcw className="h-4 w-4" />
          驳回重做
        </Button>
        <Button
          className="flex-1 h-10 font-semibold gap-1.5"
          disabled={isMerging || isRejecting}
          onClick={handleMerge}
        >
          {isMerging && <Loader2 className="h-4 w-4 animate-spin" />}
          <GitMerge className="h-4 w-4" />
          确认合并
        </Button>
      </div>
    </div>
  );
}
