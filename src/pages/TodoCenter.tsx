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
import { useNavigate } from "react-router-dom";
import { TaskProcessDrawer } from "@/pages/task/components/drawers/TaskProcessDrawer";
import { useTaskContext, type Assignee, type Task } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { getMyTodosApi } from "@/services/apis/tasks";

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
  todoType?: string;
  todoLabel?: string;
};

export default function TodoCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { submitWork, submitMeetingMaterialWork } = useTaskContext();
  const { currentUser } = useUserContext();
  const navigate = useNavigate();

  const loadTodos = async () => {
    setLoading(true);

    try {
      const records = await getMyTodosApi();
      const todoRecords = Array.isArray(records)
        ? (records as BackendTodoItem[])
        : Array.isArray((records as { data?: BackendTodoItem[] })?.data)
          ? ((records as { data: BackendTodoItem[] }).data)
          : [];

      // 直接从 my-todos 响应构建待办列表，不再逐个调用 getTaskDetailApi
      const nextItems: TodoItem[] = [];

      for (const record of todoRecords) {
        const rawTask = record.task;
        if (!rawTask?.id) continue;

        const userAssignment = record.user_assignment || record.userAssignment;
        const deptAssignment = record.dept_assignment || record.deptAssignment;
        const assignedBy = record.assignedBy || record.assigned_by;

        // 从 my-todos 响应构建轻量 Task 对象（足够列表渲染和跳转）
        const task: Task = {
          id: String(rawTask.id),
          title: String(rawTask.title || ""),
          description: "",
          type: "例会资料" as any,
          department: String(rawTask.department || ""),
          createdAt: "",
          deadline: String(rawTask.deadline || ""),
          createdBy: String(rawTask.createdBy || assignedBy?.name || ""),
          createdByAvatar: String(rawTask.createdByAvatar || assignedBy?.avatar || (rawTask.createdBy || "").charAt(0) || ""),
          totalAssignees: 0,
          completedCount: 0,
          status: "active",
          assignees: [],
          source: "remote" as any,
        };

        // 构建 assignee
        const todoLabel = String(record.todoLabel || record.todoType || "待处理");
        const uaStatus = String(userAssignment?.status || deptAssignment?.status || "pending");

        if (userAssignment?.id) {
          const assignee: TodoAssignee = {
            id: String(userAssignment.id),
            memberId: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            department: String(deptAssignment?.department || task.department),
            taskDescription: String(userAssignment.taskDescription || todoLabel),
            pageRange: userAssignment.pages ? formatPageRange(userAssignment.pages) : undefined,
            status: uaStatus as any,
            submissions: [],
            todoMode: "execute",
          };
          nextItems.push({ task, assignee });
        } else if (deptAssignment?.id) {
          const assignee: TodoAssignee = {
            id: `dept-head-${deptAssignment.id}`,
            memberId: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            department: String(deptAssignment.department || ""),
            taskDescription: todoLabel,
            status: uaStatus as any,
            submissions: [],
            isDeptHeadDistribution: true,
            todoMode: (record.todoType === "review" ? "review" : "assign") as TodoMode,
            deptId: String(deptAssignment.id),
          };
          nextItems.push({ task, assignee });
        } else {
          // 通用待办（如 merge）
          const assignee: TodoAssignee = {
            id: `todo-${rawTask.id}`,
            memberId: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            department: task.department,
            taskDescription: todoLabel,
            status: uaStatus as any,
            submissions: [],
            todoMode: "execute",
          };
          nextItems.push({ task, assignee });
        }
      }

      // 去重
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
    // 例会资料任务：统一跳到动态任务详情页，按 formKey 分发节点
    // 待办与任务中心使用同一个任务页（老板要求）
    if (task.type === "例会资料") {
      navigate(`/tasks/detail/${task.id}`);
      return;
    }

    // 其他类型保留原有抽屉提交流程
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
    </AppLayout>
  );
}
