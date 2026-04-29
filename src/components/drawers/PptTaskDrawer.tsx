import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  FileText,
  Users,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Layers,
  Eye,
  GitMerge,
  Settings,
  RefreshCcw,
} from "lucide-react";
import { cn, formatPageRange } from "@/lib/utils";
import { useTaskContext, PptDeptAssignment, PptUserAssignment, PptPageSubmission, PptStage } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { FilePreviewDialog } from "@/components/ppt/FilePreviewDialog";

// ---- helpers ----
const stageLabel: Record<PptStage, string> = {
  dept_assignment: "待分配部门",
  user_assignment: "待分配员工",
  in_progress: "编辑中",
  dept_reviewing: "部门审核中",
  final_reviewing: "最终审批中",
  approved: "已通过",
  merged: "已合并",
};
const stageColor: Record<PptStage, string> = {
  dept_assignment: "bg-gray-200 text-gray-700",
  user_assignment: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  dept_reviewing: "bg-purple-100 text-purple-700",
  final_reviewing: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  merged: "bg-emerald-100 text-emerald-700",
};

function userStatusBadge(status: PptUserAssignment["status"]) {
  switch (status) {
    case "pending": return <Badge variant="outline" className="text-muted-foreground text-xs">待提交</Badge>;
    case "in_progress": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">编辑中</Badge>;
    case "submitted": return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">待审核</Badge>;
    case "dept_approved": return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">主任已审核</Badge>;
    case "final_approved": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">部长已审批</Badge>;
    case "rejected": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">已驳回</Badge>;
  }
}

// 页面选择器组件
function PageSelector({
  pages,
  selectedPages,
  occupiedPages,
  onChange,
}: {
  pages: number[];
  selectedPages: number[];
  occupiedPages: number[];
  onChange: (pages: number[]) => void;
}) {
  const toggle = (page: number) => {
    if (occupiedPages.includes(page) && !selectedPages.includes(page)) return;
    const next = selectedPages.includes(page)
      ? selectedPages.filter(p => p !== page)
      : [...selectedPages, page].sort((a, b) => a - b);
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pages.map(page => {
        const isSelected = selectedPages.includes(page);
        const isOccupied = occupiedPages.includes(page) && !isSelected;
        return (
          <button
            key={page}
            type="button"
            disabled={isOccupied}
            onClick={() => toggle(page)}
            className={cn(
              "h-8 w-8 rounded-md border text-xs font-medium transition-all",
              isSelected ? "bg-primary text-white border-primary shadow-sm" : "",
              isOccupied ? "bg-muted text-muted-foreground border-dashed cursor-not-allowed opacity-50" : "",
              !isSelected && !isOccupied ? "border-border hover:border-primary hover:text-primary" : ""
            )}
          >
            {page}
          </button>
        );
      })}
    </div>
  );
}

const quickFeedbacks = [
  "准予通过",
  "数据有误，请核实",
  "格式需要调整",
  "内容不够完整",
  "请补充更多细节",
];

export function PptTaskDrawer({
  open,
  onOpenChange,
  taskId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string;
}) {
  const navigate = useNavigate();
  const { tasks, reviewPptWork, finalApprovePptWork, assignPptPagesToUser, submitPptWork, advancePptStage } = useTaskContext();
  const { currentUser, users } = useUserContext();
  const { toast } = useToast();

  const task = tasks.find(t => t.id === taskId);
  const ppt = task?.pptWorkflow;

  // UI state
  const [expandedDepts, setExpandedDepts] = useState<string[]>(["da-1", "da-2", "da-3"]);
  const [reviewSheet, setReviewSheet] = useState<{
    deptId: string;
    ua: PptUserAssignment;
    sub: PptPageSubmission;
    isFinalApprove?: boolean;
  } | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [selectedFilePreview, setSelectedFilePreview] = useState<{ fileName: string; fileUrl?: string } | null>(null);
  const [submitDialog, setSubmitDialog] = useState<{ deptId: string; ua: PptUserAssignment } | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [assignDialog, setAssignDialog] = useState<{ deptId: string } | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignTaskDescription, setAssignTaskDescription] = useState("");
  const [assignPages, setAssignPages] = useState<number[]>([]);
  const [assignDrafts, setAssignDrafts] = useState<Array<{
    userId: string;
    userName: string;
    userAvatar: string;
    department: string;
    pages: number[];
    taskDescription?: string;
  }>>([]);

  if (!task || !ppt) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[100vw] sm:w-[500px] md:w-[620px] lg:w-[760px] xl:w-[860px] sm:max-w-none flex flex-col items-center justify-center py-24">
          <p className="text-muted-foreground">任务不存在或不是例会资料类型</p>
        </SheetContent>
      </Sheet>
    );
  }

  // 当前用户是否为创建者
  // 当前用户是否为创建者
  const isCreator = currentUser.name === task.createdBy ||
    ppt.reviewerId === currentUser.id ||
    ppt.approverId === currentUser.id;
  // 当前用户是否为部长（可做最终审批）
  const isDeptManager = currentUser.roles.includes("设备部长") || currentUser.roles.includes("分管副部长");

  // 当前用户是否为某部门负责人  // 当前用户是否为某部门负责人
  const myDeptHead = ppt.deptAssignments.find(d => d.headUserId === currentUser.id);
  const isDeptHeadOnly = !!myDeptHead && !isCreator && !isDeptManager;

  // 当前用户在哪些 userAssignment 中
  const myAssignments: { dept: PptDeptAssignment; ua: PptUserAssignment }[] = [];
  for (const dept of ppt.deptAssignments) {
    for (const ua of dept.userAssignments) {
      if (ua.userId === currentUser.id) {
        myAssignments.push({ dept, ua });
      }
    }
  }

  const currentAssignDept = assignDialog
    ? ppt.deptAssignments.find(dept => dept.id === assignDialog.deptId)
    : undefined;
  const assignableDeptPages = currentAssignDept
    ? [...new Set(currentAssignDept.pages)].sort((left, right) => left - right)
    : [];
  const getDeptOccupiedPages = (deptId?: string, excludeUserId?: string): number[] => {
    if (!deptId) return [];

    const dept = ppt.deptAssignments.find(item => item.id === deptId);
    if (!dept) return [];

    return dept.userAssignments
      .filter(ua => ua.userId !== excludeUserId)
      .flatMap(ua => ua.pages);
  };
  const assignableUsers = currentAssignDept
    ? users.filter(user =>
        user.department === currentAssignDept.department &&
        !user.roles.some(role => ["室主任", "设备组长", "分管副部长", "设备部长", "设备厂长"].includes(role))
      )
    : [];
  const stagedOccupiedPages = assignDrafts
    .filter(item => item.userId !== assignUserId)
    .flatMap(item => item.pages);
  const visibleDepts = ppt.deptAssignments.filter(
    dept => isCreator || dept.headUserId === currentUser.id || dept.department === currentUser.department
  );
  const visibleAssignments = visibleDepts.flatMap(dept => dept.userAssignments);
  const visibleConflictCount = [...new Set(
    visibleDepts.flatMap(dept =>
      dept.userAssignments.flatMap(ua =>
        ua.submissions.flatMap(sub => {
          if (!sub.hasConflict) {
            return [] as number[];
          }
          return ua.pages.filter(page => (ppt.pageVersions[page] || 0) > sub.baseVersion);
        })
      )
    )
  )].length;
  const deptHeadSubmittedCount = visibleAssignments.filter(ua => ua.status === "submitted").length;
  const deptHeadWaitingFinalCount = visibleAssignments.filter(ua => ua.status === "dept_approved").length;
  const deptHeadFinalApprovedCount = visibleAssignments.filter(ua => ua.status === "final_approved").length;
  const isSingleDeptHeadView = isDeptHeadOnly && visibleDepts.length === 1;

  const toggleDept = (deptId: string) => {
    setExpandedDepts(prev =>
      prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]
    );
  };

  const handleReview = (approve: boolean) => {
    if (!reviewSheet) return;
    if (!approve && !reviewFeedback.trim()) {
      toast({ title: "请填写驳回原因", variant: "destructive" });
      return;
    }
    if (reviewSheet.isFinalApprove) {
      // 部长最终审批
      finalApprovePptWork(
        task.id,
        reviewSheet.deptId,
        reviewSheet.ua.id,
        approve,
        approve ? (reviewFeedback || "部长审批通过") : reviewFeedback
      );
      toast({
        title: approve ? "审批通过" : "已驳回",
        description: approve
          ? `${reviewSheet.ua.userName} 的工作已通过部长审批`
          : `已驳回并退回至`,
      });
    } else {
      // 室主任审核（通过后状态变为 dept_approved，等待部长审批）
      reviewPptWork(
        task.id,
        reviewSheet.deptId,
        reviewSheet.ua.id,
        reviewSheet.sub.id,
        approve,
        approve ? (reviewFeedback || "室主任审核通过，等待部长审批") : reviewFeedback
      );
      toast({
        title: approve ? "审核通过" : "已驳回",
        description: approve
            ? `${reviewSheet.ua.userName} 的提交已通过室主任审核，等待部长审批`
            : `已驳回并退回至`,
      });
    }
    setReviewSheet(null);
    setReviewFeedback("");
  };

    const handleSubmit = () => {
    if (!submitDialog) return;
    const { hasConflict, conflictDescription } = submitPptWork(
      task.id,
      submitDialog.deptId,
      submitDialog.ua.id,
      {
        fileName: `${currentUser.name}_第${formatPageRange(submitDialog.ua.pages)}页.pptx`,
        fileSize: Math.round(Math.random() * 1.5 * 10) / 10 + 0.5,
        note: submitNote,
        baseVersion: Math.max(...submitDialog.ua.pages.map(p => ppt.pageVersions[p] || 0)),
      }
    );
    if (hasConflict) {
      toast({
        title: "⚠️ 版本冲突警告",
        description: conflictDescription,
        variant: "destructive",
      });
    } else {
      toast({ title: "提交成功", description: "已成功提交，等待部门负责人审核" });
    }
    setSubmitDialog(null);
    setSubmitNote("");
  };

  const handleAssign = () => {
    if (!assignDialog) {
      return;
    }

    const pendingAssignments = assignDrafts.length > 0
      ? assignDrafts
      : (() => {
          if (!assignUserId || assignPages.length === 0) {
            return [];
          }

          const user = assignableUsers.find(u => u.id === assignUserId);
          return user ? [{
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            department: user.department,
            pages: assignPages,
            taskDescription: assignTaskDescription.trim() || undefined,
          }] : [];
        })();

    if (pendingAssignments.length === 0) {
      toast({ title: "请至少添加一条分配", variant: "destructive" });
      return;
    }

    pendingAssignments.forEach(assignment => {
      assignPptPagesToUser(task.id, assignDialog.deptId, assignment);
    });

    toast({ title: "分配成功", description: `已完成 ${pendingAssignments.length} 条人员分配` });
    setAssignDialog(null);
    setAssignDrafts([]);
    resetAssignInputs();
  };

  // 统计进度
  const totalUserAssignments = ppt.deptAssignments.flatMap(d => d.userAssignments);
  const approvedCount = totalUserAssignments.filter(ua => ua.status === "final_approved").length;
  const submittedCount = totalUserAssignments.filter(ua => ua.status === "submitted").length;
  const totalCount = totalUserAssignments.length;

  // 冲突页面
  const conflictPages: number[] = [];
  for (const dept of ppt.deptAssignments) {
    for (const ua of dept.userAssignments) {
      for (const sub of ua.submissions) {
        if (sub.hasConflict) {
          conflictPages.push(...ua.pages.filter(p => {
            const ver = ppt.pageVersions[p] || 0;
            return ver > sub.baseVersion;
          }));
        }
      }
    }
  }
  const uniqueConflictPages = [...new Set(conflictPages)];
  const canViewMergedFile = !isDeptHeadOnly && (ppt.stage === "merged" || !!ppt.mergedFileUrl || (totalCount > 0 && approvedCount === totalCount));
  const mergedFileName = `${task.title}_合并版.pptx`;

  const resetAssignInputs = () => {
    setAssignUserId("");
    setAssignTaskDescription("");
    setAssignPages([]);
  };

  const addAssignDraft = () => {
    if (!assignUserId || assignPages.length === 0) {
      toast({ title: "请选择人员和页面", variant: "destructive" });
      return;
    }

    const user = assignableUsers.find(u => u.id === assignUserId);
    if (!user) return;

    setAssignDrafts(prev => {
      const nextItem = {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        department: user.department,
        pages: assignPages,
        taskDescription: assignTaskDescription.trim() || undefined,
      };

      if (prev.some(item => item.userId === user.id)) {
        return prev.map(item => item.userId === user.id ? nextItem : item);
      }
      return [...prev, nextItem];
    });

    resetAssignInputs();
  };

  const removeAssignDraft = (userId: string) => {
    setAssignDrafts(prev => prev.filter(item => item.userId !== userId));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[100vw] sm:w-[500px] md:w-[620px] lg:w-[760px] xl:w-[860px] sm:max-w-none flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b bg-background shrink-0 flex flex-row items-center gap-4 space-y-0">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <SheetTitle className="text-xl">{task.title}</SheetTitle>
            <SheetDescription className="text-xs mt-1">创建者：{task.createdBy} · 截止：{task.deadline}</SheetDescription>
          </div>
          <div className="ml-auto flex items-center justify-end gap-2 pr-8 shrink-0">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", stageColor[ppt.stage])}>
              {stageLabel[ppt.stage]}
            </span>
            {(isDeptHeadOnly ? visibleConflictCount : uniqueConflictPages.length) > 0 && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                {isDeptHeadOnly ? visibleConflictCount : uniqueConflictPages.length} 处版本冲突
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-[960px] mx-auto pb-12">

        {isDeptHeadOnly ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-[13px] font-medium text-muted-foreground flex items-center gap-2">
                    待主任审核
                  </p>
                  <p className="text-3xl font-black tracking-tight text-foreground">{deptHeadSubmittedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 group-hover:bg-amber-100 transition-colors flex items-center justify-center border border-amber-100/50">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-[13px] font-medium text-muted-foreground flex items-center gap-2">
                    待部长审批
                  </p>
                  <p className="text-3xl font-black tracking-tight text-foreground">{deptHeadWaitingFinalCount}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-50 group-hover:bg-orange-100 transition-colors flex items-center justify-center border border-orange-100/50">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-[13px] font-medium text-muted-foreground flex items-center gap-2">
                    已终审
                  </p>
                  <p className="text-3xl font-black tracking-tight text-foreground">{deptHeadFinalApprovedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors flex items-center justify-center border border-green-100/50">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-center group overflow-hidden relative">
                  <div className="flex items-center justify-between z-10 relative">
                    <div className="space-y-1.5">
                      <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{ppt.totalPages}</p>
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        总页数
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors shrink-0 flex items-center justify-center border border-blue-100/50">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-center group overflow-hidden relative">
                  <div className="flex items-center justify-between z-10 relative">
                    <div className="space-y-1.5">
                      <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{ppt.deptAssignments.length}</p>
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        参与部门
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors shrink-0 flex items-center justify-center border border-indigo-100/50">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-center group overflow-hidden relative">
                  <div className="flex items-center justify-between z-10 relative mb-3">
                    <div className="space-y-1">
                      <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{approvedCount}</p>
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                        审批通过
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors shrink-0 flex items-center justify-center border border-emerald-100/50">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="w-full relative z-10">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-emerald-600/80 mb-1.5">
                      <span>进度 {totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0}%</span>
                      <span>{approvedCount} / {totalCount}</span>
                    </div>
                    <Progress value={totalCount > 0 ? (approvedCount / totalCount) * 100 : 0} className="h-1.5 bg-emerald-100/50 w-full [&>div]:bg-emerald-500" />
                  </div>
              </div>
              <div className={cn(
                  "rounded-2xl border p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-center group overflow-hidden relative",
                  uniqueConflictPages.length > 0
                      ? "border-red-200/60 bg-red-50/50"
                      : "border-border/60 bg-card"
              )}>
                  <div className="flex items-center justify-between z-10 relative">
                    <div className="space-y-1.5">
                      <p className={cn(
                          "text-2xl sm:text-3xl font-black tracking-tight",
                          uniqueConflictPages.length > 0 ? "text-red-600" : "text-foreground"
                      )}>{uniqueConflictPages.length}</p>
                      <p className={cn(
                          "text-xs font-medium flex items-center gap-1.5 whitespace-nowrap",
                          uniqueConflictPages.length > 0 ? "text-red-600/80" : "text-muted-foreground"
                      )}>
                        冲突页面
                      </p>
                    </div>
                    <div className={cn(
                        "h-10 w-10 rounded-xl transition-colors shrink-0 flex items-center justify-center border",
                        uniqueConflictPages.length > 0
                            ? "bg-red-100/80 border-red-200 group-hover:bg-red-200"
                            : "bg-amber-50/80 border-amber-100 group-hover:bg-amber-100/80"
                    )}>
                      <GitMerge className={cn("h-5 w-5", uniqueConflictPages.length > 0 ? "text-red-600" : "text-amber-500")} />
                    </div>
                  </div>
              </div>
            </div>

            {canViewMergedFile && (
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3 mt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      合并后文件
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ppt.stage === "merged" ? "已完成合并，可直接预览最终文件。" : "全部审批通过后，最终合并文件会显示在这里。"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={!ppt.mergedFileUrl}
                      onClick={() => setSelectedFilePreview({ fileName: mergedFileName, fileUrl: ppt.mergedFileUrl })}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />预览
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={!ppt.mergedFileUrl}
                      onClick={() => ppt.mergedFileUrl && window.open(ppt.mergedFileUrl, "_blank", "noopener,noreferrer")}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />下载
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
                  文件名：{mergedFileName}{!ppt.mergedFileUrl ? "，合并文件生成后可预览/下载" : ""}
                </div>
              </div>
            )}
          </>
        )}

        {/* 我的任务（员工视角） */}
        {myAssignments.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-blue-500" />
              我的任务
            </div>
            <div className="space-y-4 bg-background rounded-2xl p-6 border border-border/40 shadow-sm hover:shadow-md transition-shadow">
              {myAssignments.map(({ dept, ua }) => {
                const latestSub = ua.submissions[ua.submissions.length - 1];
                const canSubmit = ua.status === "pending" || ua.status === "rejected" || ua.status === "in_progress";
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
                        {userStatusBadge(ua.status)}
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
                      <Button size="sm" variant="outline" className="h-9 font-medium gap-2 shrink-0 border-border/60 hover:bg-background">
                        <Download className="h-4 w-4 text-muted-foreground" />仅下载我的页面
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
                        {ua.submissions.slice(-2).map((sub, idx) => (
                          <div key={sub.id} className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                            sub.hasConflict ? "bg-amber-50 border-amber-200 hover:border-amber-300" : "bg-secondary/40 border-transparent hover:bg-background/80"
                          )}>
                            {sub.hasConflict ? <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /> : <FileText className="h-4 w-4 text-blue-500 shrink-0" />}
                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                <p className="text-sm font-medium truncate text-foreground/90">{sub.fileName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded font-medium",
                                        sub.status === "approved" ? "bg-green-100 text-green-700" :
                                        sub.status === "rejected" ? "bg-red-100 text-red-700" :
                                        "bg-amber-100 text-amber-700"
                                    )}>
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
                              onClick={() => setSelectedFilePreview({
                                fileName: sub.fileName,
                                fileUrl: sub.fileUrl,
                              })}
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
                        onClick={() => setSubmitDialog({ deptId: dept.id, ua })}
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
        )}

        {/* 部门分配列表 */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground/90">
              <Users className="h-5 w-5 text-blue-500" />
              {isSingleDeptHeadView ? "员工任务详情" : "部门分配详情"}
            </h2>
            {isCreator && ppt.stage !== "merged" && (
              <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 rounded-full px-4 shadow-sm" onClick={() => advancePptStage(task.id, "merged")}>
                <GitMerge className="h-3.5 w-3.5" />
                标记合并完成
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {visibleDepts.map(dept => {
              const isExpanded = expandedDepts.includes(dept.id);
              const isDeptHead = dept.headUserId === currentUser.id;
              const deptApproved = dept.userAssignments.filter(ua => ua.status === "final_approved").length;
              const showDeptHeader = !(isSingleDeptHeadView && isDeptHead);
              const showDeptBody = showDeptHeader ? isExpanded : true;

              return (
                <div key={dept.id} className={cn(
                  showDeptHeader
                    ? "rounded-2xl border bg-background transition-all shadow-sm hover:shadow-md overflow-hidden"
                    : "space-y-3",
                  showDeptHeader && (isExpanded ? "border-border/60" : "border-border/40")
                )}>
                  {showDeptHeader && (
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
                      onClick={() => toggleDept(dept.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                          isExpanded ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                        )}>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground/90">{dept.department}</span>
                            {isDeptHead && <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100">负责人</Badge>}
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
                          <span className="text-xs font-medium text-foreground/70 text-right">{deptApproved} / {dept.userAssignments.length} 终审</span>
                          {dept.userAssignments.length > 0 && (
                             <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                               <div className="h-full bg-green-500 rounded-full" style={{width: `${(deptApproved/dept.userAssignments.length)*100}%`}}></div>
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

                  {/* Dept body */}
                  {showDeptBody && (
                    <div className={cn(showDeptHeader && "border-t border-border/40 bg-background")}>
                      <div className={cn(showDeptHeader ? "p-5 space-y-4" : "space-y-3")}>
                        {/* 部门负责人操作：分配员工 */}
                        {isDeptHead && (
                          <Button
                          size="sm"
                          variant="outline"
                          className="h-9 font-medium gap-2 w-fit bg-background rounded-lg shadow-sm hover:border-blue-300 hover:text-blue-600 transition-colors"
                          onClick={() => setAssignDialog({ deptId: dept.id })}
                        >
                          <Plus className="h-4 w-4" />
                          分配员工
                        </Button>
                      )}

                      {dept.userAssignments.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 bg-background/50 rounded-2xl border border-dashed border-border/40 text-center min-h-[160px]">
                          <div className="h-12 w-12 rounded-full bg-secondary/60 flex items-center justify-center mb-3">
                              <Users className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                          <p className="text-sm font-bold text-foreground/70 mb-1">
                            尚未分配页面任务
                          </p>
                          {isDeptHead ? (
                              <p className="text-xs text-muted-foreground/70 max-w-[200px] leading-relaxed">
                                您可以点击上方「分配员工」开始调度工作
                              </p>
                          ) : (
                              <p className="text-xs text-muted-foreground/70 max-w-[200px] leading-relaxed">
                                科室长暂未进行页面分配
                              </p>
                          )}
                        </div>
                      )}

                      {dept.userAssignments.map((ua, index) => {
                        const latestSub = ua.submissions[ua.submissions.length - 1];
                        const canDeptReview = isDeptHead && ua.status === "submitted" && latestSub;
                        const canFinalApprove = isDeptManager && ua.status === "dept_approved" && latestSub;
                        const canReview = canDeptReview || canFinalApprove;
                        const canInspect = !!latestSub && (isDeptHead || isDeptManager || isCreator);
                        const isReviewing = reviewSheet?.ua.id === ua.id;
                        const assignmentDescription = ua.taskDescription || dept.requirement || "暂无任务描述";

                        return (
                          <div key={ua.id} className={cn(
                            "group relative p-4 sm:p-5 transition-all duration-200 ease-in-out rounded-2xl",
                            ua.submissions.some(s => s.hasConflict)
                              ? "bg-amber-50/50 border border-amber-200/60 shadow-sm"
                              : "bg-card border border-border/60 shadow-sm hover:shadow-md hover:border-primary/20"
                          )}>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-background shadow-sm">
                                  <AvatarFallback className="text-sm bg-primary/10 text-primary font-medium">{ua.userAvatar}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <p className="text-[15px] font-semibold text-foreground/90">{ua.userName}</p>
                                    {userStatusBadge(ua.status)}
                                    <Badge variant="secondary" className="h-[22px] px-2 text-[11px] font-medium bg-secondary/50 text-muted-foreground shrink-0 rounded-md">
                                      第 {formatPageRange(ua.pages)} 页
                                    </Badge>
                                  </div>
                                  <p className="text-[13px] text-muted-foreground/80 leading-relaxed max-w-[90%]" title={assignmentDescription}>
                                    {assignmentDescription}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 sm:mt-1 self-start sm:self-auto ml-14 sm:ml-0">
                                {ua.submissions.some(s => s.hasConflict) && (
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
                                      canReview ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-secondary/80 hover:bg-secondary border border-border/50 text-foreground/80"
                                    )}
                                    onClick={() => isReviewing
                                      ? setReviewSheet(null)
                                      : setReviewSheet({ deptId: dept.id, ua, sub: latestSub!, isFinalApprove: !!canFinalApprove })}
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                                    {isReviewing ? "收起面板" : canReview ? (canFinalApprove ? "开始终审" : "开始审核") : "查看详情"}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* 最近一次提交记录（非评审模式下展示） */}
                            {!isReviewing && ua.submissions.length > 0 && (
                              <div className="mt-4 ml-14 max-w-2xl">
                                {ua.submissions.slice(-1).map(sub => (
                                  <div key={sub.id} className={cn(
                                    "flex items-center gap-3 text-[13px] p-2.5 rounded-lg border transition-colors",
                                    sub.hasConflict ? "bg-amber-100/50 border-amber-200/60" : "bg-card border-border/40 shadow-sm hover:border-primary/20"
                                  )}>
                                    <div className={cn(
                                      "h-6 w-6 rounded-md flex items-center justify-center shrink-0",
                                      sub.hasConflict ? "bg-amber-100" : "bg-blue-50"
                                    )}>
                                      {sub.hasConflict ? (
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                      ) : (
                                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                                      )}
                                    </div>
                                    <span className="flex-1 truncate font-medium text-foreground/80">{sub.fileName}</span>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="text-muted-foreground/60 font-mono text-[11px] bg-secondary/50 px-1.5 py-0.5 rounded">v{sub.version}</span>
                                      <span className="text-muted-foreground/60">{sub.submittedAt.split(' ')[0]}</span>
                                      {sub.feedback && (
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide",
                                          sub.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        )}>
                                          {sub.feedback.substring(0, 10)}${sub.feedback.length > 10 ? '...' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 展开的评审面板 */}
                            {isReviewing && latestSub && (
                              <div className="mt-4 ml-14 p-4 rounded-xl border border-transparent bg-secondary/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                {latestSub.hasConflict && (
                                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-sm space-y-1.5 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                                    <p className="font-semibold text-amber-800 flex items-center gap-1.5 ml-2">
                                      <AlertTriangle className="h-4 w-4" />
                                      发现版本冲突
                                    </p>
                                    <p className="text-amber-700 leading-relaxed">{latestSub.conflictDescription}</p>
                                  </div>
                                )}

                                {/* 提交文件 */}
                                <div className="space-y-2.5">
                                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                    提交文件
                                  </h4>
                                  <div className="flex items-center gap-3 px-3 py-3 rounded-lg border border-border/60 bg-secondary/10">
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                      <FileText className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{latestSub.fileName}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{latestSub.fileSize} MB</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-1.5 rounded-lg font-medium"
                                        onClick={() => setSelectedFilePreview({
                                          fileName: latestSub.fileName,
                                          fileUrl: latestSub.fileUrl,
                                        })}
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
                                  {latestSub.note && (
                                    <p className="text-xs text-muted-foreground pl-1">{latestSub.note}</p>
                                  )}
                                </div>

                                {/* 审核意见 */}
                                {canReview && (
                                  <div className="space-y-4 pt-2">
                                    <h4 className="font-semibold text-foreground text-sm">审核意见</h4>

                                    <div className="flex flex-wrap gap-2">
                                      {quickFeedbacks.map((text) => (
                                        <button
                                          key={text}
                                          onClick={() => setReviewFeedback(text)}
                                          className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                                            reviewFeedback === text
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
                                      placeholder="输入审核意见（驳回时必填）..."
                                      value={reviewFeedback}
                                      onChange={e => setReviewFeedback(e.target.value)}
                                      className="resize-none text-sm bg-background border-border focus-visible:ring-primary/20 rounded-xl px-4 py-3"
                                    />

                                    <div className="flex flex-col sm:flex-row gap-4 pt-2 pb-2">
                                      <Button
                                        variant="outline"
                                        className="flex-1 h-11 rounded-xl border-destructive/60 text-destructive hover:bg-destructive/5 hover:text-destructive gap-2 text-sm font-semibold transition-colors"
                                        onClick={() => handleReview(false)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                        驳回
                                      </Button>
                                      <Button
                                        className="flex-1 h-11 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white gap-2 text-sm font-semibold shadow-sm transition-colors"
                                        onClick={() => handleReview(true)}
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        通过
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* 上传提交 Dialog */}
      <Dialog open={!!submitDialog} onOpenChange={v => !v && setSubmitDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              上传提交
            </DialogTitle>
            <DialogDescription>
              您负责第 <strong>{formatPageRange(submitDialog?.ua.pages)}</strong> 页
              {submitDialog && submitDialog.ua.pages.some(p => (ppt.pageVersions[p] || 0) > 0) && (
                <span className="block mt-1 text-amber-600 text-xs">
                  ⚠️ 这些页面已有其他版本，系统将自动进行版本冲突检测
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">上传文件</Label>
              <div className="mt-1.5 flex items-center justify-center h-20 border-2 border-dashed border-border rounded-xl bg-muted/30 cursor-pointer hover:border-primary/50 transition-colors">
                <div className="text-center">
                  <Upload className="h-5 w-5 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground mt-1">点击上传 .pptx 文件</p>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">备注说明（选填）</Label>
              <Textarea
                className="mt-1.5 resize-none text-sm"
                rows={2}
                placeholder="填写本次修改说明..."
                value={submitNote}
                onChange={e => setSubmitNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialog(null)}>取消</Button>
            <Button className="gradient-primary" onClick={handleSubmit}>确认提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分配员工 Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={v => {
        if (!v) {
          setAssignDialog(null);
          setAssignDrafts([]);
          resetAssignInputs();
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              分配页面给员工
            </DialogTitle>
            <DialogDescription>选择员工并指定负责的页面，仅显示本科室已分配的页码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">选择员工</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="选择部门内成员" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} · {u.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">分配页面</Label>
              <p className="text-xs text-muted-foreground mb-1.5">仅可从本科室负责页中分配，灰色页面已被本科室其他员工占用</p>
              <PageSelector
                pages={assignableDeptPages}
                selectedPages={assignPages}
                occupiedPages={[...getDeptOccupiedPages(assignDialog?.deptId, assignUserId), ...stagedOccupiedPages]}
                onChange={setAssignPages}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">任务内容</Label>
              <Textarea
                className="mt-1.5 resize-none text-sm"
                rows={3}
                placeholder="填写该员工负责的具体内容..."
                value={assignTaskDescription}
                onChange={e => setAssignTaskDescription(e.target.value)}
              />
            </div>
            {assignDrafts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">本次待分配人员</Label>
                <div className="space-y-2">
                  {assignDrafts.map(draft => (
                    <div key={draft.userId} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{draft.userName}</p>
                        <p className="text-xs text-muted-foreground mt-1">第 {formatPageRange(draft.pages)} 页</p>
                        {draft.taskDescription && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{draft.taskDescription}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => removeAssignDraft(draft.userId)}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={addAssignDraft}>添加到本次分配</Button>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>取消</Button>
            <Button className="gradient-primary" onClick={handleAssign}>确认分配</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilePreviewDialog
        open={!!selectedFilePreview}
        onOpenChange={(open) => !open && setSelectedFilePreview(null)}
        fileName={selectedFilePreview?.fileName || ""}
        fileUrl={selectedFilePreview?.fileUrl}
      />
      </ScrollArea>
    </SheetContent>
  </Sheet>
);
}
