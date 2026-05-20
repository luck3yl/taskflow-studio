import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useTaskContext, type Task } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { uploadFileApi } from "@/services/apis/files";
import type { TaskDetailDto } from "@/services/apis/tasks";
import { getTaskBusinessVariablesApi } from "@/services/apis/tasks";
import type { FormDataField } from "@/services/apis/processes";
import { getTaskFormApi, type FormResponse } from "@/services/apis/forms";
import { adaptBackendTask } from "@/services/task-adapters";
import { canOperateTask } from "@/utils/task-permissions";
import { PdfSlideViewer } from "@/pages/ppt/components/PdfSlideViewer";
import { DeptAssignForm } from "@/pages/task/meeting-materials/ppt-collab-forms/DeptAssignForm";
import { AssignPagesForm } from "@/pages/task/meeting-materials/ppt-collab-forms/AssignPagesForm";
import { SubmitForm } from "@/pages/task/meeting-materials/ppt-collab-forms/SubmitForm";
import { ReviewForm } from "@/pages/task/meeting-materials/ppt-collab-forms/ReviewForm";
import { FinalApproveForm } from "@/pages/task/meeting-materials/ppt-collab-forms/FinalApproveForm";
import { MergeForm } from "@/pages/task/meeting-materials/ppt-collab-forms/MergeForm";
import { DynamicForm } from "@/pages/task/components/DynamicForm";
import type { PptCollabFormProps } from "@/pages/task/meeting-materials/ppt-collab-forms/types";
import {
  MEETING_MATERIAL_STAGE_CONFIG,
  TaskFormKeyEnum,
} from "@/enums/task";
import { cn, formatPageRange } from "@/lib/utils";

// ---- formKey -> 表单组件映射 ----
const FORM_KEY_COMPONENT_MAP: Record<string, React.ComponentType<PptCollabFormProps>> = {
  [TaskFormKeyEnum.PptCollabDeptAssign]:   DeptAssignForm,
  [TaskFormKeyEnum.PptCollabAssign]:       AssignPagesForm,
  [TaskFormKeyEnum.PptCollabSubmit]:       SubmitForm,
  [TaskFormKeyEnum.PptCollabReview]:       ReviewForm,
  [TaskFormKeyEnum.PptCollabFinalApprove]: FinalApproveForm,
  [TaskFormKeyEnum.PptCollabMerge]:        MergeForm,
};

// formKey -> 节点中文名
const FORM_KEY_LABEL: Record<string, string> = {
  [TaskFormKeyEnum.PptCollabDeptAssign]:   "分配部门",
  [TaskFormKeyEnum.PptCollabAssign]:       "分配员工",
  [TaskFormKeyEnum.PptCollabSubmit]:       "提交内容",
  [TaskFormKeyEnum.PptCollabReview]:       "部门审核",
  [TaskFormKeyEnum.PptCollabFinalApprove]: "终审审批",
  [TaskFormKeyEnum.PptCollabMerge]:        "合并文件",
};

// 哪些节点需要在左侧展示 PPT 预览
const FORM_KEY_NEEDS_PREVIEW = new Set<string>([
  TaskFormKeyEnum.PptCollabDeptAssign,
  TaskFormKeyEnum.PptCollabAssign,
  TaskFormKeyEnum.PptCollabSubmit,
  TaskFormKeyEnum.PptCollabReview,
  TaskFormKeyEnum.PptCollabFinalApprove,
  TaskFormKeyEnum.PptCollabMerge,
]);

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks, getTaskById, fetchTaskDetail, completePptAction } = useTaskContext();
  const { currentUser } = useUserContext();
  const { toast } = useToast();

  // 任务详情（含 formKey / formData）
  const [taskDetailResponse, setTaskDetailResponse] = useState<TaskDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  // 从 forms 接口获取的表单信息（优先级高于 task detail 中的 formKey/formData）
  const [formResponse, setFormResponse] = useState<FormResponse | null>(null);
  // 从流程变量构建的 Task 对象（包含 meetingMaterialWorkflow 等业务数据）
  const [processTask, setProcessTask] = useState<Task | null>(null);

  // 模板上传状态
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateFileId, setTemplateFileId] = useState("");
  const [templatePageCount, setTemplatePageCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // 合并节点：当前选中预览的提交文件索引
  const [mergePreviewIndex, setMergePreviewIndex] = useState(0);

  // 优先使用从流程变量构建的 task，其次用旧的 getTaskById
  const task = processTask || (taskId ? getTaskById(taskId) : undefined);

  // 进入页面时获取任务详情 + 流程变量
  useEffect(() => {
    if (!taskId) return;

    setDetailLoading(true);

    const loadDetail = async () => {
      // 获取任务详情（含 formKey / formData）
      const detail = await fetchTaskDetail(taskId);
      setTaskDetailResponse(detail ?? null);

      // 调用 forms 接口获取表单信息（优先使用此接口的结果）
      try {
        const formResp = await getTaskFormApi(taskId);
        setFormResponse(formResp);
      } catch (err) {
        console.error("Failed to fetch task form", err);
        // forms 接口失败时 fallback 到 task detail 中的 formKey/formData
      }

      // 如果任务属于某个流程实例，获取业务变量来构建业务数据
      if (detail?.processInstanceId) {
        try {
          const rawResponse = await getTaskBusinessVariablesApi(detail.id);

          // 后端可能返回 { businessVariables: {...} } 或直接返回扁平对象
          const varsMap: Record<string, unknown> =
            (rawResponse as any)?.businessVariables || rawResponse || {};

          // 用业务变量 + 任务详情构建完整的 Task 对象
          const taskData: Record<string, any> = {
            id: detail.id,
            title: (varsMap.title as string) || detail.name || "",
            description: (varsMap.description as string) || detail.description || "",
            formKey: detail.formKey,
            processKey: detail.processDefinitionId?.split(":")[0] || "",
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
            },
          };
          const adapted = adaptBackendTask(taskData);
          setProcessTask(adapted);
        } catch (err) {
          console.error("Failed to load business variables", err);
        }
      }

      setDetailLoading(false);
    };

    void loadDetail();
  }, [taskId]);

  // 从详情响应中提取 formKey 和 formData
  // 优先使用 forms 接口返回的结果，fallback 到 task detail 中的字段
  const resolvedFormKey = formResponse?.formKey || taskDetailResponse?.formKey || task?.formKey || null;
  const resolvedFormData = formResponse?.formData?.length ? formResponse.formData : (taskDetailResponse?.formData || []);

  // 决定渲染方式：
  // 1. formKey 有值 → 加载预制组件
  // 2. formData 有值 → 动态渲染字段
  // 3. 两者都为空 → 当前用户无需操作
  const hasFormKey = Boolean(resolvedFormKey);
  const hasFormData = resolvedFormData.length > 0;

  // 动态选择表单组件（仅 formKey 模式）
  const FormComponent = resolvedFormKey ? FORM_KEY_COMPONENT_MAP[resolvedFormKey] : undefined;
  const nodeLabel = resolvedFormKey ? FORM_KEY_LABEL[resolvedFormKey] || "任务节点" : "";
  const needsPreview = resolvedFormKey ? FORM_KEY_NEEDS_PREVIEW.has(resolvedFormKey) : false;

  // 权限判断：当前用户是否可操作该任务
  const canOperate = taskDetailResponse
    ? canOperateTask(taskDetailResponse, currentUser.id)
    : false;

  // 预览用的文件
  // 审核节点：展示员工提交的文件
  // 合并节点：展示选中的员工提交文件（可切换）
  // 其他节点：展示模板文件

  // 合并节点：收集所有已审核通过的员工提交
  const mergeSubmissions = useMemo(() => {
    if (resolvedFormKey !== TaskFormKeyEnum.PptCollabMerge) return [];
    const depts = task?.meetingMaterialWorkflow?.deptAssignments || [];
    const submissions: { fileId: string; fileName: string; userName: string; pages: number[] }[] = [];
    for (const dept of depts) {
      for (const ua of dept.userAssignments) {
        if (ua.submissions.length > 0) {
          const latestSub = ua.submissions[ua.submissions.length - 1];
          if (latestSub?.fileId) {
            submissions.push({
              fileId: latestSub.fileId,
              fileName: latestSub.fileName || `${ua.userName}的提交`,
              userName: ua.userName,
              pages: ua.pages,
            });
          }
        }
      }
    }
    return submissions;
  }, [task, resolvedFormKey]);

  const { previewFileId, previewFileName: resolvedPreviewFileName } = useMemo(() => {
    if (resolvedFormKey === TaskFormKeyEnum.PptCollabReview) {
      // 审核节点：找到当前室主任负责的部门中，状态为 submitted 的员工提交文件
      const depts = task?.meetingMaterialWorkflow?.deptAssignments || [];
      const myReviewDept = depts.find((d) => d.headUserId === currentUser.id) || depts[0];
      if (myReviewDept) {
        const submittedUa = myReviewDept.userAssignments.find(
          (ua) => ua.status === "submitted" && ua.submissions.length > 0
        );
        if (submittedUa) {
          const latestSub = submittedUa.submissions[submittedUa.submissions.length - 1];
          if (latestSub?.fileId) {
            return {
              previewFileId: latestSub.fileId,
              previewFileName: latestSub.fileName || `${submittedUa.userName}的提交`,
            };
          }
        }
      }
    }

    if (resolvedFormKey === TaskFormKeyEnum.PptCollabMerge && mergeSubmissions.length > 0) {
      // 合并节点：展示当前选中的员工提交文件
      const idx = Math.min(mergePreviewIndex, mergeSubmissions.length - 1);
      const selected = mergeSubmissions[idx];
      return {
        previewFileId: selected.fileId,
        previewFileName: `${selected.userName} · 第${selected.pages.join(",")}页`,
      };
    }

    // 默认：展示模板文件
    return {
      previewFileId: task?.templateFileId || task?.meetingMaterialWorkflow?.templateFileId || templateFileId,
      previewFileName: task?.templateFileName || templateFile?.name,
    };
  }, [task, currentUser.id, resolvedFormKey, templateFileId, templateFile, mergePreviewIndex, mergeSubmissions]);

  const previewFileName = resolvedPreviewFileName;
  const previewPageCount = task?.templatePageCount || templatePageCount;

  // dept_assign 节点：任务还没绑定模板，需要让用户在这里上传
  const showUploadEntry =
    resolvedFormKey === TaskFormKeyEnum.PptCollabDeptAssign && !task?.templateFileId && !templateFileId;

  // 室主任分配员工时，只看自己部门负责的页码
  // 员工提交时，只看自己被分配的页码
  const visiblePages = useMemo(() => {
    if (resolvedFormKey === TaskFormKeyEnum.PptCollabAssign) {
      const myDept = task?.meetingMaterialWorkflow?.deptAssignments.find(
        (d) => d.headUserId === currentUser.id
      );
      return myDept ? new Set(myDept.pages) : undefined;
    }

    if (resolvedFormKey === TaskFormKeyEnum.PptCollabSubmit) {
      // 从所有部门的 userAssignments 中找到当前用户被分配的页码
      const depts = task?.meetingMaterialWorkflow?.deptAssignments || [];
      for (const dept of depts) {
        const myUa = dept.userAssignments.find(
          (ua) => ua.userId === currentUser.id
        );
        if (myUa) {
          return new Set(myUa.pages);
        }
      }
      return undefined;
    }

    return undefined;
  }, [task, currentUser.id, resolvedFormKey]);

  const myDept = task?.meetingMaterialWorkflow?.deptAssignments.find(
    (d) => d.headUserId === currentUser.id
  );

  const stageConfig = task?.meetingMaterialWorkflow
    ? MEETING_MATERIAL_STAGE_CONFIG[task.meetingMaterialWorkflow.stage]
    : undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTemplateFile(file);
    setIsUploading(true);

    try {
      const uploaded = await uploadFileApi({
        file,
        category: "template",
      });
      setTemplateFileId(uploaded.fileId);
      setTemplatePageCount(uploaded.pageCount ?? 0);
      toast({
        title: "模板上传成功",
        description: uploaded.pageCount
          ? `已识别共 ${uploaded.pageCount} 页`
          : "模板已上传",
      });
    } catch (error) {
      setTemplateFile(null);
      setTemplateFileId("");
      setTemplatePageCount(0);
      toast({
        title: "模板上传失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSuccess = () => {
    toast({ title: `${nodeLabel || "任务"}提交成功` });
    navigate("/tasks", { state: { refresh: true } });
  };

  /**
   * 动态表单提交处理
   * formData 模式下，用户填写的数据通过 complete 接口提交
   */
  const handleDynamicFormSubmit = async (formValues: Record<string, unknown>) => {
    if (!taskId) return;

    try {
      await completePptAction(taskId, {
        action: "submit",
        payload: formValues,
      });
      toast({ title: "提交成功" });
      navigate("/tasks", { state: { refresh: true } });
    } catch (error) {
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  // —— 渲染 ——

  // 1) 加载中
  if (detailLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">任务加载中...</p>
        </div>
      </div>
    );
  }

  // 2) 任务不存在
  if (!task) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">任务不存在或已被删除</h2>
          <Button onClick={() => navigate("/tasks")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回任务列表
          </Button>
        </div>
      </div>
    );
  }

  // 3) formKey 有值 → 加载预制组件
  if (hasFormKey && FormComponent) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header
          task={task}
          nodeLabel={nodeLabel}
          stageText={stageConfig?.text}
          stageClass={stageConfig?.className}
          myDeptInfo={
            resolvedFormKey === TaskFormKeyEnum.PptCollabAssign && myDept
              ? `${myDept.department} · 负责第 ${formatPageRange(myDept.pages)} 页`
              : undefined
          }
          onBack={() => navigate("/tasks")}
        />

        <div className="flex-1 overflow-hidden">
          {needsPreview ? (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* 左：PPT 预览 */}
              <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
                <div className="h-full flex flex-col border-r border-border bg-muted/20">
                  <div className="shrink-0 px-4 py-3 border-b border-border bg-card/50 flex items-center justify-between">
                    <span className="text-sm font-medium">PPT 预览</span>
                    <div className="flex items-center gap-2">
                      {previewFileName && (
                        <span className="text-xs text-muted-foreground">
                          {previewFileName}
                          {previewPageCount ? ` · ${previewPageCount}页` : ""}
                        </span>
                      )}
                      {resolvedFormKey === TaskFormKeyEnum.PptCollabDeptAssign && (
                        <>
                          <input
                            type="file"
                            id="task-detail-template"
                            className="hidden"
                            accept=".ppt,.pptx"
                            onChange={handleFileChange}
                            disabled={isUploading}
                          />
                          <label htmlFor="task-detail-template">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs cursor-pointer"
                              asChild
                              disabled={isUploading}
                            >
                              <span>
                                {isUploading ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Upload className="h-3 w-3 mr-1" />
                                )}
                                {previewFileId ? "更换模板" : "上传模板"}
                              </span>
                            </Button>
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 合并节点：员工提交文件切换标签 */}
                  {resolvedFormKey === TaskFormKeyEnum.PptCollabMerge && mergeSubmissions.length > 0 && (
                    <div className="shrink-0 px-3 py-2.5 border-b border-border/60 bg-gradient-to-b from-card/80 to-card/40">
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {mergeSubmissions.map((sub, idx) => (
                          <button
                            key={sub.fileId}
                            type="button"
                            onClick={() => setMergePreviewIndex(idx)}
                            className={cn(
                              "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                              idx === mergePreviewIndex
                                ? "bg-primary/10 text-primary ring-1 ring-primary/30 shadow-sm"
                                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                            )}
                          >
                            <span className={cn(
                              "inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0",
                              idx === mergePreviewIndex
                                ? "bg-primary text-white"
                                : "bg-muted-foreground/20 text-muted-foreground"
                            )}>
                              {sub.userName.charAt(0)}
                            </span>
                            <span>{sub.userName}</span>
                            <span className="text-[10px] opacity-70">P{sub.pages[0]}-{sub.pages[sub.pages.length - 1]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-auto">
                    {previewFileId ? (
                      <PdfSlideViewer
                        fileId={previewFileId}
                        fileName={previewFileName}
                        pageCount={previewPageCount}
                        height="100%"
                        layout="top-bottom"
                        className="h-full"
                        visiblePages={visiblePages}
                        hideHeader
                      />
                    ) : showUploadEntry ? (
                      <div className="h-full flex items-center justify-center p-8">
                        <label
                          htmlFor="task-detail-template"
                          className={cn(
                            "flex flex-col items-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors",
                            "border-border hover:border-primary/50 bg-card/50 hover:bg-primary/5",
                            isUploading && "cursor-not-allowed opacity-60"
                          )}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-12 w-12 text-primary animate-spin" />
                              <span className="text-sm text-muted-foreground">上传中...</span>
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="h-12 w-12 text-muted-foreground/60" />
                              <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                  上传 PPT 模板文件
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  上传后可预览内容，方便按页分配部门
                                </p>
                              </div>
                            </>
                          )}
                        </label>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center p-8">
                        <p className="text-sm text-muted-foreground">暂无模板文件可预览</p>
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* 右：节点表单 */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full overflow-auto p-6">
                  {!canOperate && (
                    <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                      当前任务由其他人负责，您只能查看，无法操作。
                    </div>
                  )}
                  <FormComponent
                    task={task}
                    totalPages={previewPageCount}
                    templateFileId={previewFileId}
                    onSuccess={handleSuccess}
                    readOnly={!canOperate}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="h-full overflow-auto p-6 max-w-4xl mx-auto w-full">
              {!canOperate && (
                <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                  当前任务由其他人负责，您只能查看，无法操作。
                </div>
              )}
              <FormComponent task={task} onSuccess={handleSuccess} readOnly={!canOperate} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4) formData 有值 → 动态渲染字段
  if (hasFormData) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header
          task={task}
          nodeLabel="填写表单"
          stageText={stageConfig?.text}
          stageClass={stageConfig?.className}
          onBack={() => navigate("/tasks")}
        />
        <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full">
          <DynamicForm
            fields={resolvedFormData}
            onSubmit={handleDynamicFormSubmit}
            onCancel={() => navigate("/tasks")}
          />
        </div>
      </div>
    );
  }

  // 5) formKey 有值但没有匹配的预制组件
  if (hasFormKey && !FormComponent) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header
          task={task}
          nodeLabel={nodeLabel || "未知节点"}
          stageText={stageConfig?.text}
          stageClass={stageConfig?.className}
          onBack={() => navigate("/tasks")}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              当前节点（{resolvedFormKey}）暂未提供操作页面
            </p>
            <p className="text-xs text-muted-foreground">
              你可以从任务列表查看任务详情或等待流程推进
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 6) 两者都为空 → 当前用户无需操作
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        task={task}
        nodeLabel="任务详情"
        stageText={stageConfig?.text}
        stageClass={stageConfig?.className}
        onBack={() => navigate("/tasks")}
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">当前用户无需操作</p>
          <p className="text-xs text-muted-foreground">
            该任务当前没有需要你处理的节点，请等待流程推进
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- 顶部头 ----
function Header({
  task,
  nodeLabel,
  stageText,
  stageClass,
  myDeptInfo,
  onBack,
}: {
  task: { title: string };
  nodeLabel: string;
  stageText?: string;
  stageClass?: string;
  myDeptInfo?: string;
  onBack: () => void;
}) {
  return (
    <header className="shrink-0 border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate">{task.title}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {nodeLabel}
            {myDeptInfo && (
              <span className="ml-2 text-primary font-medium">· {myDeptInfo}</span>
            )}
          </p>
        </div>
      </div>
      {stageText && (
        <Badge
          variant="secondary"
          className={cn("text-xs font-semibold", stageClass)}
        >
          {stageText}
        </Badge>
      )}
    </header>
  );
}
