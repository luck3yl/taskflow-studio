import { formatPageRange } from "@/lib/utils";
﻿import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Clock,
  FileText,
  Download,
  Calendar,
  User,
  Filter,
  Edit,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskProcessDrawer } from "@/features/task/components/drawers/TaskProcessDrawer";
import { PptTaskDrawer } from "@/features/task/components/drawers/PptTaskDrawer";
import { useTaskContext, Task, Assignee } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";

const statusStyles = {
  pending: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  submitted: "bg-info/10 text-info border-info/20",
  dept_approved: "bg-orange-50 text-orange-700 border-orange-200",
  final_approved: "bg-success/10 text-success border-success/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels = {
  pending: "待处理",
  in_progress: "进行中",
  submitted: "已提交",
  dept_approved: "待部长审批",
  final_approved: "已审批通过",
  approved: "已通过",
  rejected: "已驳回",
};

const statusFilters = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "in_progress", label: "进行中" },
  { value: "submitted", label: "已提交" },
  { value: "dept_approved", label: "待部长审批" },
  { value: "final_approved", label: "已审批通过" },
  { value: "rejected", label: "已驳回" },
];



export default function TodoCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<{ task: Task; assignee: Assignee } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pptDrawerOpen, setPptDrawerOpen] = useState(false);
  const [pptTaskId, setPptTaskId] = useState<string>("");

  const { tasks, submitWork, submitPptWork } = useTaskContext();
  const { currentUser } = useUserContext();
  const navigate = useNavigate();

  // Get tasks assigned to current user
  const myTasks = tasks.flatMap(task => {
    // 处理普通任务的分配（在 task.assignees 中）
    const assignee = task.assignees?.find(a => a.memberId === currentUser.id || a.name === currentUser.name);
    if (assignee) {
      return [{ task, assignee }];
    }

    // 处理例会资料任务的分配（在 task.pptWorkflow 中）
    if (task.type === "例会资料" && task.pptWorkflow) {
      const myPptAssignments: { task: Task, assignee: Assignee & { isDeptHeadDistribution?: boolean } }[] = [];

      task.pptWorkflow.deptAssignments.forEach(deptAssignment => {
        deptAssignment.userAssignments.forEach(ua => {
          if (ua.userId === currentUser.id) {
            myPptAssignments.push({
              task,
              assignee: {
                ...ua,
                id: ua.id,
                memberId: ua.userId,
                name: currentUser.name,
                avatar: currentUser.avatar,
                department: currentUser.department,
                taskDescription: ua.taskDescription || deptAssignment.requirement || `负责第 ${formatPageRange(ua.pages)} 页`,
                pageRange: formatPageRange(ua.pages),
                status: ua.status as Assignee["status"],
                submissions: ua.submissions,
                isDeptHeadDistribution: false
              } as Assignee & { isDeptHeadDistribution?: boolean }
            });
          }
        });
      });

      if (myPptAssignments.length > 0) {
        return myPptAssignments;
      }
    }

    return [];
  });

  const filteredTasks = myTasks.filter(({ task, assignee }) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.createdBy.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || assignee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProcessTask = (task: Task, assignee: Assignee & { isDeptHeadDistribution?: boolean }) => {
    if (task.type === "例会资料" && assignee.isDeptHeadDistribution) {
      setPptTaskId(task.id);
      setPptDrawerOpen(true);
      return;
    }
    setSelectedItem({ task, assignee });
    setDrawerOpen(true);
  };

  const handleSubmit = (file: File, note: string) => {
    if (!selectedItem) return;

    if (selectedItem.task.type === "例会资料" && selectedItem.task.pptWorkflow) {
      // Find deptId
      let submitDeptId = "";
      let baseVersion = 0;
      selectedItem.task.pptWorkflow.deptAssignments.forEach(da => {
        if (da.userAssignments.some(ua => ua.id === selectedItem.assignee.id)) {
          submitDeptId = da.id;
          da.userAssignments.find(ua => ua.id === selectedItem.assignee.id)?.pages.forEach(p => {
             baseVersion = Math.max(baseVersion, selectedItem.task.pptWorkflow!.pageVersions[p] || 0);
          });
        }
      });

      if (submitDeptId) {
        submitPptWork(selectedItem.task.id, submitDeptId, selectedItem.assignee.id, {
          fileName: file.name,
          fileSize: Math.round(file.size / 1024 / 1024 * 10) / 10 || 0.1,
          note,
          baseVersion
        });
      }
    } else {
      submitWork(selectedItem.task.id, selectedItem.assignee.id, {
        fileName: file.name,
        fileSize: file.size / (1024 * 1024),
        submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        note,
      });
    }

    setDrawerOpen(false);
  };

  // Calculate deadline urgency
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

  return (
    <AppLayout title="待办中心">
      <div className="space-y-6">
        {/* Header */}
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
                placeholder="搜索任务或领导..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Task Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map(({ task, assignee }, index) => {
            const deadlineInfo = getDeadlineInfo(task.deadline);
            const latestSubmission = assignee.submissions[assignee.submissions.length - 1];

            return (
              <Card
                key={`${task.id}-${assignee.id}`}
                className="group relative overflow-hidden transition-all duration-200 border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 flex flex-col h-full bg-card"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5 flex-1 flex flex-col">
                  {/* Status Top Bar */}
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <Badge className={`${statusStyles[assignee.status]} border-none shadow-none text-xs font-bold h-6 px-2.5 rounded`}>
                      {statusLabels[assignee.status]}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{deadlineInfo.isOverdue ? '已逾期' : '按时处理中'}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2.5 mb-4">
                    <h3 className="font-bold text-lg leading-snug line-clamp-2">
                      {task.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/90 leading-relaxed line-clamp-2" title={assignee.taskDescription}>
                      要求: {assignee.taskDescription || task.description || "无具体要求"}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/20">
                        {task.createdByAvatar}
                      </div>
                      <span className="text-sm font-medium text-foreground/80">{task.createdBy}</span>
                    </div>

                    {assignee.pageRange && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary px-2 py-0.5 bg-primary/5 rounded border border-primary/10">
                        负责第 {assignee.pageRange} 页
                      </div>
                    )}
                  </div>

                  {/* Conditional Feedback */}
                  {/* {(assignee.status === "rejected" || assignee.status === "approved") && latestSubmission?.feedback && (
                    <div className={`mt-auto mb-4 p-3 rounded border-l-2 text-xs ${assignee.status === "rejected"
                      ? "bg-destructive/[0.03] border-destructive/20 text-destructive/90"
                      : "bg-success/[0.03] border-success/20 text-success/90"
                      }`}>
                      <span className="font-bold block text-xs uppercase tracking-wider opacity-70 mb-1">
                        {assignee.status === "rejected" ? "驳回意见" : "审批通过"}
                      </span>
                      <p className="italic leading-relaxed line-clamp-2">"{latestSubmission.feedback}"</p>
                    </div>
                  )} */}

                  {/* Action Footer */}
                  <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="opacity-60">截止时间: </span>
                      <span className="font-medium text-foreground/70">{task.deadline.split(' ')[0]}</span>
                    </div>

                    <Button
                      size="sm"
                      variant={assignee.status === "pending" || assignee.status === "rejected" ? "default" : "outline"}
                      className="h-8 px-4 text-xs font-bold rounded shadow-sm hover:-translate-y-0.5 transition-transform"
                      onClick={() => handleProcessTask(task, assignee)}
                    >
                      {assignee.status === "pending" || assignee.status === "rejected" ? "立即处理" : "进度详情"}
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
            <p className="text-sm text-muted-foreground mt-1">当前筛选条件下没有找到任务</p>
          </div>
        )}
      </div>

      {/* Task Process Drawer */}
      <TaskProcessDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        task={selectedItem?.task}
        assignee={selectedItem?.assignee}
        onSubmit={handleSubmit}
      />

      {/* PPT Task Drawer */}
      <PptTaskDrawer
        open={pptDrawerOpen}
        onOpenChange={setPptDrawerOpen}
        taskId={pptTaskId}
      />
    </AppLayout>
  );
}
