import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, FileText, CheckCircle2, Download } from "lucide-react";
import { useUserContext } from "@/contexts/UserContext";
import { useTaskContext, type Task } from "@/contexts/TaskContext";
import { getTaskBusinessVariablesApi } from "@/services/apis/tasks";
import { downloadFileApi } from "@/services/apis/files";
import { adaptBackendTask } from "@/services/task-adapters";
import { FilePreviewDialog } from "@/pages/ppt/components/FilePreviewDialog";
import { useToast } from "@/hooks/use-toast";
import { cn, formatPageRange } from "@/lib/utils";
import type { HistoryTodoItem } from "@/services/apis/tasks";
import type {
  MeetingMaterialDeptAssignment,
  MeetingMaterialUserAssignment,
  MeetingMaterialPageSubmission,
} from "@/types/task";

interface HistoryDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: HistoryTodoItem | null;
}

export function HistoryDetailSheet({
  open,
  onOpenChange,
  item,
}: HistoryDetailSheetProps) {
  const { me, currentUser } = useUserContext();
  const { fetchTaskDetail } = useTaskContext();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [taskDetail, setTaskDetail] = useState<any>(null);

  // 加载任务详情
  useEffect(() => {
    if (!open || !item) {
      setTask(null);
      setTaskDetail(null);
      return;
    }

    const loadDetail = async () => {
      setLoading(true);
      try {
        const detail = await fetchTaskDetail(item.id);
        setTaskDetail(detail ?? null);

        if (detail?.processInstanceId || detail?.ended) {
          try {
            const rawResponse = await getTaskBusinessVariablesApi(detail.id);
            const varsMap: Record<string, unknown> =
              (rawResponse as any)?.businessVariables || rawResponse || {};

            const taskData: Record<string, any> = {
              id: detail.id,
              title: (varsMap.title as string) || detail.name || "",
              description: (varsMap.description as string) || detail.description || "",
              formKey: detail.formKey,
              processKey:
                detail.processDefinitionId?.split(":")[0] ||
                (varsMap.deptAssignments ? "ppt_collab" : ""),
              department: (varsMap.department as string) || "",
              deadline: (varsMap.deadline as string) || detail.dueDate || "",
              createdBy: (varsMap.createdBy as string) || detail.owner || "",
              status: "active",
              workflowState: {
                stage: varsMap.stage || "created",
                totalPages: varsMap.totalPages || 0,
                templateFileId: varsMap.templateFileId,
                deptAssignments: varsMap.deptAssignments || [],
                pageVersions: varsMap.pageVersions || {},
                mergedFileId: varsMap.mergedFileId,
              },
            };
            const adapted = adaptBackendTask(taskData);
            setTask(adapted);
          } catch (err) {
            console.error("Failed to load business variables", err);
          }
        }
      } catch (err) {
        console.error("Failed to load task detail", err);
      } finally {
        setLoading(false);
      }
    };

    void loadDetail();
  }, [open, item?.id]);

  // 权限过滤：根据用户角色过滤部门分配数据
  const getFilteredDeptAssignments = (): MeetingMaterialDeptAssignment[] => {
    const deptAssignments = task?.meetingMaterialWorkflow?.deptAssignments ?? [];
    if (deptAssignments.length === 0) return [];

    const roles = me?.roles ?? [];

    // 系统管理员：看到所有
    if (roles.includes("admin")) {
      return deptAssignments;
    }

    // 室主任：看到自己科室的
    if (roles.includes("team_leader")) {
      const myDepts = deptAssignments.filter(
        (d) =>
          d.headUserId === currentUser.id ||
          d.departmentId === me?.department?.id
      );
      // 如果找到了自己管辖的部门，返回这些部门
      if (myDepts.length > 0) return myDepts;
      // 否则 fallback 到只看自己的提交
      return filterToMySubmissions(deptAssignments);
    }

    // 普通员工：只看自己的提交
    return filterToMySubmissions(deptAssignments);
  };

  // 过滤为只包含当前用户提交的记录
  const filterToMySubmissions = (
    deptAssignments: MeetingMaterialDeptAssignment[]
  ): MeetingMaterialDeptAssignment[] => {
    const filtered: MeetingMaterialDeptAssignment[] = [];
    for (const dept of deptAssignments) {
      const myUas = dept.userAssignments.filter(
        (ua) => ua.userId === currentUser.id
      );
      if (myUas.length > 0) {
        filtered.push({ ...dept, userAssignments: myUas });
      }
    }
    return filtered;
  };

  const filteredDepts = getFilteredDeptAssignments();
  const workflow = task?.meetingMaterialWorkflow;
  const mergedFileId = workflow?.mergedFileId;
  const mergedFileName = task ? `${task.title}_合并版.pptx` : "合并文件.pptx";

  // 判断当前用户是否为管理员或室主任（用于标题显示）
  const isAdminUser = me?.roles?.includes("admin");
  const isTeamLeader = me?.roles?.includes("team_leader");

  const getSectionTitle = () => {
    if (isAdminUser) return "全部提交记录";
    if (isTeamLeader) return "本科室提交记录";
    return "我的提交记录";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">
            {item?.name || "任务详情"}
          </SheetTitle>
          <SheetDescription>
            {item?.category}
            {item?.department ? ` · ${item.department}` : ""}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-3">加载中...</p>
          </div>
        ) : (
          <div className="space-y-5 pb-6">
            {/* 基本信息 */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">基本信息</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {task?.title && (
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">名称</span>
                    <span className="text-foreground">{task.title}</span>
                  </div>
                )}
                {task?.description && (
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">描述</span>
                    <span className="text-foreground">{task.description}</span>
                  </div>
                )}
                {task?.department && (
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">部门</span>
                    <span className="text-foreground">{task.department}</span>
                  </div>
                )}
                {task?.createdBy && task.createdBy !== "系统" && (
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">创建人</span>
                    <span className="text-foreground">{task.createdBy}</span>
                  </div>
                )}
                {task?.deadline && (
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">截止</span>
                    <span className="text-foreground">{task.deadline}</span>
                  </div>
                )}
                {taskDetail?.createTime && (
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">创建</span>
                    <span className="text-foreground">
                      {new Date(taskDetail.createTime).toLocaleString("zh-CN")}
                    </span>
                  </div>
                )}
                {taskDetail?.endTime && (
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">完成</span>
                    <span className="text-foreground">
                      {new Date(taskDetail.endTime).toLocaleString("zh-CN")}
                    </span>
                  </div>
                )}
                <div className="flex">
                  <span className="text-muted-foreground w-16 shrink-0">状态</span>
                  <Badge variant="secondary" className="text-xs">
                    {item?.ended ? "已完成" : "进行中"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 合并文件 */}
            {mergedFileId && (
              <HistoryMergedFile
                mergedFileId={mergedFileId}
                fileName={mergedFileName}
              />
            )}

            {/* 部门提交记录（按权限过滤） */}
            {filteredDepts.length > 0 &&
              filteredDepts.some((d) => d.userAssignments.length > 0) && (
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {getSectionTitle()}
                  </h3>
                  <div className="space-y-3">
                    {filteredDepts.map((dept) => (
                      <HistoryDeptCardWithPreview key={dept.id} dept={dept} />
                    ))}
                  </div>
                </div>
              )}

            {/* 没有提交记录时的提示 */}
            {filteredDepts.length === 0 && !mergedFileId && !loading && task && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                暂无可查看的提交记录
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---- 合并文件展示 ----
function HistoryMergedFile({
  mergedFileId,
  fileName,
}: {
  mergedFileId: string;
  fileName: string;
}) {
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleDownload = async () => {
    try {
      const blob = await downloadFileApi(mergedFileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "下载失败", description: "请稍后重试", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">最终合并文件</p>
              <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              预览
            </Button>
            <Button size="sm" className="h-7 px-2 text-xs" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-1" />
              下载
            </Button>
          </div>
        </div>
      </div>

      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        fileId={mergedFileId}
        fileName={fileName}
      />
    </>
  );
}

// ---- 部门提交记录卡片（带文件预览） ----
function HistoryDeptCardWithPreview({
  dept,
}: {
  dept: MeetingMaterialDeptAssignment;
}) {
  const total = dept.userAssignments.length;
  const completed = dept.userAssignments.filter(
    (ua) => ua.status === "dept_approved" || ua.status === "final_approved"
  ).length;

  return (
    <div className="rounded-lg border border-border/50 bg-secondary/5 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{dept.department}</span>
          {dept.headUserName && (
            <span className="text-xs text-muted-foreground">({dept.headUserName})</span>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            completed === total
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-amber-50 text-amber-600 border-amber-200"
          )}
        >
          {completed === total ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              全部通过
            </span>
          ) : (
            `${completed}/${total} 已通过`
          )}
        </Badge>
      </div>

      {dept.userAssignments.length > 0 && (
        <div className="space-y-2">
          {dept.userAssignments.map((ua) => (
            <UserAssignmentWithPreview key={ua.id} ua={ua} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- 用户提交条目（带文件预览按钮） ----
function UserAssignmentWithPreview({
  ua,
}: {
  ua: MeetingMaterialUserAssignment;
}) {
  const latestSub = ua.submissions[ua.submissions.length - 1];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-border/30 bg-card/50">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-semibold text-primary">
            {ua.userName.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-foreground">{ua.userName}</span>
            <span className="text-[11px] text-muted-foreground">
              第 {formatPageRange(ua.pages)} 页
            </span>
          </div>
          {latestSub && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {latestSub.submittedAt
                ? new Date(latestSub.submittedAt).toLocaleString("zh-CN")
                : ""}
              {latestSub.note && ` · ${latestSub.note}`}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] h-5 px-1.5 shrink-0",
            ua.status === "dept_approved" || ua.status === "final_approved"
              ? "text-emerald-600 border-emerald-200"
              : ua.status === "rejected"
                ? "text-red-600 border-red-200"
                : "text-muted-foreground border-border"
          )}
        >
          {ua.status === "dept_approved" || ua.status === "final_approved"
            ? "已通过"
            : ua.status === "rejected"
              ? "已驳回"
              : ua.status === "submitted"
                ? "已提交"
                : "待提交"}
        </Badge>
      </div>

      {/* 文件预览列表 */}
      {ua.submissions.length > 0 && (
        <div className="pl-10 space-y-1">
          {ua.submissions.map((sub, idx) => (
            <SubmissionFileItem key={sub.id || idx} submission={sub} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- 单个提交文件条目（带预览按钮） ----
function SubmissionFileItem({
  submission,
  index,
}: {
  submission: MeetingMaterialPageSubmission;
  index: number;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const statusLabel =
    submission.status === "approved" ||
    submission.status === "dept_approved" ||
    submission.status === "final_approved"
      ? "已通过"
      : submission.status === "rejected"
        ? "已驳回"
        : submission.status === "submitted"
          ? "已提交"
          : "";

  const statusClass =
    submission.status === "approved" ||
    submission.status === "dept_approved" ||
    submission.status === "final_approved"
      ? "text-emerald-600 border-emerald-200"
      : submission.status === "rejected"
        ? "text-red-600 border-red-200"
        : "text-muted-foreground border-border";

  const fileName = submission.fileName || `提交文件 v${submission.version || index + 1}`;

  return (
    <>
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-border/30 bg-secondary/5">
        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-[12px] text-foreground truncate flex-1">{fileName}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {statusLabel && (
            <Badge variant="outline" className={cn("text-[9px] h-4 px-1", statusClass)}>
              {statusLabel}
            </Badge>
          )}
          {submission.fileId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[11px]"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-3 w-3 mr-0.5" />
              预览
            </Button>
          )}
        </div>
      </div>

      {submission.fileId && (
        <FilePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          fileId={submission.fileId}
          fileName={fileName}
        />
      )}
    </>
  );
}
