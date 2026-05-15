import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MEETING_MATERIAL_USER_STATUS_CONFIG,
  MEETING_MATERIAL_DEPT_STATUS_CONFIG,
  ASSIGNEE_STATUS_CONFIG,
  type StatusDisplayConfig,
} from "@/enums/task";

interface StatusBadgeProps {
  status: string;
  /** 使用哪套状态配置，默认 "user" */
  type?: "user" | "dept" | "assignee";
  /** 是否显示描述 tooltip（预留） */
  showDescription?: boolean;
  className?: string;
}

const CONFIG_MAP: Record<string, Record<string, StatusDisplayConfig>> = {
  user: MEETING_MATERIAL_USER_STATUS_CONFIG,
  dept: MEETING_MATERIAL_DEPT_STATUS_CONFIG,
  assignee: ASSIGNEE_STATUS_CONFIG,
};

/**
 * 通用状态 Badge 组件
 * 根据 status 值和 type 自动渲染对应的样式和文本
 */
export function StatusBadge({
  status,
  type = "user",
  className,
}: StatusBadgeProps) {
  const config = CONFIG_MAP[type]?.[status];

  if (!config) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 px-2 py-0 text-xs border shadow-none font-bold rounded",
        config.className,
        className
      )}
    >
      {config.text}
    </Badge>
  );
}
