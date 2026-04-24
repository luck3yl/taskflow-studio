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
import { cn } from "@/lib/utils";
import { useTaskContext, PptDeptAssignment, PptUserAssignment, PptPageSubmission, PptStage } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

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
    case "approved": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">已通过</Badge>;
    case "rejected": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">已驳回</Badge>;
  }
}

// 页面选择器组件
function PageSelector({
  totalPages,
  selectedPages,
  occupiedPages,
  onChange,
}: {
  totalPages: number;
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
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
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
  const { tasks, reviewPptWork, assignPptPagesToUser, submitPptWork, advancePptStage } = useTaskContext();
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
  } | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [submitDialog, setSubmitDialog] = useState<{ deptId: string; ua: PptUserAssignment } | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [assignDialog, setAssignDialog] = useState<{ deptId: string } | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignPages, setAssignPages] = useState<number[]>([]);

  if (!task || !ppt) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[100vw] sm:w-[540px] md:w-[720px] lg:w-[900px] xl:w-[1200px] sm:max-w-none flex flex-col items-center justify-center py-24">
          <p className="text-muted-foreground">任务不存在或不是PPT拆分合并类型</p>
        </SheetContent>
      </Sheet>
    );
  }

  // 当前用户是否为创建者
  const isCreator = currentUser.name === task.createdBy ||
    currentUser.roles.includes("设备部长") ||
    currentUser.roles.includes("分管副部长") ||
    ppt.reviewerId === currentUser.id ||
    ppt.approverId === currentUser.id;

  // 当前用户是否为某部门负责人
  const myDeptHead = ppt.deptAssignments.find(d => d.headUserId === currentUser.id);

  // 当前用户在哪些 userAssignment 中
  const myAssignments: { dept: PptDeptAssignment; ua: PptUserAssignment }[] = [];
  for (const dept of ppt.deptAssignments) {
    for (const ua of dept.userAssignments) {
      if (ua.userId === currentUser.id) {
        myAssignments.push({ dept, ua });
      }
    }
  }

  // 已占用的页面（全局）
  const getAllOccupiedPages = (excludeDeptId?: string, excludeUserId?: string): number[] => {
    const pages: number[] = [];
    for (const dept of ppt.deptAssignments) {
      if (dept.id === excludeDeptId) continue;
      for (const ua of dept.userAssignments) {
        if (ua.userId === excludeUserId) continue;
        pages.push(...ua.pages);
      }
    }
    return pages;
  };

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
    reviewPptWork(
      task.id,
      reviewSheet.deptId,
      reviewSheet.ua.id,
      reviewSheet.sub.id,
      approve,
      approve ? (reviewFeedback || "审核通过") : reviewFeedback
    );
    toast({
      title: approve ? "审核通过" : "已驳回",
      description: approve ? `${reviewSheet.ua.userName} 的提交已通过` : `已驳回并退回至 ${reviewSheet.ua.userName}`,
    });
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
        fileName: `${currentUser.name}_第${submitDialog.ua.pages.join("")}页.pptx`,
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
    if (!assignDialog || !assignUserId || assignPages.length === 0) {
      toast({ title: "请选择人员和页面", variant: "destructive" });
      return;
    }
    const user = users.find(u => u.id === assignUserId);
    if (!user) return;
    assignPptPagesToUser(task.id, assignDialog.deptId, {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      department: user.department,
      pages: assignPages,
    });
    toast({ title: "分配成功", description: `已将第${assignPages.join("、")}页分配给 ${user.name}` });
    setAssignDialog(null);
    setAssignUserId("");
    setAssignPages([]);
  };

  // 统计进度
  const totalUserAssignments = ppt.deptAssignments.flatMap(d => d.userAssignments);
  const approvedCount = totalUserAssignments.filter(ua => ua.status === "approved").length;
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[100vw] sm:w-[540px] md:w-[720px] lg:w-[900px] xl:w-[1200px] sm:max-w-none flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center gap-4 space-y-0">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <SheetTitle>{task.title}</SheetTitle>
            <SheetDescription>创建者：{task.createdBy} · 截止：{task.deadline}</SheetDescription>
          </div>
          <div className="ml-auto flex items-center gap-2 pr-8">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", stageColor[ppt.stage])}>
              {stageLabel[ppt.stage]}
            </span>
            {uniqueConflictPages.length > 0 && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                {uniqueConflictPages.length} 处版本冲突
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6 bg-secondary/10">
          <div className="space-y-6 max-w-5xl mx-auto pb-12">

        {/* Overview cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{ppt.totalPages}</p>
              <p className="text-xs text-muted-foreground">总页数</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{ppt.deptAssignments.length}</p>
              <p className="text-xs text-muted-foreground">参与部门</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">已通过 / {totalCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-amber-600">{uniqueConflictPages.length}</p>
              <p className="text-xs text-muted-foreground">冲突页面</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">整体进度</span>
              <span className="text-muted-foreground">{approvedCount} / {totalCount} 人次已通过</span>
            </div>
            <Progress value={totalCount > 0 ? (approvedCount / totalCount) * 100 : 0} className="h-2" />
          </CardContent>
        </Card>

        {/* 版本冲突预警 */}
        {uniqueConflictPages.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                版本冲突预警
              </CardTitle>
              <CardDescription className="text-xs text-destructive/80">
                以下页面存在多个部门/人员同时编辑的情况，合并时可能覆盖已有内容
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {ppt.deptAssignments.flatMap(dept =>
                dept.userAssignments.flatMap(ua =>
                  ua.submissions
                    .filter(sub => sub.hasConflict)
                    .map(sub => (
                      <div key={sub.id} className="text-xs bg-white dark:bg-black/20 rounded-lg p-3 border border-destructive/20 space-y-1">
                        <div className="flex items-center gap-2 font-medium text-destructive">
                          <GitMerge className="h-3.5 w-3.5" />
                          {sub.submittedBy}（{dept.department}）的提交存在冲突
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{sub.conflictDescription}</p>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="h-6 text-xs">
                            <Download className="h-3 w-3 mr-1" />下载最新版本
                          </Button>
                          {(isCreator || myDeptHead?.id === dept.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                              onClick={() => setReviewSheet({ deptId: dept.id, ua, sub })}
                            >
                              <Eye className="h-3 w-3 mr-1" />手动裁决
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                )
              )}
            </CardContent>
          </Card>
        )}

        {/* 我的任务（员工视角） */}
        {myAssignments.length > 0 && (
          <Card className="shadow-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                我的任务
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {myAssignments.map(({ dept, ua }) => {
                const latestSub = ua.submissions[ua.submissions.length - 1];
                const canSubmit = ua.status === "pending" || ua.status === "rejected" || ua.status === "in_progress";
                return (
                  <div key={ua.id} className="border border-border/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">负责第 <span className="text-primary font-bold">{ua.pages.join("、")}</span> 页</p>
                        <p className="text-xs text-muted-foreground mt-0.5">所属部门：{dept.department}</p>
                      </div>
                      {userStatusBadge(ua.status)}
                    </div>

                    {/* 下载模板 */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground flex-1">{task.templateFileName}</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <Download className="h-3 w-3" />仅下载我的页面
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
                      <div className="space-y-1.5">
                        {ua.submissions.slice(-2).map((sub, idx) => (
                          <div key={sub.id} className={cn(
                            "flex items-center gap-2 p-2 rounded-lg text-xs border",
                            sub.hasConflict ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border/40"
                          )}>
                            {sub.hasConflict && <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 truncate">{sub.fileName}</span>
                            <span className="text-muted-foreground">v{sub.version}</span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded font-semibold",
                              sub.status === "approved" ? "bg-green-100 text-green-700" :
                              sub.status === "rejected" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            )}>
                              {sub.status === "approved" ? "已通过" : sub.status === "rejected" ? "已驳回" : "审核中"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {canSubmit && (
                      <Button
                        className="w-full gradient-primary"
                        size="sm"
                        onClick={() => setSubmitDialog({ deptId: dept.id, ua })}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {ua.status === "rejected" ? "重新提交" : "上传提交"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* 部门分配列表 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              部门分配详情
            </h2>
            {isCreator && ppt.stage !== "merged" && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => advancePptStage(task.id, "merged")}>
                <GitMerge className="h-3.5 w-3.5" />
                标记合并完成
              </Button>
            )}
          </div>

          {ppt.deptAssignments
            .filter(dept => isCreator || dept.headUserId === currentUser.id || dept.department === currentUser.department)
            .map(dept => {
            const isExpanded = expandedDepts.includes(dept.id);
            const isDeptHead = dept.headUserId === currentUser.id;
            const deptApproved = dept.userAssignments.filter(ua => ua.status === "approved").length;

            return (
              <Card key={dept.id} className="shadow-card overflow-hidden">
                {/* Dept header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
                  onClick={() => toggleDept(dept.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{dept.department}</span>
                        {isDeptHead && <Badge className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20">负责人</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        负责第 {dept.pages.join("、")} 页 · 负责人：{dept.headUserName || "待指定"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mr-2">
                    <span className="text-xs text-muted-foreground">{deptApproved}/{dept.userAssignments.length} 通过</span>
                    {dept.userAssignments.some(ua => ua.submissions.some(s => s.hasConflict)) && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </button>

                {/* Dept body */}
                {isExpanded && (
                  <div className="border-t border-border/50">
                    <div className="p-4 space-y-3">
                      {/* 部门负责人操作：分配员工 */}
                      {isDeptHead && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 mb-2"
                          onClick={() => setAssignDialog({ deptId: dept.id })}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          分配员工
                        </Button>
                      )}

                      {dept.userAssignments.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">暂无员工分配</p>
                      )}

                      {dept.userAssignments.map(ua => {
                        const latestSub = ua.submissions[ua.submissions.length - 1];
                        const canReview = (isDeptHead || isCreator) && ua.status === "submitted" && latestSub;

                        return (
                          <div key={ua.id} className={cn(
                            "border rounded-xl p-3 space-y-2 transition-colors",
                            ua.submissions.some(s => s.hasConflict) ? "border-amber-200 bg-amber-50/30" : "border-border/50"
                          )}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{ua.userAvatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{ua.userName}</p>
                                  <p className="text-xs text-muted-foreground">第 {ua.pages.join("、")} 页</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {ua.submissions.some(s => s.hasConflict) && (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                )}
                                {userStatusBadge(ua.status)}
                                {canReview && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setReviewSheet({ deptId: dept.id, ua, sub: latestSub })}
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1" />审核
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* 提交记录摘要 */}
                            {ua.submissions.length > 0 && (
                              <div className="space-y-1">
                                {ua.submissions.slice(-1).map(sub => (
                                  <div key={sub.id} className={cn(
                                    "flex items-center gap-2 text-xs p-1.5 rounded-lg",
                                    sub.hasConflict ? "bg-amber-100/80" : "bg-secondary/40"
                                  )}>
                                    {sub.hasConflict ? (
                                      <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
                                    ) : (
                                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                                    )}
                                    <span className="flex-1 truncate">{sub.fileName}</span>
                                    <span className="text-muted-foreground shrink-0">v{sub.version}</span>
                                    <span className="text-muted-foreground shrink-0">{sub.submittedAt}</span>
                                    {sub.feedback && (
                                      <span className={cn(
                                        "px-1 py-0.5 rounded text-[10px] font-medium",
                                        sub.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                      )}>
                                        {sub.feedback}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
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
              您负责第 <strong>{submitDialog?.ua.pages.join("、")}</strong> 页
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
      <Dialog open={!!assignDialog} onOpenChange={v => !v && setAssignDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              分配页面给员工
            </DialogTitle>
            <DialogDescription>选择员工并指定负责的页面（支持跳跃式分配）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">选择员工</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="选择部门内成员" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} · {u.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">分配页面</Label>
              <p className="text-xs text-muted-foreground mb-1.5">灰色页面已被他人占用，可多选实现跳跃式分配</p>
              <PageSelector
                totalPages={ppt.totalPages}
                selectedPages={assignPages}
                occupiedPages={getAllOccupiedPages(assignDialog?.deptId, assignUserId)}
                onChange={setAssignPages}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>取消</Button>
            <Button className="gradient-primary" onClick={handleAssign}>确认分配</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审核 Sheet */}
      <Sheet open={!!reviewSheet} onOpenChange={v => !v && setReviewSheet(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              审核提交内容
            </SheetTitle>
            <SheetDescription>
              {reviewSheet?.ua.userName} · 第 {reviewSheet?.ua.pages.join("、")} 页 · v{reviewSheet?.sub.version}
            </SheetDescription>
          </SheetHeader>

          {reviewSheet && (
            <div className="mt-6 space-y-5">
              {/* 冲突警告 */}
              {reviewSheet.sub.hasConflict && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                  <p className="font-semibold text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    版本冲突
                  </p>
                  <p className="text-amber-700 leading-relaxed">{reviewSheet.sub.conflictDescription}</p>
                </div>
              )}

              {/* 文件信息 */}
              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{reviewSheet.sub.fileName}</p>
                    <p className="text-xs text-muted-foreground">{reviewSheet.sub.fileSize} MB · {reviewSheet.sub.submittedAt}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Download className="h-3 w-3" />下载
                  </Button>
                </div>
                {reviewSheet.sub.note && (
                  <p className="text-xs text-muted-foreground mt-2 pl-6">{reviewSheet.sub.note}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">审核意见</Label>
                <Textarea
                  rows={3}
                  placeholder="可选填审核意见（驳回时必填）..."
                  value={reviewFeedback}
                  onChange={e => setReviewFeedback(e.target.value)}
                  className="resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ 驳回将直接退回至提交人，提交人修改后需重新走完整审核流程
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-destructive hover:bg-destructive/90"
                  onClick={() => handleReview(false)}
                >
                  <XCircle className="h-4 w-4 mr-2" />驳回
                </Button>
                <Button className="flex-1 gradient-primary" onClick={() => handleReview(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />通过
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      </ScrollArea>
    </SheetContent>
  </Sheet>
);
}
