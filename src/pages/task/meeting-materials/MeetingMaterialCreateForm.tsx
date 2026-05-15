import { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTaskContext } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { TaskFormKeyEnum, TaskSourceEnum, TaskTypeEnum } from "@/enums/task";

interface MeetingMaterialCreateFormProps {
  onSuccess: (taskId: string) => void;
  onCancel: () => void;
}

export function MeetingMaterialCreateForm({
  onSuccess,
  onCancel,
}: MeetingMaterialCreateFormProps) {
  const { addTask } = useTaskContext();
  const { currentUser } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [deadlineTime, setDeadlineTime] = useState("18:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "请填写任务名称", variant: "destructive" });
      return;
    }

    const formattedDeadline = deadlineDate
      ? `${format(deadlineDate, "yyyy-MM-dd")} ${deadlineTime}`
      : format(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          "yyyy-MM-dd"
        ) + " 18:00";

    setIsSubmitting(true);
    try {
      const taskId = await addTask({
        title: title.trim(),
        description: description.trim(),
        type: TaskTypeEnum.MeetingMaterial,
        formKey: TaskFormKeyEnum.PptCollab,
        department: currentUser.department || "全公司",
        deadline: formattedDeadline,
        createdBy: currentUser.name,
        createdByAvatar: currentUser.avatar,
        totalAssignees: 0,
        assignees: [],
        allowedActions: [],
        source: TaskSourceEnum.Remote,
      });

      toast({
        title: "任务已创建",
        description: "正在跳转到部门分配页面...",
      });
      // 跳转到部门分配页面
      navigate(`/tasks/${taskId}/assign`);
      onSuccess(taskId);
    } catch (error) {
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>新建例会资料任务</CardTitle>
        <CardDescription>
          填写基本信息后创建任务，进入工作台再完成部门分配
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 任务名称 */}
        <div className="space-y-1.5">
          <Label>
            任务名称 <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="例：2026年Q2季度汇报PPT"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 任务描述 */}
        <div className="space-y-1.5">
          <Label>任务描述</Label>
          <Textarea
            placeholder="填写任务背景、目的及相关说明..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 截止时间 */}
        <div className="space-y-1.5">
          <Label>截止时间</Label>
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
                  {deadlineDate
                    ? format(deadlineDate, "yyyy年M月d日", { locale: zhCN })
                    : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadlineDate}
                  onSelect={setDeadlineDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
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

        {/* 操作按钮 */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            className="gradient-primary"
            disabled={isSubmitting || !title.trim()}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            确认
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
