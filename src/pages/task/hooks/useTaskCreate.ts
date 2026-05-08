import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTaskContext, Assignee, TaskType } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { format } from "date-fns";
import { parsePageInput } from "@/lib/ppt-calculator";

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
  const [currentStep, setCurrentStep] = useState(1);
  const { taskType: taskTypeParam } = useParams<{ taskType?: string }>();
  const [taskType, setTaskType] = useState(() => taskTypeParam ? decodeURIComponent(taskTypeParam) : "例会资料");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDepartment, setTaskDepartment] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePageCount, setTemplatePageCount] = useState<number>(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [meetingMaterialDeptRows, setMeetingMaterialDeptRows] = useState<MeetingMaterialDeptRow[]>([{ deptName: "", pageSelection: "", requirement: "", headUserId: "", headUserName: "", headUserAvatar: "" }]);
  const [meetingMaterialReviewerId, setMeetingMaterialReviewerId] = useState("");
  const [meetingMaterialApproverId, setMeetingMaterialApproverId] = useState("");
  const [deptHeadPickerIdx, setDeptHeadPickerIdx] = useState<number | null>(null);
  const [pagePickerRowIdx, setPagePickerRowIdx] = useState<number | null>(null);
  const [deptHeadSearch, setDeptHeadSearch] = useState("");
  const [reviewerPickerOpen, setReviewerPickerOpen] = useState<"reviewer" | "approver" | null>(null);
  const [rolePickerSearch, setRolePickerSearch] = useState("");
  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [deadlineTime, setDeadlineTime] = useState("18:00");
  const [reviewer, setReviewer] = useState("wang");
  const [memberSearch, setMemberSearch] = useState("");
  const [isAdvancedSelectOpen, setIsAdvancedSelectOpen] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addTask } = useTaskContext();

  const reviewerOptions = [
    { id: "wang", name: "王总", title: "总经理" },
    { id: "li", name: "李经理", title: "部门经理" },
    { id: "zhang", name: "张主管", title: "项目主管" },
    { id: "chen", name: "陈总监", title: "技术总监" },
  ];

  const filteredMembers = users.filter(m =>
    m.name.includes(memberSearch) ||
    m.department.includes(memberSearch) ||
    m.staffId.includes(memberSearch)
  );

  const getAssignedPages = () => {
    const assignedPages = new Set<number>();
    assignments.forEach(a => {
      if (a.startPage && a.endPage) {
        for (let i = a.startPage; i <= a.endPage; i++) {
          assignedPages.add(i);
        }
      }
    });
    return assignedPages;
  };

  const getRemainingPages = () => {
    if (!templatePageCount) return [];
    const assigned = getAssignedPages();
    const remaining: number[] = [];
    for (let i = 1; i <= templatePageCount; i++) {
      if (!assigned.has(i)) remaining.push(i);
    }
    return remaining;
  };

  const handleNext = () => {
    if (currentStep === 1 && (!taskTitle || !taskDescription)) {
      toast({
        title: "请填写完整信息",
        description: "任务名称和描述为必填项",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 2 && taskType === "例会资料") {
      const valid = meetingMaterialDeptRows.some(r => r.deptName && r.headUserId && parsePageInput(r.pageSelection, templatePageCount).length > 0);
      if (!valid) {
        toast({
          title: "请完善部门分配",
          description: "至少需要完成一条：部门 + 负责人 + 页面范围",
          variant: "destructive",
        });
        return;
      }
    }
    if (currentStep === 2 && taskType !== "例会资料" && assignments.length === 0) {
      toast({
        title: "请添加执行人",
        description: "至少需要添加一名执行人",
        variant: "destructive",
      });
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddAssignment = (memberId: string) => {
    if (assignments.find(a => a.memberId === memberId)) return;
    setAssignments([...assignments, { memberId, requirement: "" }]);
  };

  const handleRemoveAssignment = (memberId: string) => {
    setAssignments(assignments.filter(a => a.memberId !== memberId));
  };

  const toggleMemberSelection = (memberId: string) => {
    if (assignments.some(a => a.memberId === memberId)) {
      handleRemoveAssignment(memberId);
    } else {
      handleAddAssignment(memberId);
    }
  };

  const handleUpdateAssignment = (memberId: string, updates: Partial<Assignment>) => {
    setAssignments(assignments.map(a =>
      a.memberId === memberId ? { ...a, ...updates } : a
    ));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTemplateFile(file);
    const pageCount = 10;
    setTemplatePageCount(pageCount);

    toast({
      title: "模板上传成功",
      description: `已识别到模板共 ${pageCount} 页`,
    });
  };

  const handlePublish = () => {
    if (taskType === "例会资料") {
      const deptAssignments = meetingMaterialDeptRows
        .filter(r => r.deptName && parsePageInput(r.pageSelection, templatePageCount).length > 0)
        .map((r, i) => {
          const pages = parsePageInput(r.pageSelection, templatePageCount);
          return {
            id: `dept-new-${i}`,
            department: r.deptName,
            requirement: r.requirement || undefined,
            pages,
            headUserId: r.headUserId || undefined,
            headUserName: r.headUserName || undefined,
            status: "pending" as const,
            userAssignments: [],
          };
        });
      const reviewerUser = users.find(u => u.id === meetingMaterialReviewerId);
      const approverUser = users.find(u => u.id === meetingMaterialApproverId);
      const formattedDeadline = deadlineDate
        ? `${format(deadlineDate, "yyyy-MM-dd")} ${deadlineTime}`
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');
      const newId = addTask({
        title: taskTitle,
        description: taskDescription,
        type: "例会资料" as TaskType,
        department: taskDepartment,
        deadline: formattedDeadline,
        createdBy: currentUser.name,
        createdByAvatar: currentUser.avatar,
        templateFileName: templateFile?.name,
        templateFileSize: templateFile ? templateFile.size / (1024 * 1024) : undefined,
        templatePageCount: templatePageCount || 10,
        totalAssignees: deptAssignments.length,
        assignees: [],
        meetingMaterialWorkflow: {
          stage: "dept_assignment",
          totalPages: templatePageCount || 10,
          deptAssignments,
          pageVersions: {},
          reviewerId: reviewerUser?.id,
          reviewerName: reviewerUser?.name,
          approverId: approverUser?.id,
          approverName: approverUser?.name,
        },
      });
      toast({ title: "例会资料任务已创建", description: `已分配 ${deptAssignments.length} 个部门。` });
      navigate(taskType ? `/tasks/${encodeURIComponent(taskType)}` : '/tasks');
      return;
    }

    const assignees: Omit<Assignee, "id">[] = assignments.map((a, index) => {
      const member = getMemberById(a.memberId);
      const pageRangeStr = a.startPage && a.endPage ? `${a.startPage}-${a.endPage}` : undefined;
      const pageDesc = pageRangeStr ? `负责第${pageRangeStr}页：` : "";

      return {
        memberId: a.memberId,
        name: member?.name || "",
        avatar: member?.avatar || "",
        department: member?.department || "",
        taskDescription: `${pageDesc}${a.requirement}`,
        pageRange: pageRangeStr,
        status: "pending" as const,
        submissions: [],
      };
    });

    const selectedReviewerData = reviewerOptions.find(r => r.id === reviewer);
    const publisherName = selectedReviewerData?.name || "未知发布人";
    const publisherAvatar = publisherName.charAt(0);

    const formattedDeadline = deadlineDate
      ? `${format(deadlineDate, "yyyy-MM-dd")} ${deadlineTime}`
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');

    const newId = addTask({
      title: taskTitle,
      description: taskDescription,
      type: taskType as TaskType,
      department: taskDepartment,
      deadline: formattedDeadline,
      createdBy: publisherName,
      createdByAvatar: publisherAvatar,
      templateFileName: templateFile?.name,
      templateFileSize: templateFile ? templateFile.size / (1024 * 1024) : undefined,
      templatePageCount: templatePageCount || undefined,
      totalAssignees: assignments.length,
      assignees: assignees.map((a, i) => ({ ...a, id: `new-${Date.now()}-${i}` })),
    });

    toast({
      title: "任务已下发",
      description: `任务已成功分发给 ${assignments.length} 名执行人`,
    });
    navigate(taskType ? `/tasks/${encodeURIComponent(taskType)}` : "/tasks");
  };

  const getMemberById = (id: string) => users.find(m => m.id === id);

  const setDeptRowPageSelection = (rowIndex: number, pageSelection: string) => {
    setMeetingMaterialDeptRows(prev => prev.map((row, idx) => (
      idx === rowIndex ? { ...row, pageSelection } : row
    )));
  };

  const activePagePickerIdx = pagePickerRowIdx !== null
    ? Math.min(pagePickerRowIdx, Math.max(meetingMaterialDeptRows.length - 1, 0))
    : (meetingMaterialDeptRows.length > 0 ? 0 : null);
  const activePagePickerRow = activePagePickerIdx !== null ? meetingMaterialDeptRows[activePagePickerIdx] : undefined;
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
  const uncoveredPages = Array.from({ length: templatePageCount }, (_, index) => index + 1)
    .filter(page => !pageAssignmentCounts.has(page));
  const activePagesAssignedElsewhere = new Set<number>();

  if (activePagePickerIdx !== null) {
    meetingMaterialDeptRows.forEach((row, idx) => {
      if (idx === activePagePickerIdx) return;
      parsePageInput(row.pageSelection, templatePageCount).forEach(page => {
        activePagesAssignedElsewhere.add(page);
      });
    });
  }

  const activeOverlapPages = activePagePickerSelection.filter(page => activePagesAssignedElsewhere.has(page));
  const activeUnassignedPages = Array.from({ length: templatePageCount }, (_, index) => index + 1)
    .filter(page => !activePagesAssignedElsewhere.has(page));

  const remainingPages = getRemainingPages();

  return {
    users, departments, currentUser,
    currentStep, setCurrentStep,
    taskType, setTaskType,
    taskTitle, setTaskTitle,
    taskDescription, setTaskDescription,
    taskDepartment, setTaskDepartment,
    templateFile, setTemplateFile,
    templatePageCount, setTemplatePageCount,
    assignments, setAssignments,
    meetingMaterialDeptRows, setMeetingMaterialDeptRows,
    meetingMaterialReviewerId, setMeetingMaterialReviewerId,
    meetingMaterialApproverId, setMeetingMaterialApproverId,
    deptHeadPickerIdx, setDeptHeadPickerIdx,
    pagePickerRowIdx, setPagePickerRowIdx,
    deptHeadSearch, setDeptHeadSearch,
    reviewerPickerOpen, setReviewerPickerOpen,
    rolePickerSearch, setRolePickerSearch,
    deadlineDate, setDeadlineDate,
    deadlineTime, setDeadlineTime,
    reviewer, setReviewer,
    memberSearch, setMemberSearch,
    isAdvancedSelectOpen, setIsAdvancedSelectOpen,
    expandedDepts, setExpandedDepts,
    navigate, toast, addTask,
    reviewerOptions, filteredMembers,
    getAssignedPages, getRemainingPages,
    handleNext, handleBack,
    handleAddAssignment, handleRemoveAssignment,
    toggleMemberSelection, handleUpdateAssignment,
    handleFileUpload, handlePublish,
    getMemberById, setDeptRowPageSelection,
    activePagePickerIdx, activePagePickerRow,
    activePagePickerSelection, pageAssignmentCounts,
    coveredPages, repeatedPages, uncoveredPages,
    activePagesAssignedElsewhere, activeOverlapPages,
    activeUnassignedPages, remainingPages
  };
}
