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
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTaskContext, Assignee } from "@/contexts/TaskContext";

const steps = [
  { id: 1, title: "基础定义", icon: FileText },
  { id: 2, title: "任务拆解", icon: Users },
  { id: 3, title: "时限配置", icon: CalendarIcon },
  { id: 4, title: "预览发布", icon: Rocket },
];

const teamMembers = [
  { id: "1", name: "张明", department: "技术部", avatar: "张" },
  { id: "2", name: "李华", department: "技术部", avatar: "李" },
  { id: "3", name: "王芳", department: "产品部", avatar: "王" },
  { id: "4", name: "赵强", department: "市场部", avatar: "赵" },
  { id: "5", name: "陈静", department: "运营部", avatar: "陈" },
  { id: "6", name: "刘洋", department: "产品部", avatar: "刘" },
];

const reviewerOptions = [
  { id: "wang", name: "王总", title: "总经理" },
  { id: "li", name: "李经理", title: "部门经理" },
  { id: "zhang", name: "张主管", title: "项目主管" },
  { id: "chen", name: "陈总监", title: "技术总监" },
];

const departmentOptions = [
  { value: "技术部", label: "技术部" },
  { value: "产品部", label: "产品部" },
  { value: "市场部", label: "市场部" },
  { value: "运营部", label: "运营部" },
  { value: "全公司", label: "全公司" },
];

interface Assignment {
  memberId: string;
  requirement: string;
  startPage?: number;
  endPage?: number;
}

export default function TaskCreate() {
  const [currentStep, setCurrentStep] = useState(1);
  const [taskType, setTaskType] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDepartment, setTaskDepartment] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePageCount, setTemplatePageCount] = useState<number>(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [deadlineTime, setDeadlineTime] = useState("18:00");
  const [reviewer, setReviewer] = useState("wang");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addTask } = useTaskContext();

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
    if (currentStep === 1 && (!taskType || !taskTitle || !taskDepartment)) {
      toast({
        title: "请填写完整信息",
        description: "任务类型、名称和部门为必填项",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 2 && assignments.length === 0) {
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

    const formattedDeadline = deadlineDate
      ? `${format(deadlineDate, "yyyy-MM-dd")} ${deadlineTime}`
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');

    addTask({
      title: taskTitle,
      type: taskType as "周报" | "月报" | "年报" | "专项报告",
      department: taskDepartment,
      deadline: formattedDeadline,
      createdBy: "当前用户",
      createdByAvatar: "我",
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
    navigate("/tasks");
  };

  const getMemberById = (id: string) => teamMembers.find(m => m.id === id);

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
                <CardDescription>选择任务类型、填写名称并上传模板</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>任务类型 *</Label>
                    <Select value={taskType} onValueChange={setTaskType}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择任务类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="周报">周报</SelectItem>
                        <SelectItem value="月报">月报</SelectItem>
                        <SelectItem value="年报">年报</SelectItem>
                        <SelectItem value="专项报告">专项报告</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>所属部门 *</Label>
                    <Select value={taskDepartment} onValueChange={setTaskDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择部门" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>任务名称 *</Label>
                  <Input
                    placeholder="输入任务名称"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
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
                  为每位执行人分配具体的工作包
                  {templatePageCount > 0 && (
                    <span className="ml-2 text-primary">
                      （PPT共 {templatePageCount} 页）
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Page Status */}
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
                        未分配页面：{remainingPages.join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {/* Team Member Selection */}
                <div className="space-y-2">
                  <Label>添加执行人</Label>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers.map((member) => {
                      const isSelected = assignments.some(a => a.memberId === member.id);
                      return (
                        <Button
                          key={member.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => isSelected
                            ? handleRemoveAssignment(member.id)
                            : handleAddAssignment(member.id)
                          }
                          className={isSelected ? "gradient-primary" : ""}
                        >
                          {isSelected ? (
                            <X className="h-4 w-4 mr-1" />
                          ) : (
                            <Plus className="h-4 w-4 mr-1" />
                          )}
                          {member.name}
                          <span className="ml-1 text-xs opacity-70">({member.department})</span>
                        </Button>
                      );
                    })}
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
              </CardContent>
            </>
          )}

          {/* Step 3: Time & Reviewer */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle>时限与审核配置</CardTitle>
                <CardDescription>设置截止时间和指定审核人</CardDescription>
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
                    <span className="text-muted-foreground">任务类型</span>
                    <Badge>{taskType}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">所属部门</span>
                    <Badge variant="secondary">{taskDepartment}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">任务名称</span>
                    <span className="font-medium">{taskTitle}</span>
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
                      {reviewerOptions.find(r => r.id === reviewer)?.name || ""}
                      <span className="text-muted-foreground ml-1">
                        ({reviewerOptions.find(r => r.id === reviewer)?.title || ""})
                      </span>
                    </span>
                  </div>
                </div>

                {/* Assignment List */}
                <div className="space-y-3">
                  <Label>分配清单</Label>
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
