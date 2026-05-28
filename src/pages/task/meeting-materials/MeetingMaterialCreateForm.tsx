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
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { getProcessDefinitionFormApi, type FormResponse } from "@/services/apis/forms";
import { getProcessDefinitionsApi, startProcessInstanceApi } from "@/services/apis/processes";
import type { FormDataField } from "@/services/apis/processes";

interface MeetingMaterialCreateFormProps {
  /** 流程类别 code（从 URL 参数传入） */
  categoryCode: string;
  /** 类别显示名称 */
  categoryName?: string;
  /** 流程定义 ID（从 categories API 获取，可选） */
  processDefinitionId?: string;
  onSuccess: (processInstanceId: string) => void;
  onCancel: () => void;
}



export function MeetingMaterialCreateForm({
  categoryCode,
  categoryName,
  processDefinitionId: propDefinitionId,
  onSuccess,
  onCancel,
}: MeetingMaterialCreateFormProps) {
  const { currentUser } = useUserContext();
  const { toast } = useToast();

  const [title, setTitle] = useState(categoryName || categoryCode);
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [deadlineTime, setDeadlineTime] = useState("18:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 动态表单相关状态
  const [dynamicFields, setDynamicFields] = useState<FormDataField[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [loadingForm, setLoadingForm] = useState(true);

  // 页面加载时获取动态表单字段
  useEffect(() => {
    const loadFormFields = async () => {
      setLoadingForm(true);
      try {
        let definitionId = propDefinitionId;

        // 如果没有直接传入 processDefinitionId，从 categories API 获取
        if (!definitionId) {
          const { getProcessCategoriesGroupedApi } = await import("@/services/apis/process-categories");
          const groups = await getProcessCategoriesGroupedApi({ activeOnly: true });
          const allGroups = Array.isArray(groups) ? groups : (groups as any)?.data ?? [];
          for (const group of allGroups) {
            const found = group.items?.find((item: any) => item.code === categoryCode);
            if (found?.processDefinitionId) {
              definitionId = found.processDefinitionId;
              break;
            }
          }
        }

        // 如果还是没有，尝试从流程定义列表匹配
        if (!definitionId) {
          const response = await getProcessDefinitionsApi();
          const definitions = Array.isArray(response)
            ? response
            : (response as any)?.data ?? [];
          const matchedDef = definitions.find(
            (def: any) =>
              def.category === categoryCode ||
              def.key === categoryCode ||
              def.name === categoryCode
          );
          definitionId = matchedDef?.id;
        }

        if (definitionId) {
          const formResponse: FormResponse = await getProcessDefinitionFormApi(definitionId);
          if (formResponse.formData && formResponse.formData.length > 0) {
            setDynamicFields(formResponse.formData);
            const defaults: Record<string, string> = {};
            formResponse.formData.forEach((field) => {
              defaults[field.id] = field.value || "";
            });
            setDynamicValues(defaults);
          }
        }
      } catch (error) {
        console.error("Failed to fetch process form", error);
      } finally {
        setLoadingForm(false);
      }
    };

    void loadFormFields();
  }, [categoryCode, propDefinitionId]);

  const handleDynamicFieldChange = (fieldId: string, value: string) => {
    setDynamicValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "请填写流程名称", variant: "destructive" });
      return;
    }

    // 校验动态表单中可写的必填字段
    for (const field of dynamicFields) {
      if (!field.writable) continue;
      if (field.required && !dynamicValues[field.id]?.trim()) {
        toast({ title: `请填写「${field.name}」`, variant: "destructive" });
        return;
      }
    }

    // 构建提交变量：内置字段 + 动态额外字段
    const variables: Record<string, unknown> = {
      ...dynamicValues,
      title: title.trim(),
      department: currentUser.department || "",
    };
    if (description.trim()) {
      variables.description = description.trim();
    }
    if (deadlineDate) {
      variables.deadline = `${format(deadlineDate, "yyyy-MM-dd")} ${deadlineTime}`;
    }

    setIsSubmitting(true);
    try {
      const instance = await startProcessInstanceApi({
        category_code: categoryCode,
        variables,
      });

      toast({
        title: "流程已启动",
        description: "请在任务中心查看并处理后续节点",
      });
      onSuccess(instance?.id || "");
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
    const disabled = !field.writable;

    // 枚举类型 → 下拉选择
    if (field.type === "enum" && field.enumValues?.length > 0) {
      return (
        <div key={field.id} className="space-y-1.5">
          <Label>
            {field.name}{" "}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={value}
            onValueChange={(v) => handleDynamicFieldChange(field.id, v)}
            disabled={disabled}
          >
            <SelectTrigger className={cn(disabled && "opacity-60 cursor-not-allowed")}>
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
            {field.name}{" "}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground",
                  disabled && "opacity-60 cursor-not-allowed"
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
                onSelect={(d) =>
                  handleDynamicFieldChange(
                    field.id,
                    d ? format(d, "yyyy-MM-dd") : ""
                  )
                }
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
            {field.name}{" "}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={value}
            onValueChange={(v) => handleDynamicFieldChange(field.id, v)}
            disabled={disabled}
          >
            <SelectTrigger className={cn(disabled && "opacity-60 cursor-not-allowed")}>
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
            {field.name}{" "}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="number"
            placeholder={`输入${field.name}`}
            value={value}
            disabled={disabled}
            className={cn(disabled && "opacity-60 cursor-not-allowed")}
            onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
          />
        </div>
      );
    }

    // 默认 string 类型 → 文本输入
    return (
      <div key={field.id} className="space-y-1.5">
        <Label>
          {field.name}{" "}
          {field.required && <span className="text-destructive">*</span>}
        </Label>
        <Input
          placeholder={`输入${field.name}`}
          value={value}
          disabled={disabled}
          className={cn(disabled && "opacity-60 cursor-not-allowed")}
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
          {categoryName || categoryCode} — 填写基本信息后启动流程
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 流程名称（内置） */}
        <div className="space-y-1.5">
          <Label>
            流程名称 <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="输入流程名称"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 描述（内置） */}
        <div className="space-y-1.5">
          <Label>描述</Label>
          <Textarea
            placeholder="填写背景、目的及相关说明..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 截止时间（内置） */}
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
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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

        {/* 动态额外字段（后端返回的非内置字段） */}
        {loadingForm && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载表单字段...
          </div>
        )}
        {!loadingForm && dynamicFields.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <p className="text-sm text-muted-foreground">流程附加字段：</p>
            {dynamicFields.map(renderDynamicField)}
          </div>
        )}

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
            启动
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
