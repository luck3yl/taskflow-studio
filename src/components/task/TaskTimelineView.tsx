import React from "react";
import { Task, Assignee, Submission } from "@/contexts/TaskContext";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileUp, 
  MessageSquare, 
  UserPlus, 
  XCircle,
  Flag
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

interface TaskTimelineViewProps {
  task: Task;
  assignee?: Assignee;
}

interface TimelineEvent {
  id: string;
  type: "created" | "submission" | "approved" | "rejected" | "deadline";
  date: string;
  title: string;
  description?: string;
  user?: string;
  icon: any;
  color: string;
}

export function TaskTimelineView({ task, assignee }: TaskTimelineViewProps) {
  // Generate events based on task and assignee data
  const events: TimelineEvent[] = [];

  // 1. Task Creation
  events.push({
    id: "create",
    type: "created",
    date: task.createdAt,
    title: "任务已发布",
    description: `由 ${task.createdBy} 发布于 ${task.department}`,
    user: task.createdBy,
    icon: Flag,
    color: "text-primary bg-primary/10",
  });

  // 2. Deadline (Future event)
  events.push({
    id: "deadline",
    type: "deadline",
    date: task.deadline,
    title: "截止日期",
    description: "这是最后交稿日期",
    icon: Clock,
    color: "text-destructive bg-destructive/10",
  });

  // 3. Assignee specific events (if provided)
  if (assignee) {
    assignee.submissions.forEach((sub, idx) => {
      // Submission event
      events.push({
        id: `sub-${sub.id}`,
        type: "submission",
        date: sub.submittedAt,
        title: "提交了工作",
        description: `附件: ${sub.fileName} (${sub.fileSize}MB)${sub.note ? ` - ${sub.note}` : ""}`,
        user: assignee.name,
        icon: FileUp,
        color: "text-warning bg-warning/10",
      });

      // Review event
      if (sub.status === "approved") {
        events.push({
          id: `rev-app-${sub.id}`,
          type: "approved",
          date: sub.feedbackAt || sub.submittedAt,
          title: "审核已通过",
          description: sub.feedback || "通过审核",
          user: "负责人",
          icon: CheckCircle2,
          color: "text-success bg-success/10",
        });
      } else if (sub.status === "rejected") {
        events.push({
          id: `rev-rej-${sub.id}`,
          type: "rejected",
          date: sub.feedbackAt || sub.submittedAt,
          title: "审核已驳回",
          description: sub.feedback || "请重新修改",
          user: "负责人",
          icon: XCircle,
          color: "text-destructive bg-destructive/10",
        });
      }
    });
  }

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="relative space-y-0 pb-4">
      {/* Vertical line spanning all events */}
      <div className="absolute left-[11px] top-2 bottom-6 w-[2px] bg-border/40" />

      {sortedEvents.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === sortedEvents.length - 1;
        
        return (
          <div key={event.id} className="relative flex gap-4 pb-6 group">
            {/* Connector mark */}
            <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm ${event.color}`}>
              <Icon className="h-3 w-3" />
            </div>

            <div className="flex-1 space-y-1 pt-0.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-sm font-semibold leading-none tracking-tight">
                  {event.title}
                </h4>
                <div className="text-xs text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-full w-fit">
                  {event.date}
                </div>
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              )}
              {event.user && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold">
                    {event.user.slice(0, 1)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{event.user}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {sortedEvents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          暂无动态记录
        </div>
      )}
    </div>
  );
}
