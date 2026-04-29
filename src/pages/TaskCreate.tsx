import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Plus,
  X,
  FileText,
  Users,
  Calendar as CalendarIcon,
  CheckCircle2,
  Rocket,
  FileSpreadsheet,
  AlertCircle,
  Search,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatPageRange } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTaskContext, Assignee } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";

const steps = [
  { id: 1, title: "基础定义", icon: FileText },
  { id: 2, title: "任务拆解", icon: Users },
  { id: 3, title: "时限配置", icon: CalendarIcon },
  { id: 4, title: "预览发布", icon: Rocket },
];

// Data is now fetched from UserContext

interface Assignment {
  memberId: string;
  requirement: string;
  startPage?: number;
  endPage?: number;
}

interface PptDeptRow {
  deptName: string;
  pageSelection: string;
  requirement: string;
  headUserId: string;
  headUserName: string;
  headUserAvatar: string;
}

const parsePageInput = (input: string, maxPages: number): number[] => {
  const pages = new Set<number>();
  const parts = input.split(/[,，]/);
  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    if (p.includes('-')) {
      const [start, end] = p.split('-');
      const s = parseInt(start);
      const e = parseInt(end);
      if (!isNaN(s) && !isNaN(e) && s <= e) {
        for (let i = s; i <= e; i++) {
          if (i >= 1 && (maxPages === 0 || i <= maxPages)) pages.add(i);
        }
      }
    } else {
      const n = parseInt(p);
      if (!isNaN(n) && n >= 1 && (maxPages === 0 || n <= maxPages)) pages.add(n);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
};

export default function TaskCreate() {
  const { users, departments, currentUser } = useUserContext();
  const [currentStep, setCurrentStep] = useState(1);
  const { taskType: taskTypeParam } = useParams<{ taskType?: string }>();
  const [taskType, setTaskType] = useState(() => taskTypeParam ? decodeURIComponent(taskTypeParam) : "例会资料");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDepartment, setTaskDepartment] = useState("全公司");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePageCount, setTemplatePageCount] = useState<number>(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pptDeptRows, setPptDeptRows] = useState<PptDeptRow[]>([{ deptName: "", pageSelection: "", requirement: "", headUserId: "", headUserName: "", headUserAvatar: "" }]);
  const [pptReviewerId, setPptReviewerId] = useState("");
  const [pptApproverId, setPptApproverId] = useState("");
  const [deptHeadPickerIdx, setDeptHeadPickerIdx] = useState<number | null>(null);
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

  // Calculate assigned and remaining pages
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
      const valid = pptDeptRows.some(r => r.deptName && r.headUserId && parsePageInput(r.pageSelection, templatePageCount).length > 0);
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

    // Hardcode PPT page count to 10 as per requirements
    const pageCount = 10;
    setTemplatePageCount(pageCount);

    toast({
      title: "模板上传成功",
      description: `已识别到 PPT 共 ${pageCount} 页`,
    });
  };

  const handlePublish = () => {
    if (taskType === "例会资料") {
      // Build pptWorkflow from dept rows
      const deptAssignments = pptDeptRows
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
      const reviewerUser = users.find(u => u.id === pptReviewerId);
      const approverUser = users.find(u => u.id === pptApproverId);
      const formattedDeadline = deadlineDate
        ? `${format(deadlineDate, "yyyy-MM-dd")} ${deadlineTime}`
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');
      const newId = addTask({
        title: taskTitle,
        description: taskDescription,
        type: "例会资料",
        department: taskDepartment,
        deadline: formattedDeadline,
        createdBy: currentUser.name,
        createdByAvatar: currentUser.avatar,
        templateFileName: templateFile?.name,
        templateFileSize: templateFile ? templateFile.size / (1024 * 1024) : undefined,
        templatePageCount: templatePageCount || 10,
        totalAssignees: deptAssignments.length,
        assignees: [],
        pptWorkflow: {
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
      toast({ title: "PPT任务已创建", description: `已分配 ${deptAssignments.length} 个部门。` });
      navigate(taskType ? `/tasks/${encodeURIComponent(taskType)}` : '/tasks');
      return;
    }

    // Create assignees from assignments
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
      type: taskType as import("@/contexts/TaskContext").TaskType,
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
    console.log("created task", newId);

    toast({
      title: "任务已下发",
      description: `任务已成功分发给 ${assignments.length} 名执行人`,
    });
    navigate(taskType ? `/tasks/${encodeURIComponent(taskType)}` : "/tasks");
  };

  const getMemberById = (id: string) => users.find(m => m.id === id);

  const remainingPages = getRemainingPages();

  return (
    <AppLayout title="创建任务">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all
                    ${isActive ? "border-primary bg-primary text-primary-foreground" : ""}
                    ${isCompleted ? "border-success bg-success text-success-foreground" : ""}
                    ${!isActive && !isCompleted ? "border-border bg-muted text-muted-foreground" : ""}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-12 sm:w-24 mx-2 ${isCompleted ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="shadow-card animate-fade-in">
          {/* Step 1: Basic Definition */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle>基础定义</CardTitle>
                <CardDescription>填写任务名称及描述并上传模板</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>任务名称 *</Label>
                  <Input
                    placeholder="输入任务名称"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>任务描述 *</Label>
                  <Textarea
                    placeholder="输入任务背景、目的及相关说明"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>模板文件（PPT类型推荐上传）</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="template-upload"
                      className="hidden"
                      accept=".ppt,.pptx,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="template-upload" className="cursor-pointer">
                      {templateFile ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <FileSpreadsheet className="h-10 w-10 text-primary" />
                            <div className="text-left">
                              <p className="font-medium text-foreground">{templateFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(templateFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          {templatePageCount > 0 && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              <FileText className="h-4 w-4" />
                              共 {templatePageCount} 页
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">点击上传模板文件</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            支持 .ppt, .pptx, .pdf, .doc, .docx 格式
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Task Breakdown */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle>任务拆解</CardTitle>
                <CardDescription>
                  {taskType === "例会资料"
                    ? "将PPT页面分配给各部门，部门负责人后续再分配给员工"
                    : "为每位执行人分配具体的工作包"}
                  {templatePageCount > 0 && (
                    <span className="ml-2 text-primary">
                      （PPT共 {templatePageCount} 页）
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PPT 部门分配 UI */}
                {taskType === "例会资料" ? (
                  <div className="space-y-4">
                    {/* Page coverage grid */}
                    {templatePageCount > 0 && (() => {
                      const covered = new Set<number>();
                      pptDeptRows.forEach(r => {
                        const pages = parsePageInput(r.pageSelection, templatePageCount);
                        pages.forEach(p => covered.add(p));
                      });
                      return (
                        <div className="rounded-lg border border-border p-4 bg-secondary/30">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium">页面分配状态</span>
                            <span className="text-xs text-muted-foreground">已覆盖 {covered.size} / {templatePageCount} 页</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: templatePageCount }).map((_, i) => {
                              const p = i + 1;
                              return (
                                <div key={p} className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${covered.has(p) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"}`}>{p}</div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Dept rows */}
                    <div className="space-y-3">
                      <Label>部门 & 负责人 & 页面分配</Label>
                      {pptDeptRows.map((row, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4 hover:border-primary/30 transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="grid grid-cols-[auto_1fr] gap-6 flex-1">
                              {/* 部门 & 负责人 */}
                              <div className="space-y-2 border-r border-border pr-6">
                                <label className="text-xs font-semibold text-muted-foreground">部门及负责人</label>
                                <div className="flex items-center gap-2">
                                  <Select value={row.deptName} onValueChange={(v) => setPptDeptRows(prev => prev.map((r, i) => i === idx ? { ...r, deptName: v, headUserId: "", headUserName: "", headUserAvatar: "" } : r))}>
                                    <SelectTrigger className="h-9 w-[130px] font-medium shrink-0">
                                      <SelectValue placeholder="选择部门" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {departments.map(d => (
                                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {row.headUserId ? (
                                    <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                                      onClick={() => { setDeptHeadPickerIdx(idx); setDeptHeadSearch(""); }}>
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs bg-primary text-white">{row.headUserAvatar}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-semibold text-primary">{row.headUserName}</span>
                                    </div>
                                  ) : (
                                    <Button variant="outline" size="sm" className="h-9 text-xs border-dashed shrink-0"
                                      onClick={() => { setDeptHeadPickerIdx(idx); setDeptHeadSearch(""); }}>
                                      <Plus className="h-3 w-3 mr-1" />
                                      委派负责人
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* 页面范围 */}
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold text-muted-foreground">分配页面</label>
                                  {parsePageInput(row.pageSelection, templatePageCount).length > 0 && (
                                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                      已选 {parsePageInput(row.pageSelection, templatePageCount).length} 页
                                    </span>
                                  )}
                                </div>
                                <Input
                                  type="text" placeholder="例如: 1-3, 5, 7"
                                  className="h-9 text-sm font-mono"
                                  value={row.pageSelection}
                                  onChange={(e) => setPptDeptRows(prev => prev.map((r, i) => i === idx ? { ...r, pageSelection: e.target.value } : r))}
                                />
                              </div>
                            </div>

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-6"
                              onClick={() => setPptDeptRows(prev => prev.filter((_, i) => i !== idx))}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* 任务要求 */}
                          <div className="bg-secondary/50 p-3 rounded-lg border border-border space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5" /> 本次分配说明 / 页面要求
                            </label>
                            <Input
                              placeholder="详细描述该部门需要在这几页PPT上补充的数据或内容说明..."
                              className="h-9 text-sm bg-background border-muted-foreground/20"
                              value={row.requirement}
                              onChange={(e) => setPptDeptRows(prev => prev.map((r, i) => i === idx ? { ...r, requirement: e.target.value } : r))}
                            />
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5"
                        onClick={() => setPptDeptRows(prev => [...prev, { deptName: "", pageSelection: "", requirement: "", headUserId: "", headUserName: "", headUserAvatar: "" }])}>
                        <Plus className="h-4 w-4 mr-2" />
                        添加部门
                      </Button>
                    </div>

                    {/* 负责人选择弹窗 */}
                    <Dialog open={deptHeadPickerIdx !== null} onOpenChange={(open) => !open && setDeptHeadPickerIdx(null)}>
                      <DialogContent className="sm:max-w-[600px] h-[520px] flex flex-col p-6 rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            选择部门负责人
                            {deptHeadPickerIdx !== null && pptDeptRows[deptHeadPickerIdx]?.deptName && (
                              <Badge variant="secondary" className="ml-2">{pptDeptRows[deptHeadPickerIdx].deptName}</Badge>
                            )}
                          </DialogTitle>
                          <DialogDescription>搜索并选择该部门的负责人，负责后续向员工分配任务</DialogDescription>
                        </DialogHeader>
                        <div className="relative mt-3 mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="搜索姓名、工号或职位..." className="pl-10 h-10 rounded-xl" value={deptHeadSearch} onChange={(e) => setDeptHeadSearch(e.target.value)} />
                        </div>
                        <ScrollArea className="flex-1 -mx-2 px-2">
                          <div className="space-y-4 pb-4">
                            {departments.map(dept => {
                              const selectedDeptName = deptHeadPickerIdx !== null ? pptDeptRows[deptHeadPickerIdx]?.deptName : "";
                              const deptMembers = users.filter(u =>
                                (!selectedDeptName || u.department === selectedDeptName) &&
                                (u.name.includes(deptHeadSearch) || u.staffId.includes(deptHeadSearch) || u.role.includes(deptHeadSearch))
                              );
                              if (!deptMembers.some(u => u.department === dept.name)) return null;
                              const show = deptMembers.filter(u => u.department === dept.name);
                              if (show.length === 0) return null;
                              return (
                                <div key={dept.id} className="space-y-2">
                                  <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-1 sticky top-0 bg-background/95 py-1">
                                    <Building2 className="h-4 w-4" />{dept.name}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {show.map(u => (
                                      <div key={u.id} onClick={() => {
                                        if (deptHeadPickerIdx !== null) {
                                          setPptDeptRows(prev => prev.map((r, i) => i === deptHeadPickerIdx ? { ...r, headUserId: u.id, headUserName: u.name, headUserAvatar: u.avatar } : r));
                                          setDeptHeadPickerIdx(null);
                                        }
                                      }} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-primary/5 hover:border-primary/30 cursor-pointer transition-all">
                                        <Avatar className="h-9 w-9 shrink-0">
                                          <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">{u.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="text-sm font-semibold truncate">{u.name}</p>
                                          <p className="text-xs text-muted-foreground truncate">{u.role} · {u.staffId}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <>{/* Page Status */}
                {templatePageCount > 0 && (
                  <div className="rounded-lg border border-border p-4 bg-secondary/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">页面分配状态</span>
                      <span className="text-xs text-muted-foreground">
                        已分配 {getAssignedPages().size} / {templatePageCount} 页
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: templatePageCount }).map((_, i) => {
                        const pageNum = i + 1;
                        const isAssigned = getAssignedPages().has(pageNum);
                        return (
                          <div
                            key={pageNum}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${isAssigned
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground border border-border"
                              }`}
                          >
                            {pageNum}
                          </div>
                        );
                      })}
                    </div>
                    {remainingPages.length > 0 && remainingPages.length < templatePageCount && (
                      <p className="text-xs text-warning mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        未分配页面：{formatPageRange(remainingPages)}
                      </p>
                    )}
                  </div>
                )}

                {/* Team Member Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>添加执行人</Label>
                    <div className="relative w-64 group">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary" />
                      <Input
                        placeholder="搜索姓名、工号或部门"
                        className="h-8 pl-8 text-xs rounded-lg"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 p-1 border border-border/30 rounded-lg bg-muted/20">
                    {filteredMembers.slice(0, 12).map((member) => {
                      const isSelected = assignments.some(a => a.memberId === member.id);
                      return (
                        <Button
                          key={member.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleMemberSelection(member.id)}
                          className={cn("h-8 px-3 text-xs", isSelected ? "gradient-primary border-primary/20" : "border-border/50 hover:bg-primary/5 hover:text-primary")}
                        >
                          {isSelected ? (
                            <X className="h-3 w-3 mr-1" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          {member.name}
                          <span className="ml-1 text-xs opacity-70">({member.department})</span>
                        </Button>
                      );
                    })}

                    <Dialog open={isAdvancedSelectOpen} onOpenChange={setIsAdvancedSelectOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:text-primary">
                          <Plus className="h-3 w-3 mr-1" />
                          更多人员...
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] h-[600px] flex flex-col p-6 rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            全量人员选择器
                          </DialogTitle>
                          <DialogDescription>
                            支持跨部门搜索与选择，已选中 {assignments.length} 位执行人。
                          </DialogDescription>
                        </DialogHeader>

                        <div className="relative mt-4 mb-4">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input
                             placeholder="搜索姓名、工号、部门或职位..."
                             className="pl-10 h-10 rounded-xl"
                             value={memberSearch}
                             onChange={(e) => setMemberSearch(e.target.value)}
                           />
                        </div>

                        <ScrollArea className="flex-1 -mx-2 px-2">
                           <div className="space-y-6 pb-4">
                             {departments.map(dept => {
                               const deptMembers = users.filter(u => u.department === dept.name && (
                                 u.name.includes(memberSearch) ||
                                 u.department.includes(memberSearch) ||
                                 u.staffId.includes(memberSearch) ||
                                 u.role.includes(memberSearch)
                               ));

                               if (deptMembers.length === 0) return null;

                               return (
                                 <div key={dept.id} className="space-y-3">
                                   <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10 border-b border-border/30">
                                      <h4 className="text-sm font-bold flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        {dept.name}
                                        <span className="text-xs font-normal text-muted-foreground">({deptMembers.length}人)</span>
                                      </h4>
                                   </div>
                                   <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                     {deptMembers.map(member => {
                                       const isSelected = assignments.some(a => a.memberId === member.id);
                                       return (
                                         <div
                                           key={member.id}
                                           onClick={() => toggleMemberSelection(member.id)}
                                           className={cn(
                                             "flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                                             isSelected
                                               ? "bg-primary/5 border-primary/30 shadow-sm ring-1 ring-primary/20"
                                               : "bg-muted/10 border-border/40 hover:bg-muted/30"
                                           )}
                                         >
                                            <Avatar className="h-8 w-8 shrink-0">
                                               <AvatarFallback className={cn("text-xs font-bold", isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
                                                 {member.avatar}
                                               </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                               <p className="text-sm font-bold truncate">{member.name}</p>
                                               <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                                            </div>
                                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                         </div>
                                       );
                                     })}
                                   </div>
                                 </div>
                               );
                             })}
                           </div>
                        </ScrollArea>

                        <DialogFooter className="mt-4 pt-4 border-t border-border/30">
                           <Button onClick={() => setIsAdvancedSelectOpen(false)} className="gradient-primary px-8 rounded-xl shadow-lg shadow-primary/20">
                             确定选择
                           </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {filteredMembers.length === 0 && (
                      <div className="w-full text-center py-4 text-xs text-muted-foreground">
                        未找到匹配的成员
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Assignment Details */}
                <div className="space-y-4">
                  <Label>工作包分配</Label>
                  {assignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p>请先添加执行人</p>
                    </div>
                  ) : (
                    assignments.map((assignment) => {
                      const member = getMemberById(assignment.memberId);
                      if (!member) return null;
                      return (
                        <div
                          key={assignment.memberId}
                          className="flex items-start gap-4 p-4 rounded-lg border border-border bg-secondary/30"
                        >
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.department}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveAssignment(member.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Page Range Selection */}
                            {templatePageCount > 0 && (
                              <div className="flex items-center gap-2">
                                <Label className="text-xs shrink-0">负责页面：</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={templatePageCount}
                                  placeholder="起始页"
                                  className="w-20 h-8 text-sm"
                                  value={assignment.startPage || ""}
                                  onChange={(e) => handleUpdateAssignment(member.id, {
                                    startPage: parseInt(e.target.value) || undefined
                                  })}
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="number"
                                  min={1}
                                  max={templatePageCount}
                                  placeholder="结束页"
                                  className="w-20 h-8 text-sm"
                                  value={assignment.endPage || ""}
                                  onChange={(e) => handleUpdateAssignment(member.id, {
                                    endPage: parseInt(e.target.value) || undefined
                                  })}
                                />
                                {assignment.startPage && assignment.endPage && (
                                  <Badge variant="outline" className="text-xs">
                                    共 {assignment.endPage - assignment.startPage + 1} 页
                                  </Badge>
                                )}
                              </div>
                            )}

                            <Textarea
                              placeholder="描述该成员需要完成的具体工作内容"
                              value={assignment.requirement}
                              onChange={(e) => handleUpdateAssignment(member.id, {
                                requirement: e.target.value
                              })}
                              rows={2}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                </>)}
              </CardContent>
            </>
          )}

          {/* Step 3: Time & Reviewer */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle>时限与审核配置</CardTitle>
                <CardDescription>
                  {taskType === "例会资料"
                    ? "设置截止时间、审核人（汇总审核）和审批人（最终批准）"
                    : "设置截止时间和指定审核人"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>截止日期</Label>
                  <div className="flex gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[200px] justify-start text-left font-normal",
                            !deadlineDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deadlineDate ? format(deadlineDate, "yyyy年MM月dd日", { locale: zhCN }) : "选择日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={deadlineDate}
                          onSelect={setDeadlineDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-[120px]"
                    />
                  </div>
                </div>

                {taskType === "例会资料" ? (
                  <>
                    {/* 审核人（从真实用户中选） */}
                    <div className="space-y-2">
                      <div>
                        <Label>审核人 <span className="text-xs text-muted-foreground font-normal ml-1">— 各部门完成后进行阶段性汇总审核</span></Label>
                      </div>
                      {pptReviewerId ? (
                        (() => {
                          const u = users.find(x => x.id === pptReviewerId)!;
                          return (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="bg-primary text-white font-bold">{u.avatar}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-semibold">{u.name}</p>
                                <p className="text-xs text-muted-foreground">{u.role} · {u.department}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPptReviewerId("")}>更换</Button>
                            </div>
                          );
                        })()
                      ) : (
                        <Button variant="outline" className="w-full border-dashed justify-start text-muted-foreground hover:text-primary hover:border-primary/50"
                          onClick={() => { setReviewerPickerOpen("reviewer"); setRolePickerSearch(""); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          选择审核人
                        </Button>
                      )}
                    </div>

                    {/* 审批人 */}
                    <div className="space-y-2">
                      <div>
                        <Label>审批人 <span className="text-xs text-muted-foreground font-normal ml-1">— 最终合并前的终审批准人</span></Label>
                      </div>
                      {pptApproverId ? (
                        (() => {
                          const u = users.find(x => x.id === pptApproverId)!;
                          return (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="bg-primary text-white font-bold">{u.avatar}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-semibold">{u.name}</p>
                                <p className="text-xs text-muted-foreground">{u.role} · {u.department}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPptApproverId("")}>更换</Button>
                            </div>
                          );
                        })()
                      ) : (
                        <Button variant="outline" className="w-full border-dashed justify-start text-muted-foreground hover:text-primary hover:border-primary/50"
                          onClick={() => { setReviewerPickerOpen("approver"); setRolePickerSearch(""); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          选择审批人
                        </Button>
                      )}
                    </div>

                    {/* 审核人/审批人 选择弹窗 */}
                    <Dialog open={reviewerPickerOpen !== null} onOpenChange={(open) => !open && setReviewerPickerOpen(null)}>
                      <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col p-6 rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            {reviewerPickerOpen === "reviewer" ? "选择审核人" : "选择审批人"}
                          </DialogTitle>
                          <DialogDescription>
                            {reviewerPickerOpen === "reviewer"
                              ? "审核人负责各部门完成后的阶段性汇总审核"
                              : "审批人负责最终合并前的终审批准"}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="relative mt-3 mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="搜索姓名、工号或职位..." className="pl-10 h-10 rounded-xl" value={rolePickerSearch} onChange={(e) => setRolePickerSearch(e.target.value)} />
                        </div>
                        <ScrollArea className="flex-1 -mx-2 px-2">
                          <div className="space-y-4 pb-4">
                            {departments.map(dept => {
                              const deptMembers = users.filter(u =>
                                u.department === dept.name &&
                                (u.name.includes(rolePickerSearch) || u.staffId.includes(rolePickerSearch) || u.role.includes(rolePickerSearch))
                              );
                              if (deptMembers.length === 0) return null;
                              return (
                                <div key={dept.id} className="space-y-2">
                                  <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-1 sticky top-0 bg-background/95 py-1">
                                    <Building2 className="h-4 w-4" />{dept.name}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {deptMembers.map(u => {
                                      const isSelected = reviewerPickerOpen === "reviewer" ? pptReviewerId === u.id : pptApproverId === u.id;
                                      return (
                                        <div key={u.id} onClick={() => {
                                          if (reviewerPickerOpen === "reviewer") setPptReviewerId(u.id);
                                          else setPptApproverId(u.id);
                                          setReviewerPickerOpen(null);
                                        }} className={cn("flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all", isSelected ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "border-border/40 bg-muted/10 hover:bg-primary/5 hover:border-primary/30")}>
                                          <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarFallback className={cn("text-sm font-bold", isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary")}>{u.avatar}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{u.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{u.role} · {u.staffId}</p>
                                          </div>
                                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 ml-auto" />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label>审核人</Label>
                    <Select value={reviewer} onValueChange={setReviewer}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择审核人" />
                      </SelectTrigger>
                      <SelectContent>
                        {reviewerOptions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <span className="font-medium">{r.name}</span>
                            <span className="text-muted-foreground ml-2">({r.title})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* Step 4: Preview & Publish */}
          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle>预览并发布</CardTitle>
                <CardDescription>确认任务信息无误后点击下发</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">任务名称</span>
                    <span className="font-medium">{taskTitle || "未设置"}</span>
                  </div>
                  <div className="flex flex-col gap-2 py-2 border-b border-border">
                    <span className="text-muted-foreground transition-all">任务描述</span>
                    <div className="text-sm bg-muted/30 p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {taskDescription || "无任务描述"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">模板文件</span>
                    <div className="text-right">
                      <span>{templateFile?.name || "未上传"}</span>
                      {templatePageCount > 0 && (
                        <span className="ml-2 text-primary text-sm">({templatePageCount}页)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">截止时间</span>
                    <span>
                      {deadlineDate
                        ? `${format(deadlineDate, "yyyy年MM月dd日", { locale: zhCN })} ${deadlineTime}`
                        : "未设置"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">审核人</span>
                    <span>
                      {taskType === "例会资料"
                        ? (users.find(u => u.id === pptReviewerId)?.name || <span className="text-muted-foreground text-sm">未设置</span>)
                        : (reviewerOptions.find(r => r.id === reviewer)?.name || "")}
                      {taskType !== "例会资料" && (
                        <span className="text-muted-foreground ml-1">
                          ({reviewerOptions.find(r => r.id === reviewer)?.title || ""})
                        </span>
                      )}
                    </span>
                  </div>
                  {taskType === "例会资料" && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">审批人</span>
                      <span>{users.find(u => u.id === pptApproverId)?.name || <span className="text-muted-foreground text-sm">未设置</span>}</span>
                    </div>
                  )}
                </div>

                {/* Assignment List */}
                <div className="space-y-3">
                  <Label>分配清单</Label>
                  {taskType === "例会资料" ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-4 py-2 text-sm font-medium w-1/4">部门 & 负责人</th>
                            <th className="text-left px-4 py-2 text-sm font-medium w-1/4">负责页面</th>
                            <th className="text-left px-4 py-2 text-sm font-medium w-1/2">页面要求</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pptDeptRows.filter(r => r.deptName && parsePageInput(r.pageSelection, templatePageCount).length > 0).map((row, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="px-4 py-3">
                                <div className="font-medium mb-1">{row.deptName}</div>
                                {row.headUserName ? (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Avatar className="h-5 w-5"><AvatarFallback className="text-xs bg-primary/10 text-primary">{row.headUserAvatar}</AvatarFallback></Avatar>
                                    <span className="text-xs">{row.headUserName}</span>
                                  </div>
                                ) : <span className="text-xs text-muted-foreground/70">未指派负责人</span>}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex-col flex gap-1 items-start">
                                  <Badge variant="outline">第 {row.pageSelection} 页</Badge>
                                  <span className="text-xs text-muted-foreground ml-1">共 {parsePageInput(row.pageSelection, templatePageCount).length} 页</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top text-sm">
                                <div className="text-muted-foreground text-xs leading-relaxed max-w-sm">
                                  {row.requirement || <span className="italic opacity-50">无具体要求</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-2 text-sm font-medium">执行人</th>
                          <th className="text-left px-4 py-2 text-sm font-medium">负责页面</th>
                          <th className="text-left px-4 py-2 text-sm font-medium">工作要求</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((assignment) => {
                          const member = getMemberById(assignment.memberId);
                          return (
                            <tr key={assignment.memberId} className="border-t border-border">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                      {member?.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <span className="font-medium">{member?.name}</span>
                                    <p className="text-xs text-muted-foreground">{member?.department}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {assignment.startPage && assignment.endPage ? (
                                  <Badge variant="outline">
                                    第 {assignment.startPage}-{assignment.endPage} 页
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {assignment.requirement || "未填写具体要求"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? () => navigate("/tasks") : handleBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {currentStep === 1 ? "取消" : "上一步"}
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} className="gradient-primary">
                下一步
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handlePublish} className="gradient-primary">
                <Rocket className="h-4 w-4 mr-2" />
                立即下发
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
