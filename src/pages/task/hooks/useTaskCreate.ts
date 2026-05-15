import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { parsePageInput } from "@/lib/ppt-calculator";
import { useToast } from "@/hooks/use-toast";
import { useTaskContext, type Assignee, type TaskType } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { uploadFileApi } from "@/services/apis/files";
import {
  TASK_TYPE_TO_FORM_KEY,
  TaskFormKeyEnum,
  TaskSourceEnum,
  TaskTypeEnum,
} from "@/enums/task";

export interface Assignment {
  memberId: string;
  requirement: string;
  startPage?: number;
  endPage?: number;
}

export interface MeetingMaterialDeptRow {
  deptName: string;
  pageSelection: string;
  requirement: string;
  headUserId: string;
  headUserName: string;
  headUserAvatar: string;
}

export function useTaskCreate() {
  const { users, departments, currentUser } = useUserContext();
  const { taskType: taskTypeParam } = useParams<{ taskType?: string }>();
  const { addTask } = useTaskContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [taskType, setTaskType] = useState(
    () => (taskTypeParam ? decodeURIComponent(taskTypeParam) : TaskTypeEnum.MeetingMaterial)
  );
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDepartment, setTaskDepartment] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateFileId, setTemplateFileId] = useState("");
  const [templatePageCount, setTemplatePageCount] = useState(0);
  const [isTemplateUploading, setIsTemplateUploading] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [meetingMaterialDeptRows, setMeetingMaterialDeptRows] = useState<MeetingMaterialDeptRow[]>([
    {
      deptName: "",
      pageSelection: "",
      requirement: "",
      headUserId: "",
      headUserName: "",
      headUserAvatar: "",
    },
  ]);
  const [meetingMaterialReviewerId, setMeetingMaterialReviewerId] = useState("");
  const [meetingMaterialApproverId, setMeetingMaterialApproverId] = useState("");
  const [deptHeadPickerIdx, setDeptHeadPickerIdx] = useState<number | null>(null);
  const [pagePickerRowIdx, setPagePickerRowIdx] = useState<number | null>(null);
  const [deptHeadSearch, setDeptHeadSearch] = useState("");
  const [reviewerPickerOpen, setReviewerPickerOpen] = useState<"reviewer" | "approver" | null>(
    null
  );
  const [rolePickerSearch, setRolePickerSearch] = useState("");
  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [deadlineTime, setDeadlineTime] = useState("18:00");
  const [reviewer, setReviewer] = useState("wang");
  const [memberSearch, setMemberSearch] = useState("");
  const [isAdvancedSelectOpen, setIsAdvancedSelectOpen] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);

  const reviewerOptions = [
    { id: "wang", name: "王总", title: "总经理" },
    { id: "li", name: "李经理", title: "部门经理" },
    { id: "zhang", name: "张主管", title: "项目主管" },
    { id: "chen", name: "陈总监", title: "技术总监" },
  ];

  const filteredMembers = users.filter(
    member =>
      member.name.includes(memberSearch) ||
      member.department.includes(memberSearch) ||
      member.staffId.includes(memberSearch)
  );

  const getAssignedPages = () => {
    const assignedPages = new Set<number>();

    assignments.forEach(assignment => {
      if (!assignment.startPage || !assignment.endPage) {
        return;
      }

      for (let page = assignment.startPage; page <= assignment.endPage; page += 1) {
        assignedPages.add(page);
      }
    });

    return assignedPages;
  };

  const getRemainingPages = () => {
    if (!templatePageCount) return [];

    const assignedPages = getAssignedPages();
    const remainingPages: number[] = [];

    for (let page = 1; page <= templatePageCount; page += 1) {
      if (!assignedPages.has(page)) {
        remainingPages.push(page);
      }
    }

    return remainingPages;
  };

  const handleNext = () => {
    if (isTemplateUploading) {
      toast({
        title: "模板上传中",
        description: "请等待模板上传完成后再继续下一步",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 1 && (!taskTitle || !taskDescription)) {
      toast({
        title: "请填写完整信息",
        description: "任务名称和描述为必填项",
        variant: "destructive",
      });
      return;
    }

    // 例会资料任务：Step 1 → Step 3（跳过任务拆解，分配在工作台完成）
    if (currentStep === 1 && taskType === TaskTypeEnum.MeetingMaterial) {
      setCurrentStep(3);
      return;
    }

    if (currentStep === 2 && taskType !== TaskTypeEnum.MeetingMaterial && assignments.length === 0) {
      toast({
        title: "请添加执行人",
        description: "至少需要添加一名执行人",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(previous => previous + 1);
    }
  };

  const handleBack = () => {
    // 例会资料任务：Step 3 → Step 1（跳过任务拆解）
    if (currentStep === 3 && taskType === TaskTypeEnum.MeetingMaterial) {
      setCurrentStep(1);
      return;
    }

    if (currentStep > 1) {
      setCurrentStep(previous => previous - 1);
    }
  };

  const handleAddAssignment = (memberId: string) => {
    if (assignments.some(assignment => assignment.memberId === memberId)) {
      return;
    }

    setAssignments(previous => [...previous, { memberId, requirement: "" }]);
  };

  const handleRemoveAssignment = (memberId: string) => {
    setAssignments(previous => previous.filter(assignment => assignment.memberId !== memberId));
  };

  const toggleMemberSelection = (memberId: string) => {
    if (assignments.some(assignment => assignment.memberId === memberId)) {
      handleRemoveAssignment(memberId);
      return;
    }

    handleAddAssignment(memberId);
  };

  const handleUpdateAssignment = (memberId: string, updates: Partial<Assignment>) => {
    setAssignments(previous =>
      previous.map(assignment =>
        assignment.memberId === memberId ? { ...assignment, ...updates } : assignment
      )
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setTemplateFile(file);
    setIsTemplateUploading(true);

    try {
      const uploadedFile = await uploadFileApi({
        file,
        category: "template",
        metadata: {
          task_type: TASK_TYPE_TO_FORM_KEY[taskType as TaskTypeEnum] || TaskFormKeyEnum.SimpleSubmit,
        },
      });

      setTemplateFileId(uploadedFile.fileId);
      setTemplatePageCount(uploadedFile.pageCount || 0);

      toast({
        title: "模板上传成功",
        description:
          uploadedFile.pageCount && uploadedFile.pageCount > 0
            ? `已识别模板共 ${uploadedFile.pageCount} 页`
            : "模板已上传，可以继续配置任务",
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
      setIsTemplateUploading(false);
      event.target.value = "";
    }
  };

  const handlePublish = async () => {
    if (isTemplateUploading) {
      toast({
        title: "模板上传中",
        description: "请等待模板上传完成后再发布任务",
        variant: "destructive",
      });
      return;
    }

    const formattedDeadline = deadlineDate
      ? `${format(deadlineDate, "yyyy-MM-dd")} ${deadlineTime}`
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16)
          .replace("T", " ");

    try {
      if (taskType === TaskTypeEnum.MeetingMaterial) {
        await addTask({
          title: taskTitle,
          description: taskDescription,
          type: TaskTypeEnum.MeetingMaterial as TaskType,
          formKey: TaskFormKeyEnum.PptCollab,
          department: taskDepartment || currentUser.department || "全公司",
          deadline: formattedDeadline,
          createdBy: currentUser.name,
          createdByAvatar: currentUser.avatar,
          templateFileId: templateFileId || undefined,
          templateFileName: templateFile?.name,
          templateFileSize: templateFile ? templateFile.size / (1024 * 1024) : undefined,
          templatePageCount: templatePageCount || undefined,
          totalAssignees: 0,
          assignees: [],
          allowedActions: [],
          source: TaskSourceEnum.Remote,
        });

        toast({
          title: "例会资料任务已创建",
          description: "任务已创建，请进入工作台完成部门分配",
        });
        navigate(taskType ? `/tasks/${encodeURIComponent(taskType)}` : "/tasks");
        return;
      }

      const assignees: Omit<Assignee, "id">[] = assignments.map(assignment => {
        const member = getMemberById(assignment.memberId);
        const pageRange = assignment.startPage && assignment.endPage
          ? `${assignment.startPage}-${assignment.endPage}`
          : undefined;
        const pagePrefix = pageRange ? `负责第${pageRange}页：` : "";

        return {
          memberId: assignment.memberId,
          name: member?.name || "",
          avatar: member?.avatar || "",
          department: member?.department || "",
          taskDescription: `${pagePrefix}${assignment.requirement}`,
          pageRange,
          status: "pending" as const,
          submissions: [],
        };
      });

      const selectedReviewer = reviewerOptions.find(option => option.id === reviewer);
      const publisherName = selectedReviewer?.name || currentUser.name;

      await addTask({
        title: taskTitle,
        description: taskDescription,
        type: taskType as TaskType,
        department: taskDepartment || currentUser.department,
        deadline: formattedDeadline,
        createdBy: publisherName,
        createdByAvatar: publisherName.charAt(0),
        templateFileName: templateFile?.name,
        templateFileSize: templateFile ? templateFile.size / (1024 * 1024) : undefined,
        templatePageCount: templatePageCount || undefined,
        totalAssignees: assignees.length,
        assignees: assignees.map((assignee, index) => ({
          ...assignee,
          id: `new-${Date.now()}-${index}`,
        })),
      });

      toast({
        title: "任务已下发",
        description: `任务已成功分发给 ${assignees.length} 名执行人`,
      });
      navigate(taskType ? `/tasks/${encodeURIComponent(taskType)}` : "/tasks");
    } catch (error) {
      toast({
        title: "任务创建失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const getMemberById = (id: string) => users.find(member => member.id === id);

  const setDeptRowPageSelection = (rowIndex: number, pageSelection: string) => {
    setMeetingMaterialDeptRows(previous =>
      previous.map((row, index) => (index === rowIndex ? { ...row, pageSelection } : row))
    );
  };

  const activePagePickerIdx =
    pagePickerRowIdx !== null
      ? Math.min(pagePickerRowIdx, Math.max(meetingMaterialDeptRows.length - 1, 0))
      : meetingMaterialDeptRows.length > 0
        ? 0
        : null;
  const activePagePickerRow =
    activePagePickerIdx !== null ? meetingMaterialDeptRows[activePagePickerIdx] : undefined;
  const activePagePickerSelection = activePagePickerRow
    ? parsePageInput(activePagePickerRow.pageSelection, templatePageCount)
    : [];
  const pageAssignmentCounts = new Map<number, number>();

  meetingMaterialDeptRows.forEach(row => {
    parsePageInput(row.pageSelection, templatePageCount).forEach(page => {
      pageAssignmentCounts.set(page, (pageAssignmentCounts.get(page) ?? 0) + 1);
    });
  });

  const coveredPages = Array.from(pageAssignmentCounts.keys()).sort((left, right) => left - right);
  const repeatedPages = coveredPages.filter(page => (pageAssignmentCounts.get(page) ?? 0) > 1);
  const uncoveredPages = Array.from({ length: templatePageCount }, (_, index) => index + 1).filter(
    page => !pageAssignmentCounts.has(page)
  );
  const activePagesAssignedElsewhere = new Set<number>();

  if (activePagePickerIdx !== null) {
    meetingMaterialDeptRows.forEach((row, index) => {
      if (index === activePagePickerIdx) return;

      parsePageInput(row.pageSelection, templatePageCount).forEach(page => {
        activePagesAssignedElsewhere.add(page);
      });
    });
  }

  const activeOverlapPages = activePagePickerSelection.filter(page =>
    activePagesAssignedElsewhere.has(page)
  );
  const activeUnassignedPages = Array.from({ length: templatePageCount }, (_, index) => index + 1).filter(
    page => !activePagesAssignedElsewhere.has(page)
  );
  const remainingPages = getRemainingPages();

  return {
    users,
    departments,
    currentUser,
    currentStep,
    setCurrentStep,
    taskType,
    setTaskType,
    taskTitle,
    setTaskTitle,
    taskDescription,
    setTaskDescription,
    taskDepartment,
    setTaskDepartment,
    templateFile,
    setTemplateFile,
    templateFileId,
    setTemplateFileId,
    templatePageCount,
    setTemplatePageCount,
    isTemplateUploading,
    setIsTemplateUploading,
    assignments,
    setAssignments,
    meetingMaterialDeptRows,
    setMeetingMaterialDeptRows,
    meetingMaterialReviewerId,
    setMeetingMaterialReviewerId,
    meetingMaterialApproverId,
    setMeetingMaterialApproverId,
    deptHeadPickerIdx,
    setDeptHeadPickerIdx,
    pagePickerRowIdx,
    setPagePickerRowIdx,
    deptHeadSearch,
    setDeptHeadSearch,
    reviewerPickerOpen,
    setReviewerPickerOpen,
    rolePickerSearch,
    setRolePickerSearch,
    deadlineDate,
    setDeadlineDate,
    deadlineTime,
    setDeadlineTime,
    reviewer,
    setReviewer,
    memberSearch,
    setMemberSearch,
    isAdvancedSelectOpen,
    setIsAdvancedSelectOpen,
    expandedDepts,
    setExpandedDepts,
    navigate,
    toast,
    addTask,
    reviewerOptions,
    filteredMembers,
    getAssignedPages,
    getRemainingPages,
    handleNext,
    handleBack,
    handleAddAssignment,
    handleRemoveAssignment,
    toggleMemberSelection,
    handleUpdateAssignment,
    handleFileUpload,
    handlePublish,
    getMemberById,
    setDeptRowPageSelection,
    activePagePickerIdx,
    activePagePickerRow,
    activePagePickerSelection,
    pageAssignmentCounts,
    coveredPages,
    repeatedPages,
    uncoveredPages,
    activePagesAssignedElsewhere,
    activeOverlapPages,
    activeUnassignedPages,
    remainingPages,
  };
}
