import { useState, useEffect } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTaskContext } from "@/contexts/TaskContext";
import { useProcess } from "@/contexts/ProcessContext";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { TaskFormKeyEnum, TaskSourceEnum, TaskTypeEnum } from "@/enums/task";
import { getProcessDefinitionFormApi, type FormResponse } from "@/services/apis/forms";
import type { FormDataField } from "@/services/apis/processes";

/** 可选的流程类别（对应后端 category 字段） - 作为 fallback */
const FALLBACK_PROCESS_CATEGORIES = [
  { value: "例会资料", label: "例会资料" },
  { value: "设备管理月报编制", label: "设备管理月报编制" },
  { value: "设备管理月报（成本模块）", label: "设备管理月报（成本模块）" },
  { value: "设备例会材料（成本模块）", label: "设备例会材料（成本模块）" },
  { value: "维修费用使用情况例会材料", label: "维修费用使用情况例会材料" },
];

/** 根据 category 自动生成默认流程名称 */
function generateDefaultTitle(category: string): string {
  return category;
}

interface MeetingMaterialCreateFormProps {
  defaultCategory?: string;
  onSuccess: (taskId: string) => void;
  onCancel: () => void;
}

export function MeetingMaterialCreateForm({
  defaultCategory,
  onSuccess,
  onCancel,
}: MeetingMaterialCreateFormProps) {
  const { addTask } = useTaskContext();
  const { definitions, refreshDefinitions } = useProcess();
  const { currentUser } = useUserContext();
  const { toast } = useToast();

  const [category, setCategory] = useState(defaultCategory || "");
  const [title, setTitle] = useState(defaultCategory ? generateDefaultTitle(defaultCategory) : "");
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [deadlineTime, setDeadlineTime] = useState("18:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProcessKey, setSelectedProcessKey] = useState("");

  // 动态表单相关状态
  const [dynamicFields, setDynamicFields] = useState<FormDataField[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [loadingForm, setLoadingForm] = useState(false);

  // 页面加载时获取流程定义列表
  useEffect(() => {
    refreshDefinitions();
  }, [refreshDefinitions]);

  // 从后端获取的流程定义构建可选列表（只展示未停用的）
  const processOptions = definitions
    .filter(def => !def.suspended)
    .map(def => ({
      key: def.key,
      name: def.name || def.key,
      id: def.id,
    }));

  // 选择流程类别后，请求该流程定义的动态表单字段
  const fetchDynamicForm = async (processDefinitionId: string) => {
    setLoadingForm(true);
    try {
      const formResponse: FormResponse = await getProcessDefinitionFormApi(processDefinitionId);
      if (formResponse.formData && formResponse.formData.length > 0) {
        setDynamicFields(formResponse.formData);
        // 初始化默认值
        const defaults: Record<string, string> = {};
        formResponse.formData.forEach(field => {
          defaults[field.id] = field.value || "";
        });
        setDynamicValues(defaults);
      } else {
        setDynamicFields([]);
        setDynamicValues({});
      }
    } catch (error) {
      console.error("Failed to fetch process form", error);
      setDynamicFields([]);
      setDynamicValues({});
    } finally {
      setLoadingForm(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    // 根据选择的类别找到对应的流程定义
    const matchedDef = processOptions.find(
      def => def.name === value || def.key === value
    );
    setSelectedProcessKey(matchedDef?.key || "ppt_collab");
    // 如果用户没有手动编辑过名称，自动填充
    if (!titleManuallyEdited) {
      setTitle(generateDefaultTitle(value));
    }
    // 请求动态表单字段
    if (matchedDef?.id) {
      fetchDynamicForm(matchedDef.id);
    }
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setTitleManuallyEdited(true);
  };

  const handleDynamicFieldChange = (fieldId: string, value: string) => {
    setDynamicValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    if (!category) {
      toast({ title: "请选择流程类别", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "请填写流程名称", variant: "destructive" });
      return;
    }

    // 校验动态表单必填字段
    for (const field of dynamicFields) {
      if (field.required && !dynamicValues[field.id]?.trim()) {
        toast({ title: `请填写「${field.name}」`, variant: "destructive" });
        return;
      }
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
        category,
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
        // 动态表单字段值作为额外 variables
        extraVariables: dynamicValues,
      });

      toast({
        title: "流程已启动",
        description: "请在任务中心查看并处理后续节点",
      });
      onSuccess(taskId);
    } catch (error) {
      toast({
        title: "启动失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 根据 FormDataField 渲染对应的表单控件 */
  const renderDynamicField = (field: FormDataField) => {
    const value = dynamicValues[field.id] || "";

    // 枚举类型 → 下拉选择
    if (field.type === "enum" && field.enumValues?.length > 0) {
      return (
        <div key={field.id} className="space-y-1.5">
          <Label>
            {field.name} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Select value={value} onValueChange={(v) => handleDynamicFieldChange(field.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder={`选择${field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.enumValues.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // 日期类型 → 日期选择器
    if (field.type === "date") {
      const dateValue = value ? new Date(value) : undefined;
      return (
        <div key={field.id} className="space-y-1.5">
          <Label>
            {field.name} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue
                  ? format(dateValue, "yyyy年M月d日", { locale: zhCN })
                  : `选择${field.name}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(d) => handleDynamicFieldChange(field.id, d ? format(d, "yyyy-MM-dd") : "")}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    // boolean 类型 → 下拉
    if (field.type === "boolean") {
      return (
        <div key={field.id} className="space-y-1.5">
          <Label>
            {field.name} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Select value={value} onValueChange={(v) => handleDynamicFieldChange(field.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder={`选择${field.name}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">是</SelectItem>
              <SelectItem value="false">否</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    // long 类型 → 数字输入
    if (field.type === "long") {
      return (
        <div key={field.id} className="space-y-1.5">
          <Label>
            {field.name} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="number"
            placeholder={`输入${field.name}`}
            value={value}
            onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
          />
        </div>
      );
    }

    // 默认 string 类型 → 文本输入
    return (
      <div key={field.id} className="space-y-1.5">
        <Label>
          {field.name} {field.required && <span className="text-destructive">*</span>}
        </Label>
        <Input
          placeholder={`输入${field.name}`}
          value={value}
          onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
        />
      </div>
    );
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>创建流程</CardTitle>
        <CardDescription>
          选择流程类别并填写基本信息，确认后启动流程
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 流程类别 */}
        <div className="space-y-1.5">
          <Label>
            流程类别 <span className="text-destructive">*</span>
          </Label>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="选择流程类别" />
            </SelectTrigger>
            <SelectContent>
              {processOptions.map((item) => (
                <SelectItem key={item.key} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
              {processOptions.length === 0 && (
                <SelectItem value="_empty" disabled>
                  暂无可用流程定义
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 流程名称 */}
        <div className="space-y-1.5">
          <Label>
            流程名称 <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="选择类别后自动生成，也可手动修改"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </div>

        {/* 描述 */}
        <div className="space-y-1.5">
          <Label>描述</Label>
          <Textarea
            placeholder="填写背景、目的及相关说明..."
            rows={3}
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

        {/* 动态表单字段（来自流程定义的 formData） */}
        {loadingForm && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载表单字段...
          </div>
        )}
        {!loadingForm && dynamicFields.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <p className="text-sm text-muted-foreground">以下为流程附加字段：</p>
            {dynamicFields.filter(f => f.writable).map(renderDynamicField)}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            className="gradient-primary"
            disabled={isSubmitting || !category || !title.trim()}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            启动
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
