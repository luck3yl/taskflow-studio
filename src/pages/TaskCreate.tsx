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
  Calendar,
  CheckCircle2,
  Rocket,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, title: "基础定义", icon: FileText },
  { id: 2, title: "任务拆解", icon: Users },
  { id: 3, title: "时限配置", icon: Calendar },
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

interface Assignment {
  memberId: string;
  requirement: string;
}

export default function TaskCreate() {
  const [currentStep, setCurrentStep] = useState(1);
  const [taskType, setTaskType] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [deadline, setDeadline] = useState("");
  const [reviewer, setReviewer] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep === 1 && (!taskType || !taskTitle)) {
      toast({
        title: "请填写完整信息",
        description: "任务类型和名称为必填项",
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
    if (assignments.find((a) => a.memberId === memberId)) return;
    setAssignments([...assignments, { memberId, requirement: "" }]);
  };

  const handleRemoveAssignment = (memberId: string) => {
    setAssignments(assignments.filter((a) => a.memberId !== memberId));
  };

  const handleUpdateRequirement = (memberId: string, requirement: string) => {
    setAssignments(assignments.map((a) => (a.memberId === memberId ? { ...a, requirement } : a)));
  };

  const handlePublish = () => {
    toast({
      title: "任务已下发",
      description: "任务已成功分发给相关人员",
    });
    navigate("/tasks");
  };

  const getMemberById = (id: string) => teamMembers.find((m) => m.id === id);

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
                  <div
                    className={`
                    flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all
                    ${isActive ? "border-primary bg-primary text-primary-foreground" : ""}
                    ${isCompleted ? "border-success bg-success text-success-foreground" : ""}
                    ${!isActive && !isCompleted ? "border-border bg-muted text-muted-foreground" : ""}
                  `}
                  >
                    {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
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
                <CardTitle>基础信息</CardTitle>
                <CardDescription>选择任务类型、填写名称并上传模板</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>任务类型 *</Label>
                  <Select value={taskType} onValueChange={setTaskType}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择任务类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ppt">PPT 制作</SelectItem>
                      <SelectItem value="report">填报任务</SelectItem>
                      <SelectItem value="review">审核任务</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>任务名称 *</Label>
                  <Input placeholder="输入任务名称" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>模板文件（可选）</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="template-upload"
                      className="hidden"
                      accept=".ppt,.pptx,.pdf,.doc,.docx"
                      onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="template-upload" className="cursor-pointer">
                      {templateFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="h-8 w-8 text-primary" />
                          <div className="text-left">
                            <p className="font-medium text-foreground">{templateFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(templateFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">点击上传模板文件</p>
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
                <CardDescription>为每位执行人分配具体的工作包</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Team Member Selection */}
                <div className="space-y-2">
                  <Label>添加执行人</Label>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers.map((member) => {
                      const isSelected = assignments.some((a) => a.memberId === member.id);
                      return (
                        <Button
                          key={member.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            isSelected ? handleRemoveAssignment(member.id) : handleAddAssignment(member.id)
                          }
                          className={isSelected ? "gradient-primary" : ""}
                        >
                          {isSelected ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                          {member.name}
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
                            <AvatarFallback className="bg-primary/10 text-primary">{member.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
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
                            <Textarea
                              placeholder="描述该成员需要完成的具体工作，如：负责前3页，公司简介部分"
                              value={assignment.requirement}
                              onChange={(e) => handleUpdateRequirement(member.id, e.target.value)}
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
                  <Label>截止时间</Label>
                  <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>审核人</Label>
                  <Select value={reviewer} onValueChange={setReviewer}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择审核人（默认为自己）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">我自己</SelectItem>
                      <SelectItem value="wang">王总</SelectItem>
                      <SelectItem value="li">李经理</SelectItem>
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
                    <Badge>{taskType === "ppt" ? "PPT 制作" : taskType === "report" ? "填报任务" : "审核任务"}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">任务名称</span>
                    <span className="font-medium">{taskTitle}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">模板文件</span>
                    <span>{templateFile?.name || "未上传"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">截止时间</span>
                    <span>{deadline || "未设置"}</span>
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
                                  <span className="font-medium">{member?.name}</span>
                                </div>
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
            <Button variant="outline" onClick={currentStep === 1 ? () => navigate("/tasks") : handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {currentStep === 1 ? "取消" : "上一步"}
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} className="gradient-primary">
                下一步
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handlePublish} className="gradient-success">
                <Rocket className="h-4 w-4 mr-2" />
                下发任务
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
