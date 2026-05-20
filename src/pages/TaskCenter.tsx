import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
  Trash2,
  MoreHorizontal,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  useTaskContext,
  type ProcessInstanceDto,
  type FlowableTaskDto,
} from "@/contexts/TaskContext";
import { hasCapability, useUserContext } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { canOperateTask } from "@/utils/task-permissions";

// ─── formKey → 任务类型中文名 ────────────────────────────────
// 不再做前端映射，直接展示后端返回的 task.name

// ─── 从流程定义 ID 提取流程名称 ──────────────────────────────

function getProcessName(instance: ProcessInstanceDto): string {
  return instance.name || instance.processDefinitionName || "未命名流程";
}

function getProcessKey(instance: ProcessInstanceDto): string {
  // processDefinitionId 格式: "ppt_collab:13:c8eeefd3-..."
  return instance.processDefinitionId?.split(":")[0] || "";
}

// ─── category → processDefinitionKey 映射 ───────────────────

const CATEGORY_TO_PROCESS_KEY: Record<string, string> = {
  "例会资料": "ppt_collab",
  "设备管理月报编制": "ppt_collab",
  "设备管理月报（成本模块）": "ppt_collab",
  "设备例会材料（成本模块）": "ppt_collab",
  "维修费用使用情况例会材料": "ppt_collab",
  "调研反馈": "simple_submit",
  "例会反馈": "simple_submit",
  "督办事务": "supervision",
  "行动计划": "simple_submit",
  "培训交流": "simple_submit",
  "他山之石": "simple_submit",
  "标杆机组评价": "multi_level_review",
  "体系能力评价": "multi_level_review",
};

// ─── 组件 ────────────────────────────────────────────────────

export default function TaskCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedInstances, setExpandedInstances] = useState<Set<string>>(new Set());
  const [instanceTasks, setInstanceTasks] = useState<Record<string, FlowableTaskDto[]>>({});
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
  // 流程实例的业务变量缓存（title, department, deadline 等）
  const [instanceVars, setInstanceVars] = useState<Record<string, Record<string, unknown>>>({});

  const navigate = useNavigate();
  const location = useLocation();
  const { taskType: taskTypeParam } = useParams<{ taskType?: string }>();
  const activeCategory = taskTypeParam ? decodeURIComponent(taskTypeParam) : undefined;
  const {
    processInstances,
    refreshProcessInstances,
    getTasksByProcessInstance,
    deleteProcessInstance,
    getProcessVariables,
  } = useTaskContext();
  const { currentUser } = useUserContext();
  const canCreateTask = hasCapability(currentUser, "task.create");

  // 页面加载时拉取流程实例列表（按分类过滤）
  const processDefinitionKey = activeCategory ? CATEGORY_TO_PROCESS_KEY[activeCategory] : undefined;

  useEffect(() => {
    void refreshProcessInstances({ processDefinitionKey, category: activeCategory, keyword: searchQuery.trim() || undefined });
  }, [currentUser.id, processDefinitionKey, activeCategory]);

  // 搜索关键词变化时，防抖请求后端
  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshProcessInstances({ processDefinitionKey, category: activeCategory, keyword: searchQuery.trim() || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 从其他页面返回时刷新
  useEffect(() => {
    if ((location.state as any)?.refresh) {
      void refreshProcessInstances({ processDefinitionKey, category: activeCategory, keyword: searchQuery.trim() || undefined });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 加载流程实例的业务变量（title, department, deadline）
  useEffect(() => {
    if (processInstances.length === 0) return;

    const loadVars = async () => {
      // 用 Set 记录本轮已加载的 id，避免重复请求
      const loaded = new Set(Object.keys(instanceVars));
      const toLoad = processInstances.filter(inst => !loaded.has(inst.id));
      if (toLoad.length === 0) return;

      const results: Record<string, Record<string, unknown>> = {};
      await Promise.all(
        toLoad.map(async (inst) => {
          try {
            const vars = await getProcessVariables(inst.id);
            const varsMap: Record<string, unknown> = {};
            vars.forEach(v => { varsMap[v.name] = v.value; });
            results[inst.id] = varsMap;
          } catch {
            // ignore
          }
        })
      );

      if (Object.keys(results).length > 0) {
        setInstanceVars(prev => ({ ...prev, ...results }));
      }
    };

    void loadVars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processInstances.length]);

  // 搜索过滤已由后端完成，直接使用返回的列表
  const filteredInstances = processInstances;

  // 展开/收起流程实例
  const toggleExpand = (instanceId: string) => {
    setExpandedInstances(prev => {
      const next = new Set(prev);
      if (next.has(instanceId)) {
        next.delete(instanceId);
      } else {
        next.add(instanceId);
      }
      return next;
    });
  };

  // 展开时按需加载任务列表
  useEffect(() => {
    expandedInstances.forEach(instanceId => {
      if (!instanceTasks[instanceId] && !loadingTasks.has(instanceId)) {
        loadTasksForInstance(instanceId);
      }
    });
  }, [expandedInstances]);

  const loadTasksForInstance = async (instanceId: string) => {
    setLoadingTasks(prev => new Set(prev).add(instanceId));
    try {
      const tasks = await getTasksByProcessInstance(instanceId);
      setInstanceTasks(prev => ({ ...prev, [instanceId]: tasks }));
    } finally {
      setLoadingTasks(prev => {
        const next = new Set(prev);
        next.delete(instanceId);
        return next;
      });
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    await deleteProcessInstance(instanceId);
  };

  const handleTaskClick = (task: FlowableTaskDto) => {
    navigate(`/tasks/detail/${task.id}`);
  };

  return (
    <AppLayout title={activeCategory ? `任务中心 · ${activeCategory}` : "任务中心"}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            {canCreateTask && (
              <Button
                className="gradient-primary"
                onClick={() => navigate(activeCategory ? `/tasks/create/${encodeURIComponent(activeCategory)}` : "/tasks/create")}
              >
                <Plus className="h-4 w-4 mr-2" />
                创建流程
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索流程..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* 流程实例列表 */}
        {filteredInstances.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center space-y-3">
              <h3 className="text-lg font-semibold text-foreground">暂无流程</h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                {canCreateTask
                  ? '点击"创建流程"启动一个新的业务流程'
                  : "当前没有进行中的流程"}
              </p>
              {canCreateTask && (
                <Button className="mt-2 gradient-primary" onClick={() => navigate(activeCategory ? `/tasks/create/${encodeURIComponent(activeCategory)}` : "/tasks/create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建流程
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              共 <span className="font-semibold text-foreground">{filteredInstances.length}</span> 个进行中的流程，展开可查看任务列表
            </div>

            <div className="space-y-3">
              {filteredInstances.map((instance, index) => {
                const isExpanded = expandedInstances.has(instance.id);
                const tasks = instanceTasks[instance.id];
                const isLoadingTasks = loadingTasks.has(instance.id);
                const processName = getProcessName(instance);
                const processKey = getProcessKey(instance);
                const vars = instanceVars[instance.id] || {};
                const instanceTitle = (vars.title as string) || processName;
                const instanceDepartment = (vars.department as string) || "";
                const instanceDeadline = (vars.deadline as string) || "";

                return (
                  <Collapsible
                    key={instance.id}
                    open={isExpanded}
                    onOpenChange={() => toggleExpand(instance.id)}
                  >
                    <Card
                      className="shadow-card animate-slide-up overflow-hidden"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* 第一层：流程实例 */}
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                              <div className="space-y-1.5 min-w-0">
                                <CardTitle className="text-base truncate">{instanceTitle}</CardTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">
                                    {instance.processDefinitionName || processKey}
                                  </Badge>
                                  {instanceDepartment && (
                                    <Badge variant="outline" className="text-xs">
                                      {instanceDepartment}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
                                    进行中
                                  </Badge>
                                  {instanceDeadline && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      截止: {instanceDeadline}
                                    </span>
                                  )}
                                  {!instanceDeadline && instance.startTime && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(instance.startTime).toLocaleDateString()}
                                    </span>
                                  )}
                                  {tasks && (
                                    <span className="text-xs text-muted-foreground">
                                      {tasks.length} 个待处理任务
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteInstance(instance.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  终止流程
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      {/* 第二层：任务列表 */}
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4">
                          <div className="border-t border-border pt-4">
                            {isLoadingTasks ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">加载任务列表...</span>
                              </div>
                            ) : tasks && tasks.length > 0 ? (
                              <div className="space-y-2">
                                {tasks.map((task) => {
                                  const canOperate = canOperateTask(task, currentUser.id);
                                  return (
                                  <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">{task.name}</p>
                                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        {task.description && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            {task.description}
                                          </p>
                                        )}
                                        {task.deadline && (
                                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            截止: {task.deadline}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      {task.assignee && (
                                        <span className="text-xs text-muted-foreground hidden sm:block">
                                          负责人: {task.assignee}
                                        </span>
                                      )}
                                      <Button
                                        size="sm"
                                        variant={canOperate ? "default" : "outline"}
                                        className={cn("h-8 px-3 text-xs", !canOperate && "text-muted-foreground")}
                                        onClick={() => handleTaskClick(task)}
                                      >
                                        {canOperate ? "处理" : "查看"}
                                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                      </Button>
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <p className="text-sm text-muted-foreground">该流程当前没有待处理的任务</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
