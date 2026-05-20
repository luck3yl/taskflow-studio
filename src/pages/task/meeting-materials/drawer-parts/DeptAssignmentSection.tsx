import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GitMerge,
  Plus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPageRange } from "@/lib/utils";
import type { MeetingMaterialDeptAssignment } from "@/contexts/TaskContext";
import { UserAssignmentRow, type ReviewSheetState } from "./UserAssignmentRow";

interface DeptAssignmentSectionProps {
  visibleDepts: MeetingMaterialDeptAssignment[];
  expandedDepts: string[];
  toggleDept: (deptId: string) => void;
  currentUserId: string;
  isSingleDeptHeadView: boolean;
  myDeptHeadId?: string;
  canAssignPages: boolean;
  canMarkMerged: boolean;
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
  onAssignClick: (deptId: string) => void;
  onMergeClick: () => void;
}

/** 部门分配列表（含头部 toolbar、各部门折叠面板、员工分配行） */
export function DeptAssignmentSection({
  visibleDepts,
  expandedDepts,
  toggleDept,
  currentUserId,
  isSingleDeptHeadView,
  myDeptHeadId,
  canAssignPages,
  canMarkMerged,
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
  onAssignClick,
  onMergeClick,
}: DeptAssignmentSectionProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold flex items-center gap-2 text-foreground/90">
          <Users className="h-5 w-5 text-blue-500" />
          {isSingleDeptHeadView ? "员工任务详情" : "部门分配详情"}
        </h2>
        <div className="flex items-center gap-2">
          {myDeptHeadId && canAssignPages && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold gap-1.5 rounded-full px-4 shadow-sm"
              onClick={() => onAssignClick(myDeptHeadId)}
            >
              <Plus className="h-3.5 w-3.5" />
              分配员工
            </Button>
          )}
          {canMarkMerged && (
            <Button
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 rounded-full px-4 shadow-sm"
              onClick={onMergeClick}
            >
              <GitMerge className="h-3.5 w-3.5" />
              开始合并
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {visibleDepts.map(dept => {
          const isExpanded = expandedDepts.includes(dept.id);
          const isDeptHead = dept.headUserId === currentUserId;
          const deptApproved = dept.userAssignments.filter(
            ua => ua.status === "dept_approved" || ua.status === "final_approved"
          ).length;
          const showDeptHeader = !(isSingleDeptHeadView && isDeptHead);
          const showDeptBody = showDeptHeader ? isExpanded : true;

          return (
            <div
              key={dept.id}
              className={cn(
                showDeptHeader
                  ? "rounded-2xl border bg-background transition-all shadow-sm hover:shadow-md overflow-hidden"
                  : "space-y-3",
                showDeptHeader && (isExpanded ? "border-border/60" : "border-border/40")
              )}
            >
              {showDeptHeader && (
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
                  onClick={() => toggleDept(dept.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                        isExpanded ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground/90">{dept.department}</span>
                        {isDeptHead && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 px-2 bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                          >
                            负责人
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="font-medium text-foreground/70">负责第 {formatPageRange(dept.pages)} 页</span>
                        <span>•</span>
                        <span>负责人：{dept.headUserName || "待指定"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-medium text-foreground/70 text-right">
                        {deptApproved} / {dept.userAssignments.length} 已完成
                      </span>
                      {dept.userAssignments.length > 0 && (
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(deptApproved / dept.userAssignments.length) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {dept.userAssignments.some(ua => ua.submissions.some(s => s.hasConflict)) && (
                      <div className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      </div>
                    )}
                  </div>
                </button>
              )}

              {showDeptBody && (
                <div className={cn(showDeptHeader && "border-t border-border/40 bg-background")}>
                  <div className={cn(showDeptHeader ? "p-5 space-y-4" : "space-y-3")}>
                    {dept.userAssignments.length === 0 && (
                      <EmptyDeptState isDeptHead={isDeptHead} />
                    )}

                    {dept.userAssignments.map(ua => (
                      <UserAssignmentRow
                        key={ua.id}
                        dept={dept}
                        ua={ua}
                        isDeptHead={isDeptHead}
                        canCoordinateTask={canCoordinateTask}
                        canReviewTask={canReviewTask}
                        reviewSheet={reviewSheet}
                        reviewFeedback={reviewFeedback}
                        onReviewFeedbackChange={onReviewFeedbackChange}
                        onOpenReviewPanel={onOpenReviewPanel}
                        onCloseReviewPanel={onCloseReviewPanel}
                        onApprove={onApprove}
                        onReject={onReject}
                        onPreview={onPreview}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyDeptState({ isDeptHead }: { isDeptHead: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-background/50 rounded-2xl border border-dashed border-border/40 text-center min-h-[160px]">
      <div className="h-12 w-12 rounded-full bg-secondary/60 flex items-center justify-center mb-3">
        <Users className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-bold text-foreground/70 mb-1">尚未分配页面任务</p>
      {isDeptHead ? (
        <p className="text-xs text-muted-foreground/70 max-w-[200px] leading-relaxed">
          您可以点击右上方「分配员工」开始调度工作
        </p>
      ) : (
        <p className="text-xs text-muted-foreground/70 max-w-[200px] leading-relaxed">
          科室长暂未进行页面分配
        </p>
      )}
    </div>
  );
}
