import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormDataField } from "@/services/apis/processes";

interface DynamicFormProps {
  fields: FormDataField[];
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

/**
 * 动态表单组件
 * 根据后端返回的 formData 字段定义动态渲染表单
 */
export function DynamicForm({ fields, onSubmit, onCancel }: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateValue = (fieldId: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    // 清除该字段的错误
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    fields.forEach(field => {
      if (field.required && !values[field.id]?.trim()) {
        nextErrors[field.id] = `${field.name}不能为空`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormDataField) => {
    const value = values[field.id] || "";
    const error = errors[field.id];

    switch (field.type) {
      case "long":
      case "text":
        return (
          <Textarea
            value={value}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={`请输入${field.name}`}
            rows={4}
            className={error ? "border-destructive" : ""}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateValue(field.id, e.target.value)}
            className={error ? "border-destructive" : ""}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value="true"
                checked={value === "true"}
                onChange={() => updateValue(field.id, "true")}
                className="accent-primary"
              />
              <span className="text-sm">是</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value="false"
                checked={value === "false"}
                onChange={() => updateValue(field.id, "false")}
                className="accent-primary"
              />
              <span className="text-sm">否</span>
            </label>
          </div>
        );

      case "enum":
        return (
          <select
            value={value}
            onChange={(e) => updateValue(field.id, e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">请选择{field.name}</option>
            {field.values?.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        );

      case "string":
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={`请输入${field.name}`}
            className={error ? "border-destructive" : ""}
          />
        );
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>填写表单</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {fields.map(field => (
          <div key={field.id} className="space-y-1.5">
            <Label>
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {renderField(field)}
            {errors[field.id] && (
              <p className="text-xs text-destructive">{errors[field.id]}</p>
            )}
          </div>
        ))}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            className="gradient-primary"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            提交
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
