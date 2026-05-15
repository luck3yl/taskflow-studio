import { formatPageRange } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Clock,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskProcessDrawer } from "@/pages/task/components/drawers/TaskProcessDrawer";
import { useTaskContext, type Assignee, type Task } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { MeetingMaterialTaskDrawer } from "@/pages/task/meeting-materials/MeetingMaterialTaskDrawer";
import { getMyTodosApi, getTaskDetailApi } from "@/services/apis/tasks";
import { adaptBackendTask } from "@/services/task-adapters";

const statusStyles = {
  pending: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  submitted: "bg-info/10 text-info border-info/20",
  dept_approved: "bg-orange-50 text-orange-700 border-orange-200",
  final_approved: "bg-success/10 text-success border-success/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
} as const;

const statusLabels = {
  pending: "待处理",
  in_progress: "进行中",
  submitted: "待审核",
  dept_approved: "已通过",
  final_approved: "已通过",
  approved: "已通过",
  rejected: "已驳回",
} as const;

const statusFilters = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "in_progress", label: "进行中" },
  { value: "submitted", label: "待审核" },
  { value: "dept_approved", label: "已通过" },
  { value: "final_approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
];

type TodoMode = "execute" | "assign" | "review" | "merge";

type TodoAssignee = Assignee & {
  deptId?: string;
  isDeptHeadDistribution?: boolean;
  isCreatorMerge?: boolean;
  todoMode?: TodoMode;
};

type TodoItem = {
  task: Task;
  assignee: TodoAssignee;
};

type BackendTodoItem = {
  task?: Record<string, any>;
  assignee?: Record<string, any>;
  user_assignment?: Record<string, any>;
  dept_assignment?: Record<string, any>;
  userAssignment?: Record<string, any>;
  deptAssignment?: Record<string, any>;
  assignedBy?: Record<string, any>;
  assigned_by?: Record<string, any>;
};

export default function TodoCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [meetingMaterialDrawerOpen, setMeetingMaterialDrawerOpen] = useState(false);
  const [meetingMaterialTaskId, setMeetingMaterialTaskId] = useState<string>("");
  const [meetingMaterialTaskInitialDeptId, setMeetingMaterialTaskInitialDeptId] = useState<
    string | undefined
  >(undefined);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { submitWork, submitMeetingMaterialWork } = useTaskContext();
  const { currentUser } = useUserContext();

  const buildDeptHeadTodoAssignee = (task: Task, deptId: string): TodoAssignee | null => {
    const dept = task.meetingMaterialWorkflow?.deptAssignments.find(item => item.id === deptId);
    if (!dept || dept.headUserId !== currentUser.id) {
      return null;
    }

    const submittedAssignments = dept.userAssignments.filter(
      ua => ua.status === "submitted" && ua.submissions.length > 0
    );
    const canAssign = task.allowedActions?.includes("assign_pages") ?? false;
    const needsAssign = canAssign && dept.userAssignments.length === 0;
    const needsReview = submittedAssignments.length > 0;

    if (!needsAssign && !needsReview) {
      return null;
    }

    return {
      id: `dept-head-${dept.id}`,
      memberId: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      department: dept.department,
      taskDescription: needsReview
        ? `待审核 ${submittedAssignments.length} 份提交`
        : dept.requirement || `负责第 ${formatPageRange(dept.pages)} 页的人员分配`,
      pageRange: formatPageRange(dept.pages),
      status: needsReview ? "submitted" : "pending",
      submissions: [],
      isDeptHeadDistribution: true,
      todoMode: needsReview ? "review" : "assign",
      deptId: dept.id,
    };
  };

  const buildCreatorMergeTodoAssignee = (task: Task): TodoAssignee | null => {
    if (!task.meetingMaterialWorkflow || currentUser.name !== task.createdBy) {
      return null;
    }

    const allAssignments = task.meetingMaterialWorkflow.deptAssignments.flatMap(
      (dept) => dept.userAssignments
    );
    const reviewedCount = allAssignments.filter(
      (assignment) =>
        assignment.status === "dept_approved" || assignment.status === "final_approved"
    ).length;
    const readyToMerge =
      allAssignments.length > 0 &&
      reviewedCount === allAssignments.length &&
      task.meetingMaterialWorkflow.stage !== "merged";

    if (!readyToMerge) {
      return null;
    }

    return {
      id: `creator-merge-${task.id}`,
      memberId: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      department: task.department,
      taskDescription: "全部页面已审核通过，等待发起人发起最终合并",
      status: "dept_approved",
      submissions: [],
      isCreatorMerge: true,
      todoMode: "merge",
    };
  };

  const mapTodoRecordToItem = (
    record: BackendTodoItem,
    taskMap: Map<string, Task>
  ): TodoItem | null => {
    const taskId = String(record.task?.id || "");
    const task = taskMap.get(taskId);
    if (!task) {
      return null;
    }

    const userAssignment = record.user_assignment || record.userAssignment;
    const deptAssignment = record.dept_assignment || record.deptAssignment;
    const assignedBy = record.assignedBy || record.assigned_by;
    const rawTaskCreatedBy = String(record.task?.createdBy || "");
    const rawTaskCreatedByAvatar = String(record.task?.createdByAvatar || "");
    const hasRealTaskCreator =
      Boolean(task.createdBy?.trim()) && task.createdBy.trim() !== "系统";
    const hasTodoTaskCreator = Boolean(rawTaskCreatedBy.trim());
    const hasAssignedBy = Boolean(String(assignedBy?.name || "").trim());
    const displayCreatedBy = hasRealTaskCreator
      ? task.createdBy
      : hasTodoTaskCreator
        ? rawTaskCreatedBy
        : hasAssignedBy
          ? String(assignedBy?.name || "")
          : task.createdBy;
    const displayCreatedByAvatar =
      hasRealTaskCreator && task.createdByAvatar && task.createdByAvatar !== "?"
        ? task.createdByAvatar
        : rawTaskCreatedByAvatar
          ? rawTaskCreatedByAvatar
          : String(assignedBy?.avatar || displayCreatedBy.charAt(0) || "");
    const displayTask =
      displayCreatedBy !== task.createdBy || displayCreatedByAvatar !== task.createdByAvatar
        ? {
            ...task,
            createdBy: displayCreatedBy,
            createdByAvatar: displayCreatedByAvatar,
          }
        : task;
    const userAssignmentId = String(userAssignment?.id || "");
    if (userAssignmentId) {
      const assignee = task.assignees.find(
        item =>
          item.id === userAssignmentId ||
          item.memberId === userAssignment?.userId ||
          item.memberId === userAssignment?.user_id
      );

      if (!assignee) {
        return null;
      }

      return {
        task: displayTask,
        assignee: {
          ...assignee,
          todoMode: "execute",
        },
      };
    }

    const assigneeId = String(record.assignee?.id || "");
    if (assigneeId) {
      const assignee = task.assignees.find(
        item =>
          item.id === assigneeId ||
          item.memberId === record.assignee?.userId ||
          item.memberId === record.assignee?.memberId
      );

      if (!assignee) {
        return null;
      }

      return {
        task: displayTask,
        assignee: {
          ...assignee,
          todoMode: "execute",
        },
      };
    }

    const deptAssignmentId = String(deptAssignment?.id || "");
    if (deptAssignmentId) {
      const assignee = buildDeptHeadTodoAssignee(task, deptAssignmentId);
      if (!assignee) {
        return null;
      }

      return { task: displayTask, assignee };
    }

    return null;
  };

  const loadTodos = async () => {
    setLoading(true);

    try {
      const records = await getMyTodosApi({ userId: currentUser.id });
      const todoRecords = Array.isArray(records)
        ? (records as BackendTodoItem[])
        : Array.isArray((records as { data?: BackendTodoItem[] })?.data)
          ? ((records as { data: BackendTodoItem[] }).data)
          : [];
      const taskIds = [...new Set(todoRecords.map(item => String(item.task?.id || "")).filter(Boolean))];

      const detailResults = await Promise.allSettled(
        taskIds.map(taskId => getTaskDetailApi(taskId, currentUser.id))
      );

      const taskMap = new Map<string, Task>();
      detailResults.forEach(result => {
        if (result.status !== "fulfilled") {
          return;
        }

        const task = adaptBackendTask(result.value);
        if (task.id) {
          taskMap.set(task.id, task);
        }
      });

      const nextItems = todoRecords
        .map(record => mapTodoRecordToItem(record, taskMap))
        .filter((item): item is TodoItem => Boolean(item));

      taskMap.forEach((task) => {
        task.meetingMaterialWorkflow?.deptAssignments.forEach((dept) => {
          if (dept.headUserId !== currentUser.id) {
            return;
          }

          const deptTodo = buildDeptHeadTodoAssignee(task, dept.id);
          if (deptTodo) {
            nextItems.push({ task, assignee: deptTodo });
          }
        });

        const creatorMergeTodo = buildCreatorMergeTodoAssignee(task);
        if (creatorMergeTodo) {
          nextItems.push({ task, assignee: creatorMergeTodo });
        }
      });

      const uniqueItems = new Map<string, TodoItem>();
      nextItems.forEach(item => {
        uniqueItems.set(
          `${item.task.id}-${item.assignee.id}-${item.assignee.todoMode || "execute"}`,
          item
        );
      });

      setTodoItems([...uniqueItems.values()]);
    } catch (error) {
      console.error("Failed to load todos", error);
      setTodoItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTodos();
  }, [currentUser.id]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    return todoItems.filter(({ task, assignee }) => {
      const matchesSearch =
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.description?.toLowerCase().includes(normalizedSearch) ||
        task.createdBy.includes(searchQuery) ||
        assignee.taskDescription.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || assignee.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [todoItems, searchQuery, statusFilter]);

  const handleProcessTask = (task: Task, assignee: TodoAssignee) => {
    if (
      task.type === "例会资料" &&
      (assignee.isDeptHeadDistribution || assignee.isCreatorMerge)
    ) {
      setMeetingMaterialTaskId(task.id);
      setMeetingMaterialTaskInitialDeptId(
        assignee.todoMode === "assign" ? assignee.deptId : undefined
      );
      setMeetingMaterialDrawerOpen(true);
      return;
    }

    setSelectedItem({ task, assignee });
    setDrawerOpen(true);
  };

  const handleSubmit = async (file: File, note: string) => {
    if (!selectedItem) return;

    if (selectedItem.task.type === "例会资料" && selectedItem.task.meetingMaterialWorkflow) {
      let submitDeptId = "";
      let baseVersion = 0;

      selectedItem.task.meetingMaterialWorkflow.deptAssignments.forEach(da => {
        if (da.userAssignments.some(ua => ua.id === selectedItem.assignee.id)) {
          submitDeptId = da.id;
          da.userAssignments
            .find(ua => ua.id === selectedItem.assignee.id)
            ?.pages.forEach(page => {
              baseVersion = Math.max(
                baseVersion,
                selectedItem.task.meetingMaterialWorkflow?.pageVersions[page] || 0
              );
            });
        }
      });

      if (!submitDeptId) {
        throw new Error("未找到当前用户对应的部门分配信息");
      }

      const result = await submitMeetingMaterialWork(
        selectedItem.task.id,
        submitDeptId,
        selectedItem.assignee.id,
        {
          file,
          note,
          baseVersion,
        }
      );

      if (result.hasConflict) {
        throw new Error(result.conflictDescription || "页面版本冲突，请下载最新模板后重新编辑");
      }
    } else {
      await submitWork(selectedItem.task.id, selectedItem.assignee.id, {
        fileName: file.name,
        fileSize: file.size / (1024 * 1024),
        submittedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        note,
      });
    }

    setDrawerOpen(false);
    await loadTodos();
  };

  const getDeadlineInfo = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    return {
      hours,
      isUrgent: hours > 0 && hours < 24,
      isOverdue: hours <= 0,
    };
  };

  const getActionLabel = (assignee: TodoAssignee) => {
    if (assignee.isDeptHeadDistribution) {
      return assignee.todoMode === "review" ? "立即审核" : "立即分配";
    }
    if (assignee.isCreatorMerge) {
      return "立即合并";
    }

    return assignee.status === "pending" || assignee.status === "rejected"
      ? "立即处理"
      : "进度详情";
  };

  const getActionVariant = (assignee: TodoAssignee) =>
    assignee.status === "pending" ||
    assignee.status === "rejected" ||
    assignee.isDeptHeadDistribution ||
    assignee.isCreatorMerge
      ? "default"
      : "outline";

  return (
    <AppLayout title="待办中心">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              共有 <span className="text-primary font-medium">{filteredTasks.length}</span> 个待办任务
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索任务、发起人或要求"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground">待办加载中</h3>
            <p className="text-sm text-muted-foreground mt-1">正在同步当前用户的待办事项</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTasks.map(({ task, assignee }, index) => {
                const deadlineInfo = getDeadlineInfo(task.deadline);

                return (
                  <Card
                    key={`${task.id}-${assignee.id}-${assignee.todoMode || "execute"}`}
                    className="group relative overflow-hidden transition-all duration-200 border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 flex flex-col h-full bg-card"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3 shrink-0">
                        <Badge className={`${statusStyles[assignee.status]} border-none shadow-none text-xs font-bold h-6 px-2.5 rounded`}>
                          {statusLabels[assignee.status]}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{deadlineInfo.isOverdue ? "已超期" : "按时处理中"}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 mb-4">
                        <h3 className="font-bold text-lg leading-snug line-clamp-2">
                          {task.title}
                        </h3>
                        <p
                          className="text-sm text-muted-foreground/90 leading-relaxed line-clamp-2"
                          title={assignee.taskDescription}
                        >
                          要求: {assignee.taskDescription || task.description || "无具体要求"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        {assignee.pageRange && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-primary px-2 py-0.5 bg-primary/5 rounded border border-primary/10">
                            负责第 {assignee.pageRange} 页
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                        <div className="text-sm">
                          <span className="opacity-60">截止时间: </span>
                          <span className="font-medium text-foreground/70">
                            {(task.deadline || "").split(" ")[0] || task.deadline}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant={getActionVariant(assignee)}
                          className="h-8 px-4 text-xs font-bold rounded shadow-sm hover:-translate-y-0.5 transition-transform"
                          onClick={() => handleProcessTask(task, assignee)}
                        >
                          {getActionLabel(assignee)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground">暂无任务</h3>
                <p className="text-sm text-muted-foreground mt-1">当前筛选条件下没有找到待办任务</p>
              </div>
            )}
          </>
        )}
      </div>

      <TaskProcessDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        task={selectedItem?.task}
        assignee={selectedItem?.assignee}
        onSubmit={handleSubmit}
      />

      <MeetingMaterialTaskDrawer
        open={meetingMaterialDrawerOpen}
        onOpenChange={(open) => {
          setMeetingMaterialDrawerOpen(open);
          if (!open) {
            setMeetingMaterialTaskInitialDeptId(undefined);
            void loadTodos();
          }
        }}
        initialAssignDeptId={meetingMaterialTaskInitialDeptId}
        taskId={meetingMaterialTaskId}
      />
    </AppLayout>
  );
}
