import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  MeetingMaterialUserAssignment,
  useTaskContext,
} from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { FilePreviewDialog } from "@/pages/ppt/components/FilePreviewDialog";
import { TaskFormKeyEnum } from "@/enums/task";

import { DeptAssignForm } from "./ppt-collab-forms/DeptAssignForm";
import { AssignPagesForm } from "./ppt-collab-forms/AssignPagesForm";
import { SubmitForm } from "./ppt-collab-forms/SubmitForm";
import { ReviewForm } from "./ppt-collab-forms/ReviewForm";
import { FinalApproveForm } from "./ppt-collab-forms/FinalApproveForm";
import { MergeForm } from "./ppt-collab-forms/MergeForm";
import type { PptCollabFormProps } from "./ppt-collab-forms/types";

import { stageColor, stageLabel, type AssignDraft } from "./drawer-parts/constants";
import { DeptHeadStatsCards } from "./drawer-parts/DeptHeadStatsCards";
import { OverviewCards } from "./drawer-parts/OverviewCards";
import { MergedFileCard } from "./drawer-parts/MergedFileCard";
import { MyAssignmentsSection } from "./drawer-parts/MyAssignmentsSection";
import { DeptAssignmentSection } from "./drawer-parts/DeptAssignmentSection";
import { AssignMemberDialog } from "./drawer-parts/AssignMemberDialog";
import { MergeConfirmDialog } from "./drawer-parts/MergeConfirmDialog";
import { SubmitWorkDialog } from "./drawer-parts/SubmitWorkDialog";
import type { ReviewSheetState } from "./drawer-parts/UserAssignmentRow";
import { useMeetingMaterialDrawerData } from "./drawer-parts/useMeetingMaterialPermissions";

// formKey → 表单组件映射
const FORM_KEY_COMPONENT_MAP: Record<string, React.ComponentType<PptCollabFormProps>> = {
  [TaskFormKeyEnum.PptCollabDeptAssign]: DeptAssignForm,
  [TaskFormKeyEnum.PptCollabAssign]: AssignPagesForm,
  [TaskFormKeyEnum.PptCollabSubmit]: SubmitForm,
  [TaskFormKeyEnum.PptCollabReview]: ReviewForm,
  [TaskFormKeyEnum.PptCollabFinalApprove]: FinalApproveForm,
  [TaskFormKeyEnum.PptCollabMerge]: MergeForm,
};

interface MeetingMaterialTaskDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAssignDeptId?: string;
  taskId?: string;
}

export function MeetingMaterialTaskDrawer({
  open,
  onOpenChange,
  initialAssignDeptId,
  taskId,
}: MeetingMaterialTaskDrawerProps) {
  const {
    tasks,
    reviewMeetingMaterialWork,
    assignMeetingMaterialPagesToUser,
    submitMeetingMaterialWork,
    markMeetingMaterialMerged,
  } = useTaskContext();
  const { currentUser, users, departments } = useUserContext();
  const { toast } = useToast();

  const task = tasks.find(t => t.id === taskId);
  const workflow = task?.meetingMaterialWorkflow;

  const data = useMeetingMaterialDrawerData({
    task,
    workflow,
    currentUser,
    users,
    departments,
  });

  // ----- UI state -----
  const [expandedDepts, setExpandedDepts] = useState<string[]>(["da-1", "da-2", "da-3"]);
  const [reviewSheet, setReviewSheet] = useState<ReviewSheetState | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [selectedFilePreview, setSelectedFilePreview] = useState<
    { fileName: string; fileUrl?: string; visiblePages?: Set<number> } | null
  >(null);

  // 提交对话框
  const [submitDialog, setSubmitDialog] = useState<{
    deptId: string;
    ua: MeetingMaterialUserAssignment;
  } | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitNote, setSubmitNote] = useState("");

  // 分配对话框
  const [assignDialog, setAssignDialog] = useState<{ deptId: string } | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignTaskDescription, setAssignTaskDescription] = useState("");
  const [assignPages, setAssignPages] = useState<number[]>([]);
  const [assignDrafts, setAssignDrafts] = useState<AssignDraft[]>([]);

  // 合并对话框
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  const resetAssignInputs = () => {
    setAssignUserId("");
    setAssignTaskDescription("");
    setAssignPages([]);
  };

  const closeAssignDialog = () => {
    setAssignDialog(null);
    setAssignDrafts([]);
    resetAssignInputs();
  };

  const closeSubmitDialog = () => {
    setSubmitDialog(null);
    setSubmitFile(null);
    setSubmitNote("");
  };

  // 自动打开分配对话框（外部跳转入口）
  useEffect(() => {
    if (!open || !initialAssignDeptId || !data?.canAssignPages) return;
    setAssignDialog({ deptId: initialAssignDeptId });
    setAssignDrafts([]);
    resetAssignInputs();
  }, [open, initialAssignDeptId, data?.canAssignPages]);

  // ---- 任务不存在的兜底 ----
  if (!task || !workflow || !data) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[100vw] sm:w-[500px] md:w-[620px] lg:w-[760px] xl:w-[860px] sm:max-w-none flex flex-col items-center justify-center py-24"
        >
          <p className="text-muted-foreground">任务不存在或不是例会资料类型</p>
        </SheetContent>
      </Sheet>
    );
  }

  const {
    myDeptHead,
    canCoordinateTask,
    canAssignPages,
    isDeptHeadOnly,
    canReviewTask,
    myAssignments,
    visibleDepts,
    visibleConflictCount,
    deptHeadSubmittedCount,
    deptHeadCompletedCount,
    deptHeadRejectedCount,
    isSingleDeptHeadView,
    reviewedCount,
    totalCount,
    uniqueConflictPages,
    canMarkMerged,
    canViewMergedFile,
    mergedFileName,
    getAssignableUsers,
    getDeptOccupiedPages,
  } = data;

  const currentAssignDept = assignDialog
    ? workflow.deptAssignments.find(d => d.id === assignDialog.deptId)
    : undefined;
  const assignableDeptPages = currentAssignDept
    ? [...new Set(currentAssignDept.pages)].sort((l, r) => l - r)
    : [];
  const assignableUsers = getAssignableUsers(currentAssignDept?.department);
  const stagedOccupiedPages = assignDrafts
    .filter(item => item.userId !== assignUserId)
    .flatMap(item => item.pages);
  const occupiedPages = [
    ...getDeptOccupiedPages(assignDialog?.deptId, assignUserId),
    ...stagedOccupiedPages,
  ];

  const headerConflictCount = isDeptHeadOnly ? visibleConflictCount : uniqueConflictPages.length;

  const toggleDept = (deptId: string) => {
    setExpandedDepts(prev =>
      prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]
    );
  };

  const handlePreview = (file: { fileName: string; fileUrl?: string }) =>
    setSelectedFilePreview(file);

  // ----- handlers -----
  const handleReview = async (approve: boolean) => {
    if (!reviewSheet) return;
    if (approve && !reviewSheet.canApprove) return;
    if (!approve && !reviewSheet.canReject) return;
    if (!approve && !reviewFeedback.trim()) {
      toast({ title: "请填写驳回原因", variant: "destructive" });
      return;
    }
    try {
      await reviewMeetingMaterialWork(
        task.id,
        reviewSheet.deptId,
        reviewSheet.ua.id,
        reviewSheet.sub.id,
        approve,
        approve ? reviewFeedback || "室主任审核通过" : reviewFeedback
      );
      toast({
        title: approve ? "审核通过" : "已驳回",
        description: approve
          ? `${reviewSheet.ua.userName} 的提交已通过审核`
          : "已驳回并退回至执行人",
      });
      setReviewSheet(null);
      setReviewFeedback("");
    } catch (error) {
      toast({
        title: approve ? "处理失败" : "驳回失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!submitDialog) return;
    if (!submitFile) {
      toast({ title: "请先选择要提交的 PPT 文件", variant: "destructive" });
      return;
    }
    try {
      const { hasConflict, conflictDescription } = await submitMeetingMaterialWork(
        task.id,
        submitDialog.deptId,
        submitDialog.ua.id,
        {
          file: submitFile,
          note: submitNote,
          baseVersion: Math.max(
            ...submitDialog.ua.pages.map(p => workflow.pageVersions[p] || 0)
          ),
        }
      );
      if (hasConflict) {
        toast({ title: "版本冲突", description: conflictDescription, variant: "destructive" });
      } else {
        toast({ title: "提交成功", description: "已成功提交，等待部门负责人审核" });
      }
      closeSubmitDialog();
    } catch (error) {
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const buildPendingAssignments = (): AssignDraft[] => {
    if (assignDrafts.length > 0) return assignDrafts;
    if (!assignUserId || assignPages.length === 0) return [];
    const user = assignableUsers.find(u => u.id === assignUserId);
    if (!user) return [];
    return [
      {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        department: user.department,
        pages: assignPages,
        taskDescription: assignTaskDescription.trim() || undefined,
      },
    ];
  };

  const handleAssign = async () => {
    if (!assignDialog) return;
    const pending = buildPendingAssignments();
    if (pending.length === 0) {
      toast({ title: "请至少添加一条分配", variant: "destructive" });
      return;
    }
    try {
      await assignMeetingMaterialPagesToUser(task.id, assignDialog.deptId, pending);
      toast({ title: "分配成功", description: `已完成 ${pending.length} 条人员分配` });
      closeAssignDialog();
    } catch (error) {
      toast({
        title: "分配失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const addAssignDraft = () => {
    if (!assignUserId || assignPages.length === 0) {
      toast({ title: "请选择人员和页面", variant: "destructive" });
      return;
    }
    const user = assignableUsers.find(u => u.id === assignUserId);
    if (!user) return;
    setAssignDrafts(prev => {
      const next: AssignDraft = {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        department: user.department,
        pages: assignPages,
        taskDescription: assignTaskDescription.trim() || undefined,
      };
      if (prev.some(item => item.userId === user.id)) {
        return prev.map(item => (item.userId === user.id ? next : item));
      }
      return [...prev, next];
    });
    resetAssignInputs();
  };

  const removeAssignDraft = (userId: string) =>
    setAssignDrafts(prev => prev.filter(item => item.userId !== userId));

  const handleMerge = async () => {
    try {
      await markMeetingMaterialMerged(task.id);
      toast({ title: "已发起合并", description: "系统将按已审核通过的员工稿件执行合并" });
      setMergeDialogOpen(false);
    } catch (error) {
      toast({
        title: "合并结果提交失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  // ----- render -----
  const FormComponent = task.formKey ? FORM_KEY_COMPONENT_MAP[task.formKey] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[100vw] sm:w-[500px] md:w-[620px] lg:w-[760px] xl:w-[860px] sm:max-w-none flex flex-col p-0"
      >
        <SheetHeader className="px-6 py-4 border-b bg-background shrink-0 flex flex-row items-center gap-4 space-y-0">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <SheetTitle className="text-xl">{task.title}</SheetTitle>
            <SheetDescription className="text-xs mt-1">
              创建者：{task.createdBy} · 截止：{task.deadline}
            </SheetDescription>
            {task.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center justify-end gap-2 pr-8 shrink-0">
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full",
                stageColor[workflow.stage]
              )}
            >
              {stageLabel[workflow.stage]}
            </span>
            {headerConflictCount > 0 && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                {headerConflictCount} 处版本冲突
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-[960px] mx-auto pb-12">
            {isDeptHeadOnly ? (
              <DeptHeadStatsCards
                submittedCount={deptHeadSubmittedCount}
                completedCount={deptHeadCompletedCount}
                rejectedCount={deptHeadRejectedCount}
              />
            ) : (
              <>
                <OverviewCards
                  totalPages={workflow.totalPages}
                  deptCount={workflow.deptAssignments.length}
                  reviewedCount={reviewedCount}
                  totalCount={totalCount}
                  conflictCount={uniqueConflictPages.length}
                />
                {canViewMergedFile && (
                  <MergedFileCard
                    stage={workflow.stage}
                    fileName={mergedFileName}
                    fileUrl={workflow.mergedFileUrl}
                    onPreview={handlePreview}
                  />
                )}
              </>
            )}

            {FormComponent && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <FormComponent task={task} onSuccess={() => { /* updated by executePptCollabAction */ }} />
              </div>
            )}

            <MyAssignmentsSection
              task={task}
              myAssignments={myAssignments}
              onPreview={handlePreview}
              onSubmit={payload => setSubmitDialog(payload)}
            />

            <DeptAssignmentSection
              visibleDepts={visibleDepts}
              expandedDepts={expandedDepts}
              toggleDept={toggleDept}
              currentUserId={currentUser.id}
              isSingleDeptHeadView={isSingleDeptHeadView}
              myDeptHeadId={myDeptHead?.id}
              canAssignPages={canAssignPages}
              canMarkMerged={canMarkMerged}
              canCoordinateTask={canCoordinateTask}
              canReviewTask={canReviewTask}
              reviewSheet={reviewSheet}
              reviewFeedback={reviewFeedback}
              onReviewFeedbackChange={setReviewFeedback}
              onOpenReviewPanel={setReviewSheet}
              onCloseReviewPanel={() => setReviewSheet(null)}
              onApprove={() => handleReview(true)}
              onReject={() => handleReview(false)}
              onPreview={handlePreview}
              onAssignClick={deptId => setAssignDialog({ deptId })}
              onMergeClick={() => setMergeDialogOpen(true)}
            />
          </div>

          <SubmitWorkDialog
            open={!!submitDialog}
            ua={submitDialog?.ua}
            pageVersions={workflow.pageVersions}
            file={submitFile}
            note={submitNote}
            onFileChange={setSubmitFile}
            onNoteChange={setSubmitNote}
            onClose={closeSubmitDialog}
            onConfirm={handleSubmit}
          />

          <AssignMemberDialog
            open={!!assignDialog}
            onClose={closeAssignDialog}
            assignableUsers={assignableUsers}
            assignablePages={assignableDeptPages}
            occupiedPages={occupiedPages}
            userId={assignUserId}
            onUserIdChange={setAssignUserId}
            selectedPages={assignPages}
            onSelectedPagesChange={setAssignPages}
            taskDescription={assignTaskDescription}
            onTaskDescriptionChange={setAssignTaskDescription}
            drafts={assignDrafts}
            onAddDraft={addAssignDraft}
            onRemoveDraft={removeAssignDraft}
            onConfirm={handleAssign}
          />

          <MergeConfirmDialog
            open={mergeDialogOpen}
            onOpenChange={setMergeDialogOpen}
            onConfirm={handleMerge}
          />

          <FilePreviewDialog
            open={!!selectedFilePreview}
            onOpenChange={openValue => !openValue && setSelectedFilePreview(null)}
            fileName={selectedFilePreview?.fileName || ""}
            fileUrl={selectedFilePreview?.fileUrl}
            visiblePages={selectedFilePreview?.visiblePages}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
